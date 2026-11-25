import { planRowPatch } from './rowPatch.js';

test('preserves the IDs of retained rows and only patches changed fields', () => {
  const original = [
    { id: 1n, text: 'Remove', sortOrder: 0 },
    { id: 2n, text: 'Keep', sortOrder: 1 },
    { id: 3n, text: 'Edit', sortOrder: 2 },
  ];
  expect(planRowPatch(original, [
    { text: 'Keep', sortOrder: 0 },
    { text: 'Edit', sortOrder: 1 },
  ], row => row)).toEqual({
    create: [],
    update: [{ row: original[1], data: { sortOrder: 0 } }, { row: original[2], data: { sortOrder: 1 } }],
    remove: [original[0]],
  });
  expect(planRowPatch(original, [
    { text: 'Remove', sortOrder: 0 },
    { text: 'Keep', sortOrder: 1 },
    { text: 'Edited', sortOrder: 2 },
  ], row => row)).toEqual({
    create: [], update: [{ row: original[2], data: { text: 'Edited' } }], remove: [],
  });
});
