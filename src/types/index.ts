export type FlagType = 'DO_NOT_OPEN' | 'SITE' | 'INCOMPLETE' | 'AP_CHECK' | 'CLEARED';

export interface BaccRecord {
  id: string;
  rx: string;
  type: string;
  cond: string;
}

export interface YardContainer {
  c: string; // container number
  gate: string;
  bacc: string;
  tsw: string;
  type: string;
  flag: FlagType;
  label: string;
  cond: string;
  instr: string;
  vessel: string;
  voyage: string;
  origin: string;
  cargo: string;
  supplier: string;
  pk: number;
  site: string;
  insp: string;
  real: boolean;
  hist: BaccRecord[];
  reefer: boolean;
}

export interface CheckedOutContainer {
  c: string;
  gate: string;
  out: string;
  final: string;
  bacc: string;
}

export interface AgentRun {
  t: string;
  trig: 'Mailbox poll' | 'WMS check-out' | 'Gatehouse arrival';
  n: number;
  res: string;
}

export interface AgentEvent {
  t: string;
  kind: 'CHECK_OUT' | 'SUPERSEDED' | 'GATE_IN';
  c: string;
  msg: string;
}

export interface SummaryData {
  now: string;
  site: string;
  yardCount: number;
  outCount: number;
  redFlagsCount: number;
  fineExposure: number;
  clearedPct: number;
  earlyPct: number;
  supersededCount: number;
  supersededAvgHours: number;
  mixBreakdown: Array<{
    k: FlagType;
    l: string;
    v: number;
    c: string;
  }>;
  gateInsByDay: Array<{
    d: string;
    red: number;
    oth: number;
  }>;
  trend: 'rising' | 'easing' | 'steady';
  conditions: Array<{
    l: string;
    v: number;
  }>;
  suppliers: Array<{
    l: string;
    v: number;
    n: number;
    r: number;
  }>;
}
