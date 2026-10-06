import { describe, expect, it } from '@jest/globals';

import { bookingCategories, categoryKeys, isBookableCategory } from './categories';

describe('bookable categories', () => {
  it('holds the things you reserve or pay for ahead of time', () => {
    expect(isBookableCategory('accommodation')).toBe(true);
    expect(isBookableCategory('ticket_activity')).toBe(true);
    expect(isBookableCategory('flight')).toBe(true);
    expect(isBookableCategory('train')).toBe(true);
    expect(isBookableCategory('local_transport')).toBe(true);
    expect(isBookableCategory('restaurant')).toBe(true);
  });

  it('excludes what you simply do when you get there', () => {
    expect(isBookableCategory('sightseeing')).toBe(false);
    expect(isBookableCategory('walking')).toBe(false);
    expect(isBookableCategory('leisure')).toBe(false);
    expect(isBookableCategory('shopping')).toBe(false);
  });

  it('gives every category a complete record', () => {
    for (const key of categoryKeys) {
      const category = bookingCategories[key];
      expect(category.key).toBe(key);
      expect(typeof category.bookable).toBe('boolean');
      expect(typeof category.isRange).toBe('boolean');
      expect(category.label.length).toBeGreaterThan(0);
    }
  });
});
