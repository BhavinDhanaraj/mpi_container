import React from 'react';
import { BrandLogoWhite } from './BrandLogo.tsx';

export type TabKey = 'exec' | 'status' | 'runs';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  redFlagsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  redFlagsCount,
}) => {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo mb-3">
          <BrandLogoWhite width={150} />
        </div>
        <div className="sidebar-brand-title">
          MPI Container
          <br />
          Compliance Agent
        </div>
        <div className="sidebar-brand-sub">Stage 1 &middot; Yard red flags</div>
      </div>

      <div id="nav">
        <div className="nav-group-label">MPI Compliance Agent</div>

        {/* Executive Summary */}
        <div
          className={`nav-item ${activeTab === 'exec' ? 'active' : ''}`}
          onClick={() => onSelectTab('exec')}
        >
          <span className="nav-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 14l4-4" />
              <circle cx="12" cy="14" r="8" />
              <path d="M4 14a8 8 0 0 1 16 0" />
            </svg>
          </span>
          <span>Executive Summary</span>
        </div>

        {/* MPI Status */}
        <div
          className={`nav-item ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => onSelectTab('status')}
        >
          <span className="nav-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </span>
          <span>MPI Status</span>
          <span className="nav-badge bad">{redFlagsCount}</span>
        </div>

        {/* Run Log */}
        <div
          className={`nav-item ${activeTab === 'runs' ? 'active' : ''}`}
          onClick={() => onSelectTab('runs')}
        >
          <span className="nav-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </span>
          <span>Run Log</span>
        </div>
      </div>

      <div className="sidebar-footer">
        Stage 1 &middot; Red flags at the gate
        <br />
        Site 297 &middot; NIDC Wiri
        <br />
        Owner: Martin Coetzee
      </div>
    </div>
  );
};
