export type ElectionTermId = '2026' | '2022';

export interface PartyDefinition {
  id: string;
  code: string;
  name: string;
  shortName: string;
  color: string;
  softBg: string;
  borderColor: string;
  spectrumOrder: number; // Left to right on Swedish council spectrum
  localNote?: string;
}

export interface TermPartySeats {
  partyId: string;
  seats: number;
  voteShare?: string;
  seatChange?: number; // Change compared to previous election
}

export interface ElectionPreset {
  id: string;
  label: string;
  description: string;
  groups: {
    name: string;
    partyIds: string[];
  }[];
}

export interface ElectionTerm {
  id: ElectionTermId;
  label: string;
  period: string;
  totalSeats: number;
  majorityThreshold: number;
  summary: string;
  parties: TermPartySeats[];
  presets: ElectionPreset[];
}

export interface SeatItem {
  id: string;
  partyId: string;
  seatIndex: number; // 1-based within party
  groupId: string; // 'unassigned' or collaboration id
}

export interface CollaborationGroup {
  id: string;
  name: string;
  accentColor: string;
}

export const PARTIES: Record<string, PartyDefinition> = {
  V: {
    id: 'V',
    code: 'V',
    name: 'Vänsterpartiet',
    shortName: 'Vänsterpartiet',
    color: '#991B1B',
    softBg: '#FEF2F2',
    borderColor: '#FECACA',
    spectrumOrder: 1,
  },
  S: {
    id: 'S',
    code: 'S',
    name: 'Arbetarepartiet-Socialdemokraterna',
    shortName: 'Socialdemokraterna',
    color: '#E11D48',
    softBg: '#FFF1F2',
    borderColor: '#FECDD3',
    spectrumOrder: 2,
  },
  MP: {
    id: 'MP',
    code: 'MP',
    name: 'Miljöpartiet de gröna',
    shortName: 'Miljöpartiet',
    color: '#16A34A',
    softBg: '#F0FDF4',
    borderColor: '#BBF7D0',
    spectrumOrder: 3,
  },
  C: {
    id: 'C',
    code: 'C',
    name: 'Centerpartiet',
    shortName: 'Centerpartiet',
    color: '#0D9488',
    softBg: '#F0FDFA',
    borderColor: '#99F6E4',
    spectrumOrder: 4,
  },
  TL: {
    id: 'TL',
    code: 'TL',
    name: 'Tierpslistan',
    shortName: 'Tierpslistan',
    color: '#EA580C',
    softBg: '#FFF7ED',
    borderColor: '#FED7AA',
    spectrumOrder: 5,
    localNote: 'Lokalt kommunparti i Tierp',
  },
  L: {
    id: 'L',
    code: 'L',
    name: 'Liberalerna',
    shortName: 'Liberalerna',
    color: '#0284C7',
    softBg: '#F0F9FF',
    borderColor: '#BAE6FD',
    spectrumOrder: 6,
  },
  KD: {
    id: 'KD',
    code: 'KD',
    name: 'Kristdemokraterna',
    shortName: 'Kristdemokraterna',
    color: '#1D4ED8',
    softBg: '#EFF6FF',
    borderColor: '#BFDBFE',
    spectrumOrder: 7,
  },
  M: {
    id: 'M',
    code: 'M',
    name: 'Moderaterna',
    shortName: 'Moderaterna',
    color: '#1E3A8A',
    softBg: '#EEF2FF',
    borderColor: '#C7D2FE',
    spectrumOrder: 8,
  },
  SD: {
    id: 'SD',
    code: 'SD',
    name: 'Sverigedemokraterna',
    shortName: 'Sverigedemokraterna',
    color: '#CA8A04',
    softBg: '#FEFCE8',
    borderColor: '#FEF08A',
    spectrumOrder: 9,
  },
};

