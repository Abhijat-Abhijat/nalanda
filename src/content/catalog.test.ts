import { describe, it, expect } from 'vitest';
import { worlds } from './index';
import { catalog } from './catalog';
import { toOutline } from './outline';
import { loaders } from './load';

describe('catalog', () => {
  it('matches the full content (run npm run catalog if this fails)', () => {
    expect(catalog).toEqual(worlds.map(toOutline));
  });
  it('has a lazy loader for every world', () => {
    expect(Object.keys(loaders).sort()).toEqual(catalog.map((w) => w.id).sort());
  });
});
