import {
  YardContainer,
  CheckedOutContainer,
  AgentRun,
  AgentEvent,
  SummaryData,
  FlagType
} from '../../types/index.ts';
import {
  INITIAL_NOW,
  SITE_NAME,
  INITIAL_YARD,
  INITIAL_OUT,
  INITIAL_RUNS,
  INITIAL_EVENTS
} from './initialData.ts';

export const RED_FLAGS: FlagType[] = ['DO_NOT_OPEN', 'SITE'];

export const FLAG_LABELS: Record<FlagType, { cls: string; label: string }> = {
  DO_NOT_OPEN: { cls: 'b-bad', label: 'Do not open' },
  SITE: { cls: 'b-bad', label: 'Wrong site' },
  INCOMPLETE: { cls: 'b-warn', label: 'Check BACC' },
  AP_CHECK: { cls: 'b-info', label: 'AP / TFO check' },
  CLEARED: { cls: 'b-ok', label: 'Cleared' }
};

export interface ComplianceRepository {
  getYardContainers(filter?: { flag?: string; search?: string }): Promise<YardContainer[]>;
  getContainer(containerNumber: string): Promise<YardContainer | null>;
  getCheckedOutContainers(search?: string): Promise<CheckedOutContainer[]>;
  getSummary(): Promise<SummaryData>;
  getRuns(): Promise<AgentRun[]>;
  getEvents(): Promise<AgentEvent[]>;
  gateInContainer(container: YardContainer): Promise<YardContainer>;
  updateContainerBacc(
    containerNumber: string,
    update: {
      bacc: string;
      flag: FlagType;
      label: string;
      cond: string;
      instr?: string;
      rx?: string;
      type?: string;
    }
  ): Promise<YardContainer | null>;
  checkoutContainer(containerNumber: string, outTime?: string): Promise<CheckedOutContainer | null>;
  addRun(run: AgentRun): Promise<AgentRun>;
  triggerPoll(): Promise<{ newBaccs: number; updatedContainers: string[] }>;
}

export class InMemoryComplianceRepository implements ComplianceRepository {
  private yard: YardContainer[] = JSON.parse(JSON.stringify(INITIAL_YARD));
  private out: CheckedOutContainer[] = JSON.parse(JSON.stringify(INITIAL_OUT));
  private runs: AgentRun[] = JSON.parse(JSON.stringify(INITIAL_RUNS));
  private events: AgentEvent[] = JSON.parse(JSON.stringify(INITIAL_EVENTS));
  private now: string = INITIAL_NOW;
  private site: string = SITE_NAME;

  async getYardContainers(filter?: { flag?: string; search?: string }): Promise<YardContainer[]> {
    let result = [...this.yard];

    if (filter?.flag) {
      result = result.filter(y => y.flag === filter.flag);
    }

    if (filter?.search) {
      const s = filter.search.trim().toLowerCase();
      result = result.filter(y =>
        [y.c, y.bacc, y.tsw, y.vessel, y.supplier, y.cargo, y.origin].some(v =>
          String(v || '').toLowerCase().includes(s)
        )
      );
    }

    // Sort: Red flags first, then by gate-in time desc
    return result.sort((a, b) => {
      const aIsRed = RED_FLAGS.includes(a.flag) ? 1 : 0;
      const bIsRed = RED_FLAGS.includes(b.flag) ? 1 : 0;
      if (aIsRed !== bIsRed) return bIsRed - aIsRed;
      return a.gate < b.gate ? 1 : -1;
    });
  }