export const ELECTION_TERMS: Record<ElectionTermId, ElectionTerm> = {
  '2026': {
    id: '2026',
    label: 'Valet 2026',
    period: '2026–2030',
    totalSeats: 41,
    majorityThreshold: 21,
    summary:
      'Från och med mandatperioden 2026–2030 minskade Tierps kommunfullmäktige från 49 till 41 mandat. För egen majoritet krävs minst 21 mandat.',
    parties: [
      { partyId: 'S', seats: 11, seatChange: -5 },
      { partyId: 'SD', seats: 7, seatChange: -2 },
      { partyId: 'M', seats: 6, seatChange: -1 },
      { partyId: 'TL', seats: 6, seatChange: 4 },
      { partyId: 'C', seats: 5, seatChange: -3 },
      { partyId: 'KD', seats: 2, seatChange: 0 },
      { partyId: 'MP', seats: 2, seatChange: 1 },
      { partyId: 'V', seats: 2, seatChange: -1 },
      { partyId: 'L', seats: 0, seatChange: -1 },
    ],
    presets: [
      {
        id: 'empty-2026',
        label: 'Nollställ alla',
        description: 'Börja med alla 41 mandat i partibänken.',
        groups: [
          { name: 'Samarbete A', partyIds: [] },
          { name: 'Samarbete B', partyIds: [] },
        ],
      },
      {
        id: 's-c-tl',
        label: 'S + C + TL (22)',
        description: 'Bred majoritet över blockgränsen med lokala Tierpslistan.',
        groups: [
          { name: 'S + C + TL', partyIds: ['S', 'C', 'TL'] },
          { name: 'Möjlig opposition', partyIds: ['M', 'SD', 'KD'] },
        ],
      },
      {
        id: 'm-sd-kd-tl',
        label: 'M + SD + KD + TL (21)',
        description: 'Exakt minsta möjliga majoritet på 21 mandat.',
        groups: [
          { name: 'Höger + TL', partyIds: ['M', 'SD', 'KD', 'TL'] },
          { name: 'Rödgrön + C', partyIds: ['S', 'C', 'MP', 'V'] },
        ],
      },
      {
        id: 's-c-mp-v',
        label: 'S + C + MP + V (20)',
        description: 'Saknar 1 mandat för majoritet (20 av 41).',
        groups: [
          { name: 'Rödgrön + C', partyIds: ['S', 'C', 'MP', 'V'] },
          { name: 'Borgerligt block', partyIds: ['M', 'KD'] },
        ],
      },
      {
        id: 's-m-c',
        label: 'S + M + C (22)',
        description: 'Stort blocköverskridande mittenstyre med 22 mandat.',
        groups: [
          { name: 'S + M + C', partyIds: ['S', 'M', 'C'] },
          { name: 'Övriga partier', partyIds: ['SD', 'TL', 'KD', 'MP', 'V'] },
        ],
      },
    ],
  },
  '2022': {
    id: '2022',
    label: 'Valet 2022',
    period: '2022–2026',
    totalSeats: 49,
    majorityThreshold: 25,
    summary:
      'Under mandatperioden 2022–2026 bestod Tierps kommunfullmäktige av 49 mandat. Kommunen styrdes av minoritetskoalitionen C, M, KD och L (18 mandat).',
    parties: [
      { partyId: 'S', seats: 16 },
      { partyId: 'SD', seats: 9 },
      { partyId: 'C', seats: 8 },
      { partyId: 'M', seats: 7 },
      { partyId: 'V', seats: 3 },
      { partyId: 'KD', seats: 2 },
      { partyId: 'TL', seats: 2 },
      { partyId: 'L', seats: 1 },
      { partyId: 'MP', seats: 1 },
    ],
    presets: [
      {
        id: 'empty-2022',
        label: 'Nollställ alla',
        description: 'Börja med alla 49 mandat i partibänken.',
        groups: [
          { name: 'Samarbete A', partyIds: [] },
          { name: 'Samarbete B', partyIds: [] },
        ],
      },
      {
        id: 'styre-2022',
        label: 'Styret C + M + KD + L (18)',
        description: 'Det borgerliga minoritetsstyret som styrde Tierp 2022–2026.',
        groups: [
          { name: 'Alliansstyre (Minoritetsstyre)', partyIds: ['C', 'M', 'KD', 'L'] },
          { name: 'S + V + MP', partyIds: ['S', 'V', 'MP'] },
        ],
      },
      {
        id: 's-c-mp-v-2022',
        label: 'S + C + V + MP (28)',
        description: 'Stabil majoritet med 3 mandats marginal.',
        groups: [
          { name: 'S + C + V + MP', partyIds: ['S', 'C', 'V', 'MP'] },
          { name: 'M + SD + KD + L', partyIds: ['M', 'SD', 'KD', 'L'] },
        ],
      },
      {
        id: 'm-sd-kd-c-2022',
        label: 'C + M + SD + KD (26)',
        description: 'Borgerligt block med SD uppnår 26 mandat.',
        groups: [
          { name: 'C + M + SD + KD', partyIds: ['C', 'M', 'SD', 'KD'] },
          { name: 'Rödgrön opposition', partyIds: ['S', 'V', 'MP'] },
        ],
      },
    ],
  },
};

