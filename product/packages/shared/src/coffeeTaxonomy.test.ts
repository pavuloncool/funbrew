import { describe, expect, it } from 'vitest';

import {
  labelForSelectedId,
  labelsForSelectedIds,
  loadBrewMethodOptions,
  loadTastingNoteOptions,
  sanitizeSelectedIds,
  toggleSelectedId,
} from './coffeeTaxonomy';

function createMockSupabase(tableResponses: Record<string, { data: unknown[] | null; error: { message: string } | null }>) {
  return {
    from(table: string) {
      return {
        select() {
          return {
            order() {
              return {
                returns() {
                  return Promise.resolve(
                    tableResponses[table] ?? {
                      data: [],
                      error: null,
                    }
                  );
                },
              };
            },
          };
        },
      };
    },
  } as never;
}

describe('coffee taxonomy helpers', () => {
  it('sanitizes ids and preserves first valid occurrence order', () => {
    expect(
      sanitizeSelectedIds(
        ['b', 'missing', 'a', 'b'],
        [
          { id: 'a' },
          { id: 'b' },
        ]
      )
    ).toEqual(['b', 'a']);
  });

  it('toggles multi-select values with an optional limit', () => {
    expect(toggleSelectedId(['a'], 'a')).toEqual([]);
    expect(toggleSelectedId(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleSelectedId(['a'], 'b', 1)).toEqual(['a']);
  });

  it('maps selected labels for single and multi select UIs', () => {
    const options = [
      { id: 'v60', name: 'V60', label: 'V60' },
      { id: 'espresso', name: 'Espresso', label: 'Espresso' },
    ];
    expect(labelForSelectedId(options, 'espresso', 'Fallback')).toBe('Espresso');
    expect(labelsForSelectedIds(options, ['espresso', 'v60'], (option) => option.label)).toEqual([
      'V60',
      'Espresso',
    ]);
  });
});

describe('loadBrewMethodOptions', () => {
  it('returns ordered brew method options from Supabase rows', async () => {
    const result = await loadBrewMethodOptions(
      createMockSupabase({
        brew_methods: {
          data: [
            { id: '2', name: 'Espresso', sort_order: 2 },
            { id: '1', name: 'V60', sort_order: 1 },
          ],
          error: null,
        },
      })
    );

    expect(result).toEqual([
      { id: '2', name: 'Espresso', sortOrder: 2 },
      { id: '1', name: 'V60', sortOrder: 1 },
    ]);
  });
});

describe('loadTastingNoteOptions', () => {
  it('maps tasting notes onto canonical labels and ordering', async () => {
    const result = await loadTastingNoteOptions(
      createMockSupabase({
        tasting_notes: {
          data: [
            { id: '2', name: 'chocolate', label: 'Chocolate', category: 'sweet', sort_order: 20 },
            { id: '1', name: 'berry', label: 'Berry', category: 'fruity', sort_order: 10 },
          ],
          error: null,
        },
      })
    );

    expect(result).toEqual([
      { id: '1', name: 'berry', label: 'Berry', category: 'fruity', sortOrder: 1 },
      { id: '2', name: 'chocolate', label: 'Chocolate', category: 'sweet', sortOrder: 6 },
    ]);
  });

  it('falls back to flavor_notes when tasting_notes query fails', async () => {
    const result = await loadTastingNoteOptions(
      createMockSupabase({
        tasting_notes: {
          data: null,
          error: { message: 'missing table' },
        },
        flavor_notes: {
          data: [
            { id: '3', name: 'brown_sugar', label: 'Brown sugar', category: 'sweet', sort_order: 1 },
          ],
          error: null,
        },
      })
    );

    expect(result).toEqual([
      { id: '3', name: 'brown-sugar', label: 'Brown Sugar', category: 'sweet', sortOrder: 9 },
    ]);
  });
});
