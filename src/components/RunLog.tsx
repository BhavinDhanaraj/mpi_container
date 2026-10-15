import React from 'react';
import { AgentRun } from '../types/index.ts';

interface RunLogProps {
  runs: AgentRun[];
  onTriggerPoll: () => void;
  onToast: (msg: string) => void;
  isPolling?: boolean;
}

export const RunLog: React.FC<RunLogProps> = ({
  runs,
  onTriggerPoll,
  onToast,
  isPolling = false,
}) => {
  const n = (v: number) => Number(v).toLocaleString('en-NZ');

  const mailboxCount = runs.filter((r) => r.trig === 'Mailbox poll').length;
  const arrivalsCount = runs.filter((r) => r.trig === 'Gatehouse arrival').length;
  const checkoutsCount = runs.filter((r) => r.trig === 'WMS check-out').length;

  const downloadCsv = () => {
    const q = (v: unknown) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const rows = runs.map((r) => [r.t, r.trig, r.n, r.res].map(q).join(','));
    const csv = ['Timestamp,Trigger,ItemsProcessed,Result', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'twg_mpi_agent_run_log.csv';
    a.click();
    URL.revokeObjectURL(url);
    onToast('Downloaded twg_mpi_agent_run_log.csv');
  };

  return (
    <div>
      <div className="note">
        The agent acts on three triggers: <b>gatehouse arrival</b>, a{' '}
        <b>new BACC</b> in the mailbox (read every 30 minutes) and{' '}
        <b>WMS check-out</b>. An empty mailbox read is a healthy run. Last 48 hours
        shown.
      </div>

      <div className="kpi-row">
        <div className="kpi c-info">
          <div className="kpi-label">Mailbox reads</div>
          <div className="kpi-value">{n(mailboxCount)}</div>
        </div>

        <div className="kpi c-ok">
          <div className="kpi-label">Gatehouse arrivals</div>
          <div className="kpi-value">{n(arrivalsCount)}</div>
        </div>

        <div className="kpi c-grey">
          <div className="kpi-label">WMS check-outs</div>
          <div className="kpi-value">{n(checkoutsCount)}</div>
        </div>

        <div className="kpi c-ok">
          <div className="kpi-label">Failed runs</div>
          <div className="kpi-value">0</div>
          <div className="kpi-foot">Schedule unbroken</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          <span>Agent run log</span>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm"
              onClick={onTriggerPoll}
              disabled={isPolling}
              title="Simulate immediate agent mailbox poll"
            >
              {isPolling ? 'Polling...' : 'Run Mailbox Poll Now'}
            </button>
            <button className="btn btn-sm btn-primary" onClick={downloadCsv}>
              Download CSV
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="dt">
            <thead>
              <tr>
                <th>Time (NZT)</th>
                <th>Trigger</th>
                <th>Items</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r, i) => (
                <tr key={`${r.t}-${r.trig}-${i}`}>
                  <td className="mono subtle">{r.t}</td>
                  <td>{r.trig}</td>
                  <td>{r.n}</td>
                  <td className="subtle">{r.res}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
