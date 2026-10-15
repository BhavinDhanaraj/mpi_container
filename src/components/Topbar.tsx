import React from 'react';
import { BrandLogoColor } from './BrandLogo.tsx';
import { TabKey } from './Sidebar.tsx';

interface TopbarProps {
  activeTab: TabKey;
  lastRunTime: string;
  onRefresh?: () => void;
}

const TAB_TITLES: Record<TabKey, [string, string]> = {
  exec: ['Executive Summary', 'What must not be opened in the yard right now'],
  status: ['MPI Status', 'Latest MPI answer for every container on site'],
  runs: ['Run Log', 'Every trigger the agent has acted on'],
};

export const Topbar: React.FC<TopbarProps> = ({ activeTab, lastRunTime, onRefresh }) => {
  const [title, sub] = TAB_TITLES[activeTab] || ['', ''];

  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        <div className="topbar-sub">{sub}</div>
      </div>
      <div className="topbar-right">
        <span
          className="live-pill cursor-pointer"
          onClick={onRefresh}
          title="Click to trigger agent mailbox poll check"
        >
          <span className="live-dot"></span>
          <span>Watching mailbox &middot; 30 min</span>
        </span>
        <span className="subtle">Last run: {lastRunTime} NZT</span>
        <div className="topbar-logo">
          <BrandLogoColor height={34} />
        </div>
      </div>
    </div>
  );
};
