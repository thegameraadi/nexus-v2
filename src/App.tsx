import React, { useState, useEffect, useCallback } from 'react';
import {
  BeatId,
  DayDigest,
  DigestItem as DigestItemType,
  IndexEntry,
} from './lib/nexus/types';
import {
  getStoredBeats,
  getAllSavedItems,
  getSavedCount,
  SAVED_CHANGE_EVENT,
  BEATS_CHANGE_EVENT,
} from './lib/nexus/storage';
import {
  createEmptyDigest,
  getTodayISODate,
  getReaderLocalEditionLabel,
} from './lib/nexus/placeholder';

import { GrainOverlay } from './components/nexus/GrainOverlay';
import { Masthead } from './components/nexus/Masthead';
import { HeroBand } from './components/nexus/HeroBand';
import { DateArchivePills } from './components/nexus/DateArchivePills';
import { DigestGrid } from './components/nexus/DigestGrid';
import { BeatPicker } from './components/nexus/BeatPicker';
import { AgentLogPipeline } from './components/nexus/AgentLogPipeline';
import { Footer } from './components/nexus/Footer';

export const App: React.FC = () => {
  const initialDate = getTodayISODate();

  // Index of available dates
  const [indexEntries, setIndexEntries] = useState<IndexEntry[]>([]);
  const [activeDate, setActiveDate] = useState<string>(initialDate);
  const [activeLabel, setActiveLabel] = useState<string>('Today');

  // Active day's digest (defaults to clean unpopulated empty digest)
  const [digest, setDigest] = useState<DayDigest>(() => createEmptyDigest(initialDate, 'Today'));

  // Selected beats & first-visit onboarding check
  const [selectedBeats, setSelectedBeats] = useState<BeatId[]>(() => {
    const stored = getStoredBeats();
    return stored && stored.length > 0 ? stored : ['ai-venture'];
  });
  const [isBeatPickerOpen, setIsBeatPickerOpen] = useState<boolean>(() => {
    // Open immediately on first visit if user has never set beats
    return getStoredBeats() === null;
  });
  const [isFirstVisit] = useState<boolean>(() => getStoredBeats() === null);

  // Saved items cross-date view
  const [isSavedViewActive, setIsSavedViewActive] = useState<boolean>(false);
  const [savedItems, setSavedItems] = useState<DigestItemType[]>(() => getAllSavedItems());
  const [savedCount, setSavedCount] = useState<number>(() => getSavedCount());

  // Refresh saved items from localStorage
  const refreshSavedState = useCallback(() => {
    setSavedItems(getAllSavedItems());
    setSavedCount(getSavedCount());
  }, []);

  // Listen to local and cross-tab storage changes
  useEffect(() => {
    const handleSavedChange = () => refreshSavedState();
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('nexus-saved-')) {
        refreshSavedState();
      }
      if (!e.key || e.key === 'nexus-beats') {
        const stored = getStoredBeats();
        if (stored && stored.length > 0) {
          setSelectedBeats(stored);
        }
      }
    };
    const handleBeatsChange = (e: Event) => {
      const customEvent = e as CustomEvent<BeatId[]>;
      if (customEvent.detail) {
        setSelectedBeats(customEvent.detail);
      }
    };

    window.addEventListener(SAVED_CHANGE_EVENT, handleSavedChange);
    window.addEventListener('storage', handleStorage);
    window.addEventListener(BEATS_CHANGE_EVENT, handleBeatsChange);

    return () => {
      window.removeEventListener(SAVED_CHANGE_EVENT, handleSavedChange);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(BEATS_CHANGE_EVENT, handleBeatsChange);
    };
  }, [refreshSavedState]);

  // Load index.json on mount
  useEffect(() => {
    fetch('/data/index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: IndexEntry[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setIndexEntries(data);
          setActiveDate(data[0].date);
          setActiveLabel(getReaderLocalEditionLabel(data[0].date));
        } else {
          // Empty index on clean install / zero editions
          setIndexEntries([]);
          setActiveDate(initialDate);
          setActiveLabel(getReaderLocalEditionLabel(initialDate));
        }
      })
      .catch((err) => {
        console.info('No external /data/index.json found, running with clean default edition:', err.message);
        setIndexEntries([]);
        setActiveDate(initialDate);
        setActiveLabel(getReaderLocalEditionLabel(initialDate));
      });
  }, [initialDate]);

  // Load digest whenever activeDate changes
  useEffect(() => {
    if (!activeDate) return;

    fetch(`/data/${activeDate}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: DayDigest) => {
        if (data && data.beats) {
          setDigest(data);
          setActiveLabel(getReaderLocalEditionLabel(activeDate));
        } else {
          setDigest(createEmptyDigest(activeDate, getReaderLocalEditionLabel(activeDate)));
        }
      })
      .catch(() => {
        // If file does not exist on disk, render clean unpopulated edition for that date
        setDigest(createEmptyDigest(activeDate, getReaderLocalEditionLabel(activeDate)));
      });
  }, [activeDate]);

  const handleSelectDate = (date: string) => {
    setIsSavedViewActive(false);
    setActiveDate(date);
    setActiveLabel(getReaderLocalEditionLabel(date));
  };

  const handleToggleSaved = () => {
    refreshSavedState();
    setIsSavedViewActive(!isSavedViewActive);
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col relative selection:bg-zinc-800">
      {/* Background grain overlay: fixed SVG feTurbulence at 3% opacity */}
      <GrainOverlay />

      {/* Main Masthead */}
      <Masthead
        activeEditionLabel={isSavedViewActive ? 'SAVED DISPATCHES' : activeLabel}
        onOpenBeatPicker={() => setIsBeatPickerOpen(true)}
        selectedBeatsCount={selectedBeats.length}
        lastUpdated={digest.lastUpdated}
      />

      {/* Full-viewport-width ~130px monochrome HeroBand */}
      <HeroBand />

      {/* Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 z-10">
        {/* Date archive pill bar + Saved pill */}
        <DateArchivePills
          entries={indexEntries}
          selectedDate={activeDate}
          isSavedActive={isSavedViewActive}
          onSelectDate={handleSelectDate}
          savedCount={savedCount}
          onToggleSaved={handleToggleSaved}
        />

        {/* Primary Digest Grid */}
        <DigestGrid
          digest={digest}
          selectedBeats={selectedBeats}
          isSavedViewActive={isSavedViewActive}
          savedItems={savedItems}
        />

        {/* Collapsed-by-default Agent Log Pipeline */}
        {!isSavedViewActive && digest.agentLog && digest.agentLog.length > 0 && (
          <div className="pt-4">
            <AgentLogPipeline logs={digest.agentLog} />
          </div>
        )}
      </main>

      {/* System Footer */}
      <Footer />

      {/* Beat Picker Modal (First-visit auto or settings trigger) */}
      <BeatPicker
        isOpen={isBeatPickerOpen}
        onClose={() => setIsBeatPickerOpen(false)}
        currentBeats={selectedBeats}
        onSaveBeats={(beats) => setSelectedBeats(beats)}
        isFirstVisit={isFirstVisit}
      />
    </div>
  );
};
