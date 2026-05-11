// Pure helpers for venture share-math. The DB trigger is authoritative; these
// mirror the math so the UI can show targets/deltas without round-trips.

export type ContributionRow = {
  contributor_kind: "me" | "participant";
  participant_id: string | null;
  amount: number; // paise
};

export type ParticipantRow = {
  id: string;
  name: string;
  percentage: number;
};

export type VentureShares = {
  total_invested: number; // paise
  my_target: number;
  my_actual: number;
  my_delta: number; // positive = overpaid (others owe you)
  participants: Array<{
    id: string;
    name: string;
    percentage: number;
    target: number;
    actual: number;
    delta: number; // positive = overpaid (you owe them)
  }>;
};

export function computeShares(
  myPercentage: number,
  participants: ParticipantRow[],
  contributions: ContributionRow[]
): VentureShares {
  const total = contributions.reduce((s, c) => s + c.amount, 0);
  const myActual = contributions
    .filter((c) => c.contributor_kind === "me")
    .reduce((s, c) => s + c.amount, 0);
  const myTarget = Math.floor((total * myPercentage) / 100);

  const partRows = participants.map((p) => {
    const actual = contributions
      .filter((c) => c.participant_id === p.id)
      .reduce((s, c) => s + c.amount, 0);
    const target = Math.floor((total * p.percentage) / 100);
    return {
      id: p.id,
      name: p.name,
      percentage: p.percentage,
      target,
      actual,
      delta: actual - target,
    };
  });

  return {
    total_invested: total,
    my_target: myTarget,
    my_actual: myActual,
    my_delta: myActual - myTarget,
    participants: partRows,
  };
}

export function percentageRemaining(myPct: number, participants: ParticipantRow[]) {
  const sum = participants.reduce((s, p) => s + p.percentage, 0);
  return Math.max(0, 100 - myPct - sum);
}
