import { isDeepStrictEqual } from 'node:util';

// Prisma ignores undefined. Null, false, and empty lists are explicit edits.
export function changedFields(current, desired) {
  return Object.fromEntries(Object.entries(desired)
    .filter(([key, value]) => value !== undefined && !isDeepStrictEqual(current?.[key], value)));
}

// Match unchanged rows first (even if reordered), then pair remaining rows as
// edits. Only genuinely added or removed rows need inserts or deletes.
export function planRowPatch(current, desired, fields, equal = Object.is, orderKey = 'sortOrder') {
  const remaining = new Set(current);
  const pending = [];
  const update = [];
  const create = [];
  const snapshots = new Map(current.map(row => [row, fields(row)]));
  const differs = (row, key, value) => value !== undefined && !equal(snapshots.get(row)[key] ?? null, value ?? null);
  const delta = (row, next) => Object.fromEntries(Object.entries(next).filter(([key, value]) => differs(row, key, value)));
  for (const next of desired) {
    const match = [...remaining].find(row => Object.entries(next).every(([key, value]) => key === orderKey || !differs(row, key, value)));
    if (!match) {
      pending.push(next);
      continue;
    }
    remaining.delete(match);
    const data = delta(match, next);
    if (Object.keys(data).length) update.push({ row: match, data });
  }
  for (const next of pending) {
    const row = remaining.values().next().value;
    if (!row) {
      create.push(next);
      continue;
    }
    remaining.delete(row);
    const data = delta(row, next);
    if (Object.keys(data).length) update.push({ row, data });
  }
  return { create, update, remove: [...remaining] };
}
