import { describe, expect, it } from '@jest/globals';

import { computeBalances, computeTransfers, equalSplit, type Balance } from './settlement';

function sumNet(balances: Balance[]): number {
  return Math.round(balances.reduce((sum, b) => sum + b.net, 0) * 100) / 100;
}

describe('equalSplit', () => {
  it('splits evenly when it divides exactly', () => {
    expect(equalSplit(90, ['a', 'b', 'c'])).toEqual([
      { participantId: 'a', shareAmount: 30 },
      { participantId: 'b', shareAmount: 30 },
      { participantId: 'c', shareAmount: 30 },
    ]);
  });

  it('puts the rounding remainder on the first participant so the total is exact', () => {
    const shares = equalSplit(10, ['a', 'b', 'c']);
    const total = shares.reduce((sum, s) => sum + s.shareAmount, 0);
    expect(Math.round(total * 100) / 100).toBe(10);
    expect(shares[0]!.shareAmount).toBeCloseTo(3.34, 2);
    expect(shares[1]!.shareAmount).toBeCloseTo(3.33, 2);
    expect(shares[2]!.shareAmount).toBeCloseTo(3.33, 2);
  });

  it('returns nothing for an empty participant list', () => {
    expect(equalSplit(100, [])).toEqual([]);
  });
});

describe('computeBalances', () => {
  it('nets to zero across the group once a single payer covers a shared expense', () => {
    const splits = equalSplit(90, ['a', 'b', 'c']);
    const balances = computeBalances(
      ['a', 'b', 'c'],
      [{ amount: 90, paidByParticipantId: 'a' }],
      splits,
    );
    expect(sumNet(balances)).toBe(0);
    expect(balances.find((b) => b.participantId === 'a')!.net).toBe(60);
    expect(balances.find((b) => b.participantId === 'b')!.net).toBe(-30);
    expect(balances.find((b) => b.participantId === 'c')!.net).toBe(-30);
  });

  it('nets to zero with an uneven split and rounding', () => {
    const splits = equalSplit(10, ['a', 'b', 'c']);
    const balances = computeBalances(
      ['a', 'b', 'c'],
      [{ amount: 10, paidByParticipantId: 'b' }],
      splits,
    );
    expect(sumNet(balances)).toBe(0);
  });

  it('ignores an expense paid by someone outside the participant list', () => {
    const balances = computeBalances(
      ['a', 'b'],
      [{ amount: 50, paidByParticipantId: 'ghost' }],
      [],
    );
    expect(balances).toEqual([
      { participantId: 'a', net: 0 },
      { participantId: 'b', net: 0 },
    ]);
  });
});

describe('computeTransfers', () => {
  it('settles a simple two-person debt in one transfer', () => {
    const transfers = computeTransfers([
      { participantId: 'a', net: 30 },
      { participantId: 'b', net: -30 },
    ]);
    expect(transfers).toEqual([{ fromParticipantId: 'b', toParticipantId: 'a', amount: 30 }]);
  });

  it('settles a three-person group in the minimum number of transfers', () => {
    // a paid 90 for a 3-way split: a is owed 60, b and c each owe 30.
    const transfers = computeTransfers([
      { participantId: 'a', net: 60 },
      { participantId: 'b', net: -30 },
      { participantId: 'c', net: -30 },
    ]);
    expect(transfers).toHaveLength(2);
    expect(transfers.every((t) => t.toParticipantId === 'a')).toBe(true);
    const total = transfers.reduce((sum, t) => sum + t.amount, 0);
    expect(total).toBe(60);
  });

  it('produces no transfers once everyone is already settled', () => {
    expect(
      computeTransfers([
        { participantId: 'a', net: 0 },
        { participantId: 'b', net: 0 },
      ]),
    ).toEqual([]);
  });

  it('every transfer leaves both sides closer to zero and the group stays balanced', () => {
    const balances = [
      { participantId: 'a', net: 45.5 },
      { participantId: 'b', net: -10.25 },
      { participantId: 'c', net: -35.25 },
    ];
    const transfers = computeTransfers(balances);
    const net = new Map(balances.map((b) => [b.participantId, b.net]));
    for (const t of transfers) {
      net.set(t.fromParticipantId, (net.get(t.fromParticipantId) ?? 0) + t.amount);
      net.set(t.toParticipantId, (net.get(t.toParticipantId) ?? 0) - t.amount);
    }
    for (const amount of net.values()) {
      expect(Math.abs(amount)).toBeLessThan(0.01);
    }
  });
});
