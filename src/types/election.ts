export interface Candidate {
  id: string; // '91' | '92' | '93'
  number: string;
  name: string;
  age: number;
  profession: string;
  focus: string;
  slogan: string;
  bio: string;
  proposals: string[];
  whoPays: string;
  peopleQuestion: string;
  populationQuestion?: string;
}

export type ElectionStatus = 'waiting' | 'voting' | 'tallying' | 'finished';

export interface ElectionState {
  status: ElectionStatus;
  urnaOpen: boolean;
  currentRound: 1 | 2;
  activePresentation: string | null;
  activeCandidates: string[];
  totalConnected: number;
  totalVotesRound1: number;
  totalVotesRound2: number;
  hasVotedInRound?: boolean;
}

export interface CandidateResult {
  number: string;
  name: string;
  focus: string;
  votes: number;
  percentValid: number;
  percentTotal: number;
}

export interface ElectionResults {
  round: 1 | 2;
  totalVotes: number;
  validVotes: number;
  candidates: Record<string, CandidateResult>;
  blankVotes: {
    votes: number;
    percentTotal: number;
  };
  nullVotes: {
    votes: number;
    percentTotal: number;
  };
  connectedStudents: number;
  abstentions: number;
  winnerId: string | null;
  needsSecondRound: boolean;
  secondRoundCandidates?: [string, string];
  tieDetected?: boolean;
  tieCandidates?: string[];
}

export interface StudentPresence {
  deviceId: string;
  nickname: string;
  lastActive: number;
  votedRound1: boolean;
  votedRound2: boolean;
}
