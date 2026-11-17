import { hydrateStudies, writeStudy } from './repository.js';

const types = { dailyVerse: 'verse', dailyDevotion: 'devotion', verseExplanation: 'explanation' };

// Apply an explicit Prisma select after hydration, including nested AI selects.
function selectFields(value, select) {
  if (value == null || !select) return value;
  if (Array.isArray(value)) return value.map(item => selectFields(item, select));
  return Object.fromEntries(Object.entries(select).filter(([, choice]) => choice).map(([field, choice]) =>
    [field, typeof choice === 'object' && choice.select ? selectFields(value[field], choice.select) : value[field]],
  ));
}

/** Explicit feature-facing delegates, not a global Prisma middleware. Counts,
 * filters and deletion remain source-owned. Selected readers fetch the link
 * internally so narrow AI/export queries cannot bypass shared hydration. */
export function sharedStudyReaders(client) {
  return Object.fromEntries(Object.entries(types).map(([model, type]) => [model,
    Object.fromEntries(['findUnique', 'findFirst', 'findMany'].map(method => [method, async (args = {}) => {
      const query = args.select ? { ...args, select: { ...args.select, sharedStudyId: true } } : args;
      const rows = await client[model][method](query);
      const result = await hydrateStudies(client, type, rows);
      return args.select ? selectFields(result, args.select) : result;
    }])),
  ]));
}

/** Daily-content writes keep legacy storage during the compatibility phase,
 * but commit the shared write and source link atomically. The callback receives
 * hydrated current content for partial updates rather than stale legacy copies.
 * Callers invalidate caches only after this transaction succeeds. */
export async function writeDailyContent(client, model, { id, data, expectedVersion }) {
  if (!['dailyVerse', 'dailyDevotion'].includes(model)) throw new Error('Unsupported daily content model');
  const type = types[model];
  return client.$transaction(async tx => {
    const old = id ? await tx[model].findUnique({ where: { id: BigInt(id) } }) : null;
    const current = old ? await hydrateStudies(tx, type, old) : null;
    const source = id
      ? await tx[model].update({ where: { id: BigInt(id) }, data })
      : await tx[model].create({ data });
    // Only provided properties override hydrated content (Prisma ignores undefined).
    const provided = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
    const content = { ...source, ...(current || {}), ...provided, id: source.id, sharedStudyId: source.sharedStudyId };
    await writeStudy(tx, type, content, {
      allowSharedEdit: Boolean(old?.sharedStudyId),
      expectedVersion: expectedVersion ?? current?.sharedStudyVersion,
    });
    return hydrateStudies(tx, type, await tx[model].findUnique({ where: { id: source.id } }));
  }, { timeout: 30000 });
}