  async getContainer(containerNumber: string): Promise<YardContainer | null> {
    const item = this.yard.find(y => y.c.toUpperCase() === containerNumber.toUpperCase());
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async getCheckedOutContainers(search?: string): Promise<CheckedOutContainer[]> {
    let result = [...this.out];
    if (search) {
      const s = search.trim().toLowerCase();
      result = result.filter(o =>
        [o.c, o.bacc, o.final].some(v => String(v || '').toLowerCase().includes(s))
      );
    }
    return result.sort((a, b) => (a.out < b.out ? 1 : -1));
  }

  async getSummary(): Promise<SummaryData> {
    const tot = this.yard.length || 1;
    const reds = this.yard.filter(y => RED_FLAGS.includes(y.flag));
    const cleared = this.yard.filter(y => y.flag === 'CLEARED');
    const early = this.yard.filter(y => y.hist.length && y.hist[0].rx < y.gate).length;

    const sup = this.yard.filter(y => y.hist.length > 1);
    const hrs = sup
      .map(y => {
        const lastRx = new Date(y.hist[y.hist.length - 1].rx.replace(' ', 'T')).getTime();
        const gateTime = new Date(y.gate.replace(' ', 'T')).getTime();
        return (lastRx - gateTime) / 3600000;
      })
      .filter(v => v >= 0);
    const avgH = hrs.length ? hrs.reduce((a, b) => a + b, 0) / hrs.length : 0;

    const cols: Record<FlagType, string> = {
      DO_NOT_OPEN: '#D0342C',
      SITE: '#8E1519',
      INCOMPLETE: '#E8A317',
      AP_CHECK: '#2E6DA4',
      CLEARED: '#2E8B3D'
    };

    const flagKeys: FlagType[] = ['DO_NOT_OPEN', 'SITE', 'INCOMPLETE', 'AP_CHECK', 'CLEARED'];
    const mixBreakdown = flagKeys
      .map(k => ({
        k,
        l: FLAG_LABELS[k].label,
        v: this.yard.filter(y => y.flag === k).length,
        c: cols[k]
      }))
      .filter(x => x.v > 0);

    // Days calculation (last 9 days)
    const days: string[] = [];
    const nowDate = new Date(this.now.replace(' ', 'T'));
    for (let i = 8; i >= 0; i--) {
      const d = new Date(nowDate);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const gateInsByDay = days.map(d => {
      const yardOnDay = this.yard.filter(y => y.gate.slice(0, 10) === d);
      const outOnDay = this.out.filter(o => o.gate.slice(0, 10) === d);
      const red = yardOnDay.filter(y => RED_FLAGS.includes(y.flag)).length;
      const total = yardOnDay.length + outOnDay.length;
      return {
        d,
        red,
        oth: total - red
      };
    });

    const last3 = gateInsByDay.slice(-3).reduce((a, b) => a + b.red, 0);
    const prev3 = gateInsByDay.slice(-6, -3).reduce((a, b) => a + b.red, 0);
    const trend: 'rising' | 'easing' | 'steady' =
      last3 > prev3 ? 'rising' : last3 < prev3 ? 'easing' : 'steady';

    // Conditions count for red flags
    const condCounts: Record<string, number> = {};
    reds.forEach(y => {
      const k =
        y.flag === 'SITE'
          ? 'Authorised to a different site'
          : y.cond.split(/[.,]/)[0].slice(0, 60);
      condCounts[k] = (condCounts[k] || 0) + 1;
    });
    const conditions = Object.entries(condCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([l, v]) => ({ l, v }));

    // Suppliers with red flags
    const bySup: Record<string, { n: number; r: number }> = {};
    this.yard.forEach(y => {
      if (!y.supplier || y.supplier === '-') return;
      if (!bySup[y.supplier]) bySup[y.supplier] = { n: 0, r: 0 };
      bySup[y.supplier].n++;
      if (RED_FLAGS.includes(y.flag)) bySup[y.supplier].r++;
    });
    const suppliers = Object.entries(bySup)
      .filter(([_, s]) => s.r > 0)
      .sort((a, b) => b[1].r - a[1].r)
      .slice(0, 6)
      .map(([l, s]) => ({
        l: `${l} (${s.r} of ${s.n})`,
        v: s.r,
        n: s.n,
        r: s.r
      }));

    return {
      now: this.now,
      site: this.site,
      yardCount: this.yard.length,
      outCount: this.out.length,
      redFlagsCount: reds.length,
      fineExposure: reds.length * 15000,
      clearedPct: cleared.length / tot,
      earlyPct: early / tot,
      supersededCount: sup.length,
      supersededAvgHours: avgH,
      mixBreakdown,
      gateInsByDay,
      trend,
      conditions,
      suppliers
    };
  }

  async getRuns(): Promise<AgentRun[]> {
    return [...this.runs];
  }

  async getEvents(): Promise<AgentEvent[]> {
    return [...this.events];
  }

  async gateInContainer(container: YardContainer): Promise<YardContainer> {
    const existingIdx = this.yard.findIndex(
      y => y.c.toUpperCase() === container.c.toUpperCase()
    );
    if (existingIdx >= 0) {
      this.yard[existingIdx] = container;
    } else {
      this.yard.unshift(container);
    }

    const newEvent: AgentEvent = {
      t: this.now,
      kind: 'GATE_IN',
      c: container.c,
      msg: `Gated in at NIDC. 1 BACC(s) matched. Result: ${container.label}`
    };
    this.events.unshift(newEvent);

    const newRun: AgentRun = {
      t: this.now,
      trig: 'Gatehouse arrival',
      n: 1,
      res: `${container.c} - Result: ${container.label}`
    };
    this.runs.unshift(newRun);

    return container;
  }

  async updateContainerBacc(
    containerNumber: string,
    update: {
      bacc: string;
      flag: FlagType;
      label: string;
      cond: string;
      instr?: string;
      rx?: string;
      type?: string;
    }
  ): Promise<YardContainer | null> {
    const container = this.yard.find(
      y => y.c.toUpperCase() === containerNumber.toUpperCase()
    );
    if (!container) return null;

    const oldBacc = container.bacc;
    container.bacc = update.bacc;
    container.flag = update.flag;
    container.label = update.label;
    container.cond = update.cond;
    if (update.instr) container.instr = update.instr;

    const rxTime = update.rx || this.now;
    container.hist.push({
      id: update.bacc,
      rx: rxTime,
      type: update.type || (update.flag === 'CLEARED' ? 'RELEASE' : 'INSPECTION'),
      cond: update.cond
    });

    const eventMsg =
      update.flag === 'CLEARED'
        ? `New BACC ${update.bacc} supersedes ${oldBacc}: now Cleared - red flag removed`
        : `New BACC ${update.bacc} received for ${container.c}: ${update.label}`;

    this.events.unshift({
      t: this.now,
      kind: 'SUPERSEDED',
      c: container.c,
      msg: eventMsg
    });

    this.runs.unshift({
      t: this.now,
      trig: 'Mailbox poll',
      n: 1,
      res: `BACC ${update.bacc} matched ${container.c} -> ${update.label}`
    });

    return container;
  }

  async checkoutContainer(containerNumber: string, outTime?: string): Promise<CheckedOutContainer | null> {
    const idx = this.yard.findIndex(
      y => y.c.toUpperCase() === containerNumber.toUpperCase()
    );
    if (idx < 0) return null;

    const [removed] = this.yard.splice(idx, 1);
    const checkoutItem: CheckedOutContainer = {
      c: removed.c,
      gate: removed.gate,
      out: outTime || this.now,
      final: removed.label,
      bacc: removed.bacc
    };

    this.out.unshift(checkoutItem);

    this.events.unshift({
      t: this.now,
      kind: 'CHECK_OUT',
      c: removed.c,
      msg: 'Checked out of WMS (empty, returned to shipping line). Removed from dashboard, kept in database.'
    });

    this.runs.unshift({
      t: this.now,
      trig: 'WMS check-out',
      n: 1,
      res: `${removed.c} - Removed from dashboard, kept in database.`
    });

    return checkoutItem;
  }

  async addRun(run: AgentRun): Promise<AgentRun> {
    this.runs.unshift(run);
    return run;
  }

  async triggerPoll(): Promise<{ newBaccs: number; updatedContainers: string[] }> {
    // Simulate reading mailbox and finding any newly cleared BACCs for red-flagged containers
    const candidates = this.yard.filter(y => y.flag === 'DO_NOT_OPEN');
    const updated: string[] = [];

    if (candidates.length > 0) {
      const lucky = candidates[Math.floor(Math.random() * candidates.length)];
      const randomBacc = `B2026/${Math.floor(200000 + Math.random() * 90000)}`;
      await this.updateContainerBacc(lucky.c, {
        bacc: randomBacc,
        flag: 'CLEARED',
        label: 'Cleared',
        cond: 'Cleared following MPI inspection - all biosecurity requirements met.',
        instr: 'Devan on arrival. No MPI action.',
        type: 'RELEASE'
      });
      updated.push(lucky.c);
    }

    this.runs.unshift({
      t: this.now,
      trig: 'Mailbox poll',
      n: updated.length,
      res:
        updated.length > 0
          ? `${updated.length} new BACC(s) read and matched (${updated.join(', ')})`
          : 'No new BACCs in mailbox.'
    });

    return {
      newBaccs: updated.length,
      updatedContainers: updated
    };
  }
}

// Global singleton repository
export const repository: ComplianceRepository = new InMemoryComplianceRepository();
