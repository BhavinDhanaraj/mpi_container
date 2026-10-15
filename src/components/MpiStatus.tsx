import React, { useState } from 'react';
import { YardContainer, CheckedOutContainer, FlagType } from '../types/index.ts';

interface MpiStatusProps {
  yardContainers: YardContainer[];
  checkedOutContainers: CheckedOutContainer[];
  selectedFlag: string;
  onSelectFlag: (flag: string) => void;
  onOpenContainer: (containerNumber: string) => void;
  onToast: (msg: string) => void;
}

const RED_FLAGS: FlagType[] = ['DO_NOT_OPEN', 'SITE'];

const FL: Record<FlagType, [string, string]> = {
  DO_NOT_OPEN: ['b-bad', 'Do not open'],
  SITE: ['b-bad', 'Wrong site'],
  INCOMPLETE: ['b-warn', 'Check BACC'],
  AP_CHECK: ['b-info', 'AP / TFO check'],
  CLEARED: ['b-ok', 'Cleared'],
};

export const MpiStatus: React.FC<MpiStatusProps> = ({
  yardContainers,
  checkedOutContainers,
  selectedFlag,
  onSelectFlag,
  onOpenContainer,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const isOut = selectedFlag === 'OUT';

  const n = (v: number) => Number(v).toLocaleString('en-NZ');

  // Filter items
  const filteredYard = yardContainers
    .filter((y) => !selectedFlag || selectedFlag === 'ALL' || y.flag === selectedFlag)
    .filter((y) => {
      if (!searchTerm.trim()) return true;
      const s = searchTerm.trim().toLowerCase();
      return [y.c, y.bacc, y.tsw, y.vessel, y.supplier, y.cargo, y.origin].some(
        (v) => String(v || '').toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      const aRed = RED_FLAGS.includes(a.flag) ? 1 : 0;
      const bRed = RED_FLAGS.includes(b.flag) ? 1 : 0;
      if (aRed !== bRed) return bRed - aRed;
      return a.gate < b.gate ? 1 : -1;
    });

  const filteredOut = checkedOutContainers.filter((o) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.trim().toLowerCase();
    return [o.c, o.bacc, o.final].some((v) =>
      String(v || '').toLowerCase().includes(s)
    );
  });

  const displayList = isOut ? filteredOut : filteredYard;

  // Counts for dropdown
  const flagCounts: Record<string, number> = {
    DO_NOT_OPEN: yardContainers.filter((y) => y.flag === 'DO_NOT_OPEN').length,
    SITE: yardContainers.filter((y) => y.flag === 'SITE').length,
    INCOMPLETE: yardContainers.filter((y) => y.flag === 'INCOMPLETE').length,
    AP_CHECK: yardContainers.filter((y) => y.flag === 'AP_CHECK').length,
    CLEARED: yardContainers.filter((y) => y.flag === 'CLEARED').length,
  };

  const downloadCsv = () => {
    const q = (v: unknown) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    if (isOut) {
      const rows = filteredOut.map((o) =>
        [o.c, o.gate, o.out, o.final, o.bacc].map(q).join(',')
      );
      const csv = ['Container,GatedIn,CheckedOut,FinalMPIAnswer,LatestBACC', ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'twg_mpi_checked_out.csv';
      a.click();
      URL.revokeObjectURL(url);
      onToast('Downloaded twg_mpi_checked_out.csv');
    } else {
      const headers = [
        'Container',
        'MPIAnswer',
        'GatedIn',
        'LatestBACC',
        'TSW',
        'BACCCount',
        'Vessel',
        'Voyage',
        'Origin',
        'Cargo',
        'Supplier',
        'Packages',
        'AuthorisedSite',
        'Condition',
        'Instruction',
      ];
      const rows = filteredYard.map((y) =>
        [
          y.c,
          y.label,
          y.gate,
          y.bacc,
          y.tsw,
          y.hist.length,
          y.vessel,
          y.voyage,
          y.origin,
          y.cargo,
          y.supplier,
          y.pk,
          y.site,
          y.cond,
          y.instr,
        ]
          .map(q)
          .join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'twg_mpi_status.csv';
      a.click();
      URL.revokeObjectURL(url);
      onToast('Downloaded twg_mpi_status.csv');
    }
  };

  return (
    <div>
      <div className="note">
        Every container currently on site with its latest MPI answer. Click a row
        for the authority condition and full BACC history. Containers checked out
        of WMS drop off this list but are kept on record &mdash; choose{' '}
        <b>Checked out</b> to see them.
      </div>

      {/* Filter Toolbar */}
      <div className="filters">
        <div className="fgroup">
          <div className="flabel">MPI answer</div>
          <select
            className="fsel"
            value={selectedFlag}
            onChange={(e) => onSelectFlag(e.target.value)}
          >
            <option value="">All in yard ({yardContainers.length})</option>
            <option value="DO_NOT_OPEN">
              Do not open ({flagCounts.DO_NOT_OPEN})
            </option>
            <option value="SITE">Wrong site ({flagCounts.SITE})</option>
            <option value="INCOMPLETE">
              Check BACC ({flagCounts.INCOMPLETE})
            </option>
            <option value="AP_CHECK">
              AP / TFO check ({flagCounts.AP_CHECK})
            </option>
            <option value="CLEARED">Cleared ({flagCounts.CLEARED})</option>
            <option value="OUT">
              Checked out &middot; on record ({checkedOutContainers.length})
            </option>
          </select>
        </div>

        <div className="fgroup">
          <div className="flabel">Search</div>
          <input
            className="finput fsearch"
            placeholder="Container, BACC, TSW, vessel"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          className="btn btn-sm"
          onClick={() => {
            onSelectFlag('');
            setSearchTerm('');
          }}
        >
          Reset
        </button>

        <button className="btn btn-sm" onClick={downloadCsv}>
          Download CSV
        </button>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <div className="kpi c-info">
          <div className="kpi-label">In view</div>
          <div className="kpi-value">
            {n(displayList.length)}{' '}
            <span className="kpi-sub">containers</span>
          </div>
        </div>

        {!isOut && (
          <div className="kpi c-bad">
            <div className="kpi-label">Red flags</div>
            <div className="kpi-value">
              {n(filteredYard.filter((y) => RED_FLAGS.includes(y.flag)).length)}
            </div>
          </div>
        )}

        {!isOut && (
          <div className="kpi c-ok">
            <div className="kpi-label">Status changed after gate-in</div>
            <div className="kpi-value">
              {n(filteredYard.filter((y) => y.hist.length > 1).length)}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="panel">
        <div className="table-wrap">
          <table className="dt">
            <thead>
              {isOut ? (
                <tr>
                  <th>Container</th>
                  <th>Gated in</th>
                  <th>Checked out</th>
                  <th>Final MPI answer</th>
                  <th>Latest BACC</th>
                </tr>
              ) : (
                <tr>
                  <th>Container</th>
                  <th>MPI answer</th>
                  <th>Gated in</th>
                  <th>Latest BACC</th>
                  <th>BACC history</th>
                  <th>Vessel</th>
                  <th>Cargo</th>
                </tr>
              )}
            </thead>
            <tbody>
              {isOut ? (
                filteredOut.length > 0 ? (
                  filteredOut.slice(0, 300).map((o) => (
                    <tr key={`${o.c}-${o.out}`}>
                      <td className="mono">
                        <b>{o.c}</b>
                      </td>
                      <td className="subtle">{o.gate}</td>
                      <td className="subtle">{o.out}</td>
                      <td>{o.final}</td>
                      <td className="mono subtle">{o.bacc}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty">No containers match.</div>
                    </td>
                  </tr>
                )
              ) : filteredYard.length > 0 ? (
                filteredYard.map((y) => {
                  const badgeInfo = FL[y.flag] || ['b-grey', y.label];
                  return (
                    <tr
                      key={y.c}
                      className="clickable"
                      onClick={() => onOpenContainer(y.c)}
                    >
                      <td className="mono">
                        <b>{y.c}</b>
                        {y.real && (
                          <span
                            className="badge b-pur ml-1.5"
                            style={{ fontSize: '9px' }}
                          >
                            source doc
                          </span>
                        )}
                        {y.reefer && (
                          <span
                            className="badge b-info ml-1"
                            style={{ fontSize: '9px' }}
                          >
                            reefer
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${badgeInfo[0]}`}>
                          {badgeInfo[1]}
                        </span>
                      </td>
                      <td className="subtle">{y.gate}</td>
                      <td className="mono subtle">{y.bacc}</td>
                      <td>
                        {y.hist.length > 1 ? (
                          <span className="badge b-info">
                            {y.hist.length} &middot; superseded
                          </span>
                        ) : (
                          <span className="subtle">1</span>
                        )}
                      </td>
                      <td className="subtle">{y.vessel}</td>
                      <td className="subtle">{y.cargo}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">No containers match.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
