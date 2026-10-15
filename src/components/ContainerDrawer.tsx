import React, { useState } from 'react';
import { YardContainer, FlagType } from '../types/index.ts';

interface ContainerDrawerProps {
  container: YardContainer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBacc: (containerNumber: string, update: { bacc: string; flag: FlagType; label: string; cond: string; instr?: string }) => Promise<void>;
  onCheckout: (containerNumber: string) => Promise<void>;
}

export const ContainerDrawer: React.FC<ContainerDrawerProps> = ({
  container,
  isOpen,
  onClose,
  onUpdateBacc,
  onCheckout,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!container) return null;

  const n = (v: number) => Number(v).toLocaleString('en-NZ');
  const isRed = container.flag === 'DO_NOT_OPEN' || container.flag === 'SITE';
  const isAmber = container.flag === 'INCOMPLETE';

  const handleSimulateClearance = async () => {
    try {
      setIsSubmitting(true);
      const newBacc = `B2026/${Math.floor(200000 + Math.random() * 90000)}`;
      await onUpdateBacc(container.c, {
        bacc: newBacc,
        flag: 'CLEARED',
        label: 'Cleared',
        cond: 'Cleared following MPI inspection - all biosecurity requirements met.',
        instr: 'Devan on arrival. No MPI action.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setIsSubmitting(true);
      await onCheckout(container.c);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`drawer-ov ${isOpen ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer">
        {/* Drawer Header */}
        <div className="drawer-head">
          <div>
            <div className="drawer-title">{container.c}</div>
            <div className="drawer-sub">
              Gated in {container.gate} &middot; BACC {container.bacc}
            </div>
          </div>
          <button className="drawer-x" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {/* Section: MPI Answer */}
          <div className="sec-l">MPI answer</div>
          <div
            className={`evbox ${
              isRed ? 'red' : isAmber ? 'amber' : ''
            }`}
          >
            <b>{container.label}</b>
            <br />
            {container.instr}
          </div>

          {/* Section: Authority condition */}
          <div className="sec-l">Authority condition (latest BACC)</div>
          <div className="evbox">{container.cond}</div>

          {/* Section: BACC history */}
          <div className="sec-l">BACC history &mdash; latest wins</div>
          {container.hist
            .slice()
            .reverse()
            .map((b, i) => (
              <div key={`${b.id}-${b.rx}`} className="srow">
                <span className="srow-l">
                  {i === 0 ? (
                    <span className="badge b-ok">Current</span>
                  ) : (
                    <span className="badge b-grey">Superseded</span>
                  )}
                  <span className="mono">{b.id}</span>
                </span>
                <span className="srow-v">
                  {b.type} &middot; {b.rx}
                </span>
              </div>
            ))}

          {/* Section: Record */}
          <div className="sec-l">Record</div>
          {[
            ['TSW', container.tsw],
            ['Vessel / voyage', `${container.vessel} ${container.voyage}`],
            ['Origin', container.origin],
            ['Cargo', container.cargo],
            ['Supplier', container.supplier],
            ['Packages', n(container.pk)],
            ['Authorised site', container.site],
            ['Authorising inspector', container.insp],
          ].map(([label, val]) => (
            <div key={label} className="srow">
              <span className="srow-l">{label}</span>
              <span className="srow-v">{val}</span>
            </div>
          ))}

          {/* Interactive Compliance Actions */}
          <div className="sec-l">Actions</div>
          <div className="flex gap-2 flex-wrap mt-2">
            {container.flag !== 'CLEARED' && (
              <button
                className="btn btn-sm btn-accept"
                onClick={handleSimulateClearance}
                disabled={isSubmitting}
              >
                Mark Cleared (New BACC)
              </button>
            )}
            <button
              className="btn btn-sm"
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              WMS Check-Out (Return Container)
            </button>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="drawer-foot">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
