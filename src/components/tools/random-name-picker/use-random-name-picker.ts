"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import useSoundEffects from "./use-sound-effects";
import {
  type SeparatorType,
  type SavedList,
  type HistoryEntry,
  getSeparatorPattern,
  cryptoRandom,
  sample,
} from "./types";

export function useRandomNamePicker(t: (key: string) => string) {
  // App settings
  const [numWinners, setNumWinners] = useState(1);
  const [shuffleDuration, setShuffleDuration] = useState(3000);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [removeWinners, setRemoveWinners] = useState(true);
  const [separator, setSeparator] = useState<SeparatorType>("newline");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // State
  const [namesInput, setNamesInput] = useState("");
  const [winners, setWinners] = useState<string[]>([]);
  const [lastWinners, setLastWinners] = useState<string[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [animationNames, setAnimationNames] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [showFullscreenHint, setShowFullscreenHint] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [countdownDuration, setCountdownDuration] = useState(3);
  const [selectionHistory, setSelectionHistory] = useState<Record<string, number>>({});
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const presentationRef = useRef<HTMLDivElement>(null);
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { toast } = useToast();
  const { playTick, playCountdownTick, playWinner, playError, playShuffleTick } = useSoundEffects(isSoundEnabled);

  // Parse names from input — memoized to keep stable array references
  const allNames = useMemo(
    () => namesInput.split(getSeparatorPattern(separator)).map(n => n.trim()).filter(Boolean),
    [namesInput, separator]
  );
  const availableNames = useMemo(
    () => (removeWinners ? allNames.filter(n => !winners.includes(n)) : allNames),
    [removeWinners, allNames, winners]
  );

  const handleSelectWinners = useCallback((selectedWinners: string[]) => {
    setLastWinners(selectedWinners);
    setWinners((prev) => (removeWinners ? [...prev, ...selectedWinners] : prev));
    setIsPicking(false);
    setShowConfetti(true);
    playWinner();

    setSelectionHistory(prev => {
      const next = { ...prev };
      selectedWinners.forEach(w => { next[w] = (next[w] || 0) + 1; });
      return next;
    });

    setHistory((prev) => [
      {
        winners: selectedWinners,
        timestamp: Date.now(),
        totalNames: allNames.length,
      },
      ...prev,
    ].slice(0, 50));
  }, [removeWinners, playWinner, allNames.length]);

  // Stable refs for animation effect — prevents re-start when deps change mid-animation
  // Declared AFTER derived values so initial values are correct
  const availableNamesRef = useRef<string[]>(availableNames);
  const numWinnersRef = useRef<number>(numWinners);
  const shuffleDurationRef = useRef<number>(shuffleDuration);
  const handleSelectWinnersRef = useRef<typeof handleSelectWinners>(handleSelectWinners);
  const playShuffleTickRef = useRef<typeof playShuffleTick>(playShuffleTick);

  // Keep animation refs in sync with latest values
  useEffect(() => { availableNamesRef.current = availableNames; }, [availableNames]);
  useEffect(() => { numWinnersRef.current = numWinners; }, [numWinners]);
  useEffect(() => { shuffleDurationRef.current = shuffleDuration; }, [shuffleDuration]);
  useEffect(() => { handleSelectWinnersRef.current = handleSelectWinners; }, [handleSelectWinners]);
  useEffect(() => { playShuffleTickRef.current = playShuffleTick; }, [playShuffleTick]);

  // Load saved data from localStorage
  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };

    try {
      const saved = localStorage.getItem('randomNamePicker_data');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.namesInput) setNamesInput(data.namesInput);
        if (data.savedLists) setSavedLists(data.savedLists);
        if (data.history) setHistory(data.history);
        if (data.settings) {
          if (data.settings.numWinners !== undefined) setNumWinners(data.settings.numWinners);
          if (data.settings.shuffleDuration !== undefined) setShuffleDuration(data.settings.shuffleDuration);
          if (data.settings.isSoundEnabled !== undefined) setIsSoundEnabled(data.settings.isSoundEnabled);
          if (data.settings.removeWinners !== undefined) setRemoveWinners(data.settings.removeWinners);
          if (data.settings.separator) setSeparator(data.settings.separator);
          if (data.settings.countdownDuration !== undefined) setCountdownDuration(data.settings.countdownDuration);
        }
        if (data.selectionHistory) setSelectionHistory(data.selectionHistory);
        if (data.winners) setWinners(data.winners);
      }
      updateViewportSize();
      window.addEventListener('resize', updateViewportSize);
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({ variant: "destructive", title: "Error", description: t('errorLoadSavedData') });
    }

    return () => window.removeEventListener('resize', updateViewportSize);
  }, [toast]);

  // Save data to localStorage
  useEffect(() => {
    const data = {
      namesInput,
      savedLists,
      history,
      selectionHistory,
      winners,
      settings: { numWinners, shuffleDuration, isSoundEnabled, removeWinners, separator, countdownDuration }
    };
    localStorage.setItem('randomNamePicker_data', JSON.stringify(data));
  }, [namesInput, savedLists, history, selectionHistory, winners, numWinners, shuffleDuration, isSoundEnabled, removeWinners, separator, countdownDuration]);

  // Countdown effect
  useEffect(() => {
    if (!isCountingDown) return;
    if (countdown <= 0) {
      setIsCountingDown(false);
      setIsPicking(true);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(c => c - 1);
      playCountdownTick();
    }, 1000);
    return () => clearTimeout(timer);
  }, [isCountingDown, countdown, playCountdownTick]);

  // Animation effect — only depends on isPicking; reads latest values via refs
  useEffect(() => {
    if (!isPicking) {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      return;
    }

    const names = availableNamesRef.current;
    const nWinners = numWinnersRef.current;
    const duration = shuffleDurationRef.current;
    const finalWinners = sample(names, nWinners);

    const endTimer = setTimeout(() => {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      handleSelectWinnersRef.current(finalWinners);
    }, duration);

    setAnimationNames(sample(names, nWinners));
    let tickCount = 0;
    animationIntervalRef.current = setInterval(() => {
      setAnimationNames(sample(availableNamesRef.current, numWinnersRef.current));
      tickCount++;
      if (tickCount % 2 === 0) {
        playShuffleTickRef.current();
      }
    }, 120);

    return () => {
      clearTimeout(endTimer);
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    };
  }, [isPicking]);

  // Confetti effect
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  // Import file
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setNamesInput(content);
      toast({ title: t('fileImported') });
    };
    reader.readAsText(file);
  };

  // Export winners
  const handleExport = () => {
    const data = {
      winners: lastWinners,
      timestamp: new Date().toISOString(),
      totalParticipants: allNames.length,
      settings: { numWinners, removeWinners }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `winners-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t('winnersExported') });
  };

  // Start picking
  const handlePickWinners = useCallback(() => {
    const namesArray = namesInput.split(getSeparatorPattern(separator)).map(n => n.trim()).filter(Boolean);
    if (namesArray.length === 0) {
      toast({ variant: "destructive", title: t('noNames'), description: t('noNamesDesc') });
      playError();
      return;
    }
    if (availableNames.length < numWinners) {
      toast({ variant: "destructive", title: t('notEnoughNames'), description: t('notEnoughNamesDesc').replace('{count}', String(availableNames.length)) });
      playError();
      return;
    }
    setIsCountingDown(true);
    setCountdown(countdownDuration);
    playTick();
  }, [namesInput, separator, availableNames, numWinners, toast, playError, playTick, countdownDuration, t]);

  // Reset winners pool (keeps names, clears picks)
  const handleReset = () => {
    setWinners([]);
    setLastWinners([]);
    setAnimationNames([]);
    setSelectionHistory({});
    setIsPicking(false);
    setIsCountingDown(false);
    setCountdown(countdownDuration);
    setShowConfetti(false);
  };

  // Shuffle order of names in textarea
  const handleShuffle = () => {
    if (allNames.length === 0) return;
    const sep = separator === 'comma' ? ', ' : separator === 'semicolon' ? '; ' : '\n';
    const shuffled = [...allNames].sort(() => cryptoRandom() - 0.5);
    setNamesInput(shuffled.join(sep));
  };

  // Clear absolutely everything
  const handleClearAll = () => {
    setNamesInput('');
    setWinners([]);
    setLastWinners([]);
    setAnimationNames([]);
    setSelectionHistory({});
    setHistory([]);
    setIsPicking(false);
    setIsCountingDown(false);
    setShowConfetti(false);
    toast({ title: t('allCleared') });
  };

  // Save list
  const handleSaveList = () => {
    if (!saveName.trim()) {
      toast({ variant: "destructive", title: "Error", description: t('errorEnterListName') });
      return;
    }
    
    const newList: SavedList = {
      name: saveName,
      names: allNames,
      timestamp: Date.now()
    };
    
    setSavedLists(prev => [...prev, newList]);
    setShowSaveDialog(false);
    setSaveName("");
    toast({ title: t('listSaved') });
  };

  // Load saved list
  const handleLoadList = (list: SavedList) => {
    setNamesInput(list.names.join('\n'));
    toast({ title: t('listLoaded'), description: `"${list.name}"` });
  };

  // Delete saved list
  const handleDeleteList = (index: number) => {
    setSavedLists(prev => prev.filter((_, i) => i !== index));
    toast({ title: t('listDeleted') });
  };

  // Presentation mode
  const togglePresentationMode = useCallback(() => {
    if (!isPresentationMode) {
      document.documentElement.requestFullscreen().catch(() => {});
      setShowFullscreenHint(true);
      setTimeout(() => setShowFullscreenHint(false), 4500);
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, [isPresentationMode]);

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsPresentationMode(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isPicking && !isCountingDown && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        handlePickWinners();
      }
      if (e.key === 'Escape' && isPresentationMode) {
        togglePresentationMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePickWinners, isPresentationMode, togglePresentationMode, isPicking, isCountingDown]);

  const isPickingFinished = lastWinners.length > 0 && !isPicking && !isCountingDown;

  return {
    // Settings
    numWinners, setNumWinners,
    shuffleDuration, setShuffleDuration,
    isSoundEnabled, setIsSoundEnabled,
    removeWinners, setRemoveWinners,
    separator, setSeparator,
    showAdvanced, setShowAdvanced,
    countdownDuration, setCountdownDuration,

    // State
    namesInput, setNamesInput,
    winners, lastWinners,
    isPicking, isCountingDown, countdown,
    animationNames, showConfetti,
    isPresentationMode, showFullscreenHint,
    searchTerm, setSearchTerm,
    savedLists, showSaveDialog, setShowSaveDialog,
    saveName, setSaveName,
    history, selectionHistory,
    viewportSize,

    // Derived
    allNames, availableNames, isPickingFinished,

    // Refs
    cardRef, presentationRef, fileInputRef,

    // Handlers
    handleImport, handleExport,
    handlePickWinners, handleReset, handleShuffle, handleClearAll,
    handleSaveList, handleLoadList, handleDeleteList,
    togglePresentationMode,
  };
}
