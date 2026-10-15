import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, TabKey } from './components/Sidebar.tsx';
import { Topbar } from './components/Topbar.tsx';
import { ExecutiveSummary } from './components/ExecutiveSummary.tsx';
import { MpiStatus } from './components/MpiStatus.tsx';
import { RunLog } from './components/RunLog.tsx';
import { ContainerDrawer } from './components/ContainerDrawer.tsx';
import { Toast } from './components/Toast.tsx';
import {
  YardContainer,
  CheckedOutContainer,
  AgentRun,
  SummaryData,
  FlagType,
} from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('exec');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [yardContainers, setYardContainers] = useState<YardContainer[]>([]);
  const [checkedOutContainers, setCheckedOutContainers] = useState<CheckedOutContainer[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<string>('');
  const [activeContainer, setActiveContainer] = useState<YardContainer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, yardRes, outRes, runsRes] = await Promise.all([
        fetch('/api/summary'),
        fetch('/api/containers'),
        fetch('/api/containers?type=out'),
        fetch('/api/runs'),
      ]);

      const [sumJson, yardJson, outJson, runsJson] = await Promise.all([
        sumRes.json(),
        yardRes.json(),
        outRes.json(),
        runsRes.json(),
      ]);

      if (sumJson.success) setSummary(sumJson.data);
      if (yardJson.success) setYardContainers(yardJson.data);
      if (outJson.success) setCheckedOutContainers(outJson.data);
      if (runsJson.success) setRuns(runsJson.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      showToast('Error loading live data from API');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNavigateToStatus = (flagFilter: string = '') => {
    setSelectedFlag(flagFilter);
    setActiveTab('status');
  };

  const handleOpenContainer = (cnum: string) => {
    const item = yardContainers.find(
      (y) => y.c.toUpperCase() === cnum.toUpperCase()
    );
    if (item) {
      setActiveContainer(item);
      setIsDrawerOpen(true);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleUpdateBacc = async (
    containerNumber: string,
    update: {
      bacc: string;
      flag: FlagType;
      label: string;
      cond: string;
      instr?: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/containers/${containerNumber}/bacc`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`BACC updated for ${containerNumber}: ${update.label}`);
        await fetchData();
        // Update active container in drawer
        setActiveContainer(data.data);
      } else {
        showToast(data.message || 'Failed to update BACC');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating BACC');
    }
  };

  const handleCheckout = async (containerNumber: string) => {
    try {
      const res = await fetch(`/api/containers/${containerNumber}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Container ${containerNumber} checked out of WMS`);
        await fetchData();
      } else {
        showToast(data.message || 'Failed to check out container');
      }
    } catch (err) {
      console.error(err);
      showToast('Error checking out container');
    }
  };

  const handleTriggerPoll = async () => {
    try {
      setIsPolling(true);
      const res = await fetch('/api/runs/poll', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (data.data.newBaccs > 0) {
          showToast(
            `Mailbox polled: ${data.data.newBaccs} container(s) updated to Cleared!`
          );
        } else {
          showToast('Mailbox polled: No new BACCs received');
        }
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      showToast('Error running mailbox poll');
    } finally {
      setIsPolling(false);
    }
  };

  const redFlagsCount = yardContainers.filter(
    (y) => y.flag === 'DO_NOT_OPEN' || y.flag === 'SITE'
  ).length;

  return (
    <div id="app" className="flex w-full h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        redFlagsCount={redFlagsCount}
      />

      {/* Main Area */}
      <div className="main-content-area">
        <Topbar
          activeTab={activeTab}
          lastRunTime={summary?.now || '2026-09-30 09:30'}
          onRefresh={handleTriggerPoll}
        />

        <div className="content">
          {isLoading ? (
            <div className="empty">Loading MPI compliance data...</div>
          ) : (
            <>
              {activeTab === 'exec' && summary && (
                <ExecutiveSummary
                  summary={summary}
                  onNavigateToStatus={handleNavigateToStatus}
                />
              )}

              {activeTab === 'status' && (
                <MpiStatus
                  yardContainers={yardContainers}
                  checkedOutContainers={checkedOutContainers}
                  selectedFlag={selectedFlag}
                  onSelectFlag={setSelectedFlag}
                  onOpenContainer={handleOpenContainer}
                  onToast={showToast}
                />
              )}

              {activeTab === 'runs' && (
                <RunLog
                  runs={runs}
                  onTriggerPoll={handleTriggerPoll}
                  onToast={showToast}
                  isPolling={isPolling}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Drawer */}
      <ContainerDrawer
        container={activeContainer}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onUpdateBacc={handleUpdateBacc}
        onCheckout={handleCheckout}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}