export const DEFAULT_COLLABORATIONS: CollaborationGroup[] = [
  { id: 'collab-1', name: 'Samarbete A', accentColor: '#0F172A' },
  { id: 'collab-2', name: 'Samarbete B', accentColor: '#334155' },
];

export const EXTRA_COLLAB_COLORS = ['#0F172A', '#334155', '#0369A1', '#4338CA'];

export function createInitialSeats(termId: ElectionTermId): SeatItem[] {
  const term = ELECTION_TERMS[termId];
  const seats: SeatItem[] = [];

  // Sort parties by spectrum order so hemicycle & default lists look structured
  const sortedParties = [...term.parties]
    .filter((p) => p.seats > 0)
    .sort((a, b) => PARTIES[a.partyId].spectrumOrder - PARTIES[b.partyId].spectrumOrder);

  for (const p of sortedParties) {
    for (let i = 1; i <= p.seats; i++) {
      seats.push({
        id: `${termId}-${p.partyId}-${i}`,
        partyId: p.partyId,
        seatIndex: i,
        groupId: 'unassigned',
      });
    }
  }

  return seats;
}

export interface WinningCoalition {
  partyIds: string[];
  totalSeats: number;
  margin: number;
  partyCount: number;
}

/**
 * Computes all minimal winning coalitions (koalitioner där varje ingående parti
 * är nödvändigt för att behålla majoritet).
 */
export function computeMinimalWinningCoalitions(termId: ElectionTermId): WinningCoalition[] {
  const term = ELECTION_TERMS[termId];
  const activeParties = term.parties.filter((p) => p.seats > 0);
  const threshold = term.majorityThreshold;
  const n = activeParties.length;
  const results: WinningCoalition[] = [];

  const totalSubsets = 1 << n;
  for (let mask = 1; mask < totalSubsets; mask++) {
    let sum = 0;
    const chosen: TermPartySeats[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        sum += activeParties[i].seats;
        chosen.push(activeParties[i]);
      }
    }

    if (sum >= threshold) {
      // Check minimality: removing any single party drops sum below threshold
      const isMinimal = chosen.every((p) => sum - p.seats < threshold);
      if (isMinimal) {
        const sortedIds = chosen
          .sort((a, b) => b.seats - a.seats || PARTIES[a.partyId].spectrumOrder - PARTIES[b.partyId].spectrumOrder)
          .map((p) => p.partyId);

        results.push({
          partyIds: sortedIds,
          totalSeats: sum,
          margin: sum - threshold,
          partyCount: sortedIds.length,
        });
      }
    }
  }

  return results.sort((a, b) => {
    if (a.partyCount !== b.partyCount) return a.partyCount - b.partyCount;
    if (b.totalSeats !== a.totalSeats) return b.totalSeats - a.totalSeats;
    return a.partyIds.join(',').localeCompare(b.partyIds.join(','));
  });
}

/**
 * Given seats already in a collaboration and remaining unassigned parties,
 * returns minimal additions from unassigned parties that reach majority.
 */
export function suggestMajorityCompletions(
  currentSeats: number,
  threshold: number,
  availableParties: { partyId: string; seats: number }[]
): { partyIds: string[]; addedSeats: number; resultingSeats: number }[] {
  const needed = threshold - currentSeats;
  if (needed <= 0) return [];

  const candidates = availableParties.filter((p) => p.seats > 0);
  const n = candidates.length;
  const results: { partyIds: string[]; addedSeats: number; resultingSeats: number }[] = [];

  const totalSubsets = 1 << n;
  for (let mask = 1; mask < totalSubsets; mask++) {
    let added = 0;
    const chosen: { partyId: string; seats: number }[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        added += candidates[i].seats;
        chosen.push(candidates[i]);
      }
    }

    if (added >= needed) {
      const isMinimal = chosen.every((p) => added - p.seats < needed);
      if (isMinimal && chosen.length <= 3) {
        results.push({
          partyIds: chosen
            .sort((a, b) => b.seats - a.seats)
            .map((p) => p.partyId),
          addedSeats: added,
          resultingSeats: currentSeats + added,
        });
      }
    }
  }

  return results
    .sort((a, b) => {
      if (a.partyIds.length !== b.partyIds.length) return a.partyIds.length - b.partyIds.length;
      return a.resultingSeats - b.resultingSeats;
    })
    .slice(0, 6);
}
