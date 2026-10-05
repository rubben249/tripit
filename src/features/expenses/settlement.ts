/**
 * Who-owes-whom for a trip's manual expenses. A positive balance means the
 * participant is owed money overall (they fronted more than their share); a
 * negative balance means they owe money. `computeTransfers` then simplifies
 * those balances into the smallest set of payments that settles everyone up,
 * via the standard largest-debtor-meets-largest-creditor greedy approach —
 * close to optimal for small groups (this circle is ≤15 people), though not
 * a formally-proven minimum solver (that's NP-hard in general).
 */
export interface Balance {
  participantId: string;
  net: number;
}

export interface Transfer {
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
}

const EPSILON = 0.005;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeBalances(
  participantIds: string[],
  expenses: { amount: number; paidByParticipantId: string | null }[],
  splits: { participantId: string; shareAmount: number }[],
): Balance[] {
  const net = new Map<string, number>();
  for (const id of participantIds) net.set(id, 0);

  for (const expense of expenses) {
    if (expense.paidByParticipantId && net.has(expense.paidByParticipantId)) {
      net.set(
        expense.paidByParticipantId,
        (net.get(expense.paidByParticipantId) ?? 0) + expense.amount,
      );
    }
  }
  for (const split of splits) {
    if (net.has(split.participantId)) {
      net.set(split.participantId, (net.get(split.participantId) ?? 0) - split.shareAmount);
    }
  }

  return Array.from(net.entries()).map(([participantId, amount]) => ({
    participantId,
    net: round2(amount),
  }));
}

export function computeTransfers(balances: Balance[]): Transfer[] {
  const creditors = balances
    .filter((b) => b.net > EPSILON)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.net - a.net);
  const debtors = balances
    .filter((b) => b.net < -EPSILON)
    .map((b) => ({ participantId: b.participantId, net: -b.net }))
    .sort((a, b) => b.net - a.net);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i]!.net, creditors[j]!.net);
    if (amount > EPSILON) {
      transfers.push({
        fromParticipantId: debtors[i]!.participantId,
        toParticipantId: creditors[j]!.participantId,
        amount: round2(amount),
      });
    }
    debtors[i]!.net -= amount;
    creditors[j]!.net -= amount;
    if (debtors[i]!.net <= EPSILON) i++;
    if (creditors[j]!.net <= EPSILON) j++;
  }
  return transfers;
}

/** Splits an amount into `participantIds.length` equal shares that add up exactly to `amount` — any leftover cent from rounding goes to the first participant, so the sum is always exact. */
export function equalSplit(
  amount: number,
  participantIds: string[],
): { participantId: string; shareAmount: number }[] {
  if (participantIds.length === 0) return [];
  const base = Math.floor((amount / participantIds.length) * 100) / 100;
  const shares = participantIds.map((participantId) => ({ participantId, shareAmount: base }));
  const remainder = round2(amount - base * participantIds.length);
  if (remainder !== 0) {
    shares[0]!.shareAmount = round2(shares[0]!.shareAmount + remainder);
  }
  return shares;
}
