import React from 'react';
import { SummaryData, FlagType } from '../types/index.ts';

interface ExecutiveSummaryProps {
  summary: SummaryData;
  onNavigateToStatus: (flagFilter?: string) => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  summary,
  onNavigateToStatus,
}) => {
  const n = (v: number) => Number(v).toLocaleString('en-NZ');
  const p0 = (v: number) => Math.round(v * 100) + '%';

  const tot = summary.yardCount || 1;

  // Donut conic gradient calculation
  let acc = 0;
  const segs = summary.mixBreakdown
    .map((x) => {
      const s = (acc / tot) * 360;
      acc += x.v;
      return `${x.c} ${s.toFixed(1)}deg ${((acc / tot) * 360).toFixed(1)}deg`;
    })
    .join(',');

  // Gate-ins max for 9 days
  const maxDayCount = Math.max(
    1,
    ...summary.gateInsByDay.map((b) => b.red + b.oth)
  );

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <div className="hero-title">
          MPI Container Compliance &middot; Executive Summary
        </div>
        <div className="hero-sub">
          Every container reaching the NIDC gatehouse is checked against all BACCs
          received for it; the newest BACC always wins. Opening a container
          without MPI authorisation carries a <b>$15,000 fine</b>. The
          container-level list sits in <b>MPI Status</b>.
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">{summary.yardCount}</div>
            <div className="hero-stat-label">Containers in yard</div>
          </div>
          <div className="hero-stat bad">
            <div className="hero-stat-value">{summary.redFlagsCount}</div>
            <div className="hero-stat-label">Red flags</div>
          </div>
          <div className="hero-stat warn">
            <div className="hero-stat-value">${n(summary.fineExposure)}</div>
            <div className="hero-stat-label">Fine exposure if opened</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{p0(summary.clearedPct)}</div>
            <div className="hero-stat-label">Yard cleared to devan</div>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <div
          className="kpi c-bad click"
          onClick={() => onNavigateToStatus('DO_NOT_OPEN')}
        >
          <div className="kpi-label">Red flags</div>
          <div className="kpi-value">{n(summary.redFlagsCount)}</div>
          <div className="kpi-foot">
            {p0(summary.redFlagsCount / tot)} of the yard &middot; view list
          </div>
        </div>

        <div className="kpi c-ok">
          <div className="kpi-label">Answer ready at gate</div>
          <div className="kpi-value">{p0(summary.earlyPct)}</div>
          <div className="kpi-foot">BACC received before arrival</div>
        </div>

        <div
          className="kpi c-info click"
          onClick={() => onNavigateToStatus('')}
        >
          <div className="kpi-label">Holds lifted by newer BACC</div>
          <div className="kpi-value">{n(summary.supersededCount)}</div>
          <div className="kpi-foot">
            Avg {summary.supersededAvgHours.toFixed(0)} hrs after gate-in
          </div>
        </div>

        <div
          className="kpi c-grey click"
          onClick={() => onNavigateToStatus('OUT')}
        >
          <div className="kpi-label">Checked out &middot; on record</div>
          <div className="kpi-value">{n(summary.outCount)}</div>
          <div className="kpi-foot">Off dashboard, retained</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row">
        {/* Donut: Yard at a glance */}
        <div className="panel half">
          <div className="panel-title">
            <span>Yard at a glance</span>
            <span className="panel-sub">{summary.yardCount} containers on site</span>
          </div>
          <div style={{ display: 'flex', gap: '22px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '170px',
                height: '170px',
                borderRadius: '50%',
                position: 'relative',
                background: `conic-gradient(${segs})`,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '28px',
                  background: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#B3212C' }}>
                  {summary.redFlagsCount}
                </div>
                <div className="subtle">red flags</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              {summary.mixBreakdown.map((x) => (
                <div
                  key={x.k}
                  className="srow"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigateToStatus(x.k)}
                >
                  <span className="srow-l">
                    <span className="leg-sw" style={{ background: x.c }}></span>
                    {x.l}
                  </span>
                  <span className="srow-v">
                    {x.v} <span className="subtle">{p0(x.v / tot)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 9-day Gate-ins stacked bar chart */}
        <div className="panel half">
          <div className="panel-title">
            <span>Gate-ins, last 9 days</span>
            <span className="panel-sub">Red-flag pressure is {summary.trend}</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              height: '170px',
            }}
          >
            {summary.gateInsByDay.map((b) => (
              <div
                key={b.d}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  height: '100%',
                }}
                title={`${b.d}: ${b.red} red, ${b.oth} other`}
              >
                <div
                  style={{
                    fontSize: '10px',
                    textAlign: 'center',
                    fontWeight: 700,
                  }}
                >
                  {b.red + b.oth}
                </div>
                <div
                  style={{
                    height: `${(b.oth / maxDayCount) * 130}px`,
                    background: '#8FCC78',
                    borderRadius: '4px 4px 0 0',
                  }}
                ></div>
                <div
                  style={{
                    height: `${(b.red / maxDayCount) * 130}px`,
                    background: '#D0342C',
                  }}
                ></div>
                <div
                  className="subtle"
                  style={{
                    fontSize: '9.5px',
                    textAlign: 'center',
                    marginTop: '4px',
                  }}
                >
                  {b.d.slice(8)}/{b.d.slice(5, 7)}
                </div>
              </div>
            ))}
          </div>
          <div className="legend">
            <span className="leg-item">
              <span className="leg-sw" style={{ background: '#D0342C' }}></span>
              Red flag (still in yard)
            </span>
            <span className="leg-item">
              <span className="leg-sw" style={{ background: '#8FCC78' }}></span>
              Cleared, AP check or checked out
            </span>
          </div>
        </div>
      </div>

      {/* Conditions and Suppliers Progress Rows */}
      <div className="row">
        {/* Conditions */}
        <div className="panel half">
          <div className="panel-title">
            <span>What MPI is asking for</span>
            <span className="panel-sub">Red flags in the yard</span>
          </div>
          {summary.conditions.map((item) => {
            const maxVal = Math.max(
              ...summary.conditions.map((c) => c.v),
              1
            );
            return (
              <div
                key={item.l}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '9px',
                  fontSize: '12px',
                }}
              >
                <div
                  style={{
                    width: '230px',
                    flexShrink: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={item.l}
                >
                  {item.l}
                </div>
                <div
                  style={{
                    flex: 1,
                    background: '#EFF4EC',
                    height: '17px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(item.v / maxVal) * 100}%`,
                      background: '#D0342C',
                      borderRadius: '4px',
                    }}
                  ></div>
                </div>
                <div
                  style={{
                    width: '70px',
                    textAlign: 'right',
                    color: 'var(--subtext)',
                    fontWeight: 700,
                  }}
                >
                  {n(item.v)}
                </div>
              </div>
            );
          })}
          <div className="subtle" style={{ marginTop: '8px' }}>
            The kind of MPI attendance to plan for this week.
          </div>
        </div>

        {/* Suppliers */}
        <div className="panel half">
          <div className="panel-title">
            <span>Suppliers behind the red flags</span>
            <span className="panel-sub">In yard now</span>
          </div>
          {summary.suppliers.length ? (
            summary.suppliers.map((item) => {
              const maxVal = Math.max(
                ...summary.suppliers.map((s) => s.v),
                1
              );
              return (
                <div
                  key={item.l}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '9px',
                    fontSize: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '230px',
                      flexShrink: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={item.l}
                  >
                    {item.l}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: '#EFF4EC',
                      height: '17px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(item.v / maxVal) * 100}%`,
                        background: '#E8A317',
                        borderRadius: '4px',
                      }}
                    ></div>
                  </div>
                  <div
                    style={{
                      width: '70px',
                      textAlign: 'right',
                      color: 'var(--subtext)',
                      fontWeight: 700,
                    }}
                  >
                    {n(item.v)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty">No supplier has a red flag in the yard.</div>
          )}
          <div className="subtle" style={{ marginTop: '8px' }}>
            A supplier repeatedly on hold is worth raising with the buying team.
          </div>
        </div>
      </div>

      {/* Key Messages */}
      <div className="panel">
        <div className="panel-title">
          <span>Key messages</span>
        </div>
        <div className="evbox red" style={{ marginBottom: '8px' }}>
          <b>${n(summary.fineExposure)} of fine exposure is sitting in the yard.</b>{' '}
          {summary.mixBreakdown.find((m) => m.k === 'DO_NOT_OPEN')?.v || 0} containers
          await MPI inspection or treatment and{' '}
          {summary.mixBreakdown.find((m) => m.k === 'SITE')?.v || 0} are
          authorised to a different site &mdash; none may be opened yet.
        </div>
        <div className="evbox" style={{ marginBottom: '8px' }}>
          <b>The MPI answer is usually known before the truck arrives.</b>{' '}
          {p0(summary.earlyPct)} of containers had their BACC before gate-in, so
          the team can plan attendance ahead rather than react at the dock.
        </div>
        <div className="evbox amber">
          <b>Status changes after arrival are real.</b>{' '}
          {summary.supersededCount} holds were lifted by a newer BACC, on average{' '}
          {summary.supersededAvgHours.toFixed(0)} hours after gate-in &mdash;
          which is why the agent keeps reading the mailbox every 30 minutes.
        </div>
      </div>

      {/* Delivery Stages */}
      <div className="panel">
        <div className="panel-title">
          <span>Delivery stages</span>
          <span className="panel-sub">Agreed 30 Sep 2026</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            ['Stage 1', 'Red flags at the gate', 'In build', 'b-ok'],
            ['Stage 2', 'MPI bookings · CCP upload check', 'After 1-2 weeks live', 'b-grey'],
            ['Stage 3', 'Further enhancements', 'Later', 'b-grey'],
            ['Stage 4', 'Container platform: reefers, detention', 'Later', 'b-grey'],
          ].map(([stage, title, subtitle, badgeClass]) => (
            <div
              key={stage}
              style={{
                flex: 1,
                minWidth: '190px',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '11px 13px',
              }}
            >
              <span className={`badge ${badgeClass}`}>{stage}</span>
              <div
                style={{
                  fontWeight: 700,
                  marginTop: '6px',
                  fontSize: '12.5px',
                }}
              >
                {title}
              </div>
              <div className="subtle">{subtitle}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
