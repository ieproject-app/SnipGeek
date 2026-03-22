"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Confetti from "react-confetti";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import useSoundEffects from "./use-sound-effects";
import {
  Shuffle,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Award,
  Settings,
  Save,
  Expand,
  Minimize,
  History,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ToolWrapper } from "@/components/tools/tool-wrapper";

type SeparatorType = "newline" | "comma" | "semicolon";

const getSeparatorPattern = (sep: SeparatorType): RegExp => {
  switch (sep) {
    case "comma": return /\s*,\s*/;
    case "semicolon": return /\s*;\s*/;
    case "newline":
    default:
      return /\s*\n\s*/;
  }
};

const sample = (arr: string[], k: number): string[] => {
  const a = [...arr];
  let i = arr.length;
  let n = Math.min(k, i);
  const result = new Array(n);
  while (n--) {
    const j = Math.floor(Math.random() * i);
    result[n] = a[j];
    a.splice(j, 1);
    i--;
  }
  return result;
};

interface RandomNamePickerProps {
  dictionary: any;
  fullDictionary: any;
}

export function RandomNamePicker({ dictionary, fullDictionary }: RandomNamePickerProps) {
  const t = (key: string) => {
    // Fallback to nested key access for tool-specific translations
    const keys = key.split('.');
    let value = dictionary;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

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
  const [searchTerm, setSearchTerm] = useState("");
  const [savedLists, setSavedLists] = useState<Array<{name: string, names: string[], timestamp: number}>>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [history, setHistory] = useState<Array<{winners: string[], timestamp: number, totalNames: number}>>([]);
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
  const { playTick, playCountdownTick, playWinner, playError } = useSoundEffects(isSoundEnabled);

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

  // Keep animation refs in sync with latest values
  useEffect(() => { availableNamesRef.current = availableNames; }, [availableNames]);
  useEffect(() => { numWinnersRef.current = numWinners; }, [numWinners]);
  useEffect(() => { shuffleDurationRef.current = shuffleDuration; }, [shuffleDuration]);
  useEffect(() => { handleSelectWinnersRef.current = handleSelectWinners; }, [handleSelectWinners]);

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
      toast({ variant: "destructive", title: "Error", description: "Could not load saved data." });
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
    animationIntervalRef.current = setInterval(() => {
      setAnimationNames(sample(availableNamesRef.current, numWinnersRef.current));
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
  }, [namesInput, separator, availableNames, numWinners, toast, playError, playTick, countdownDuration]);

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
    const shuffled = [...allNames].sort(() => Math.random() - 0.5);
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
      toast({ variant: "destructive", title: "Error", description: "Please enter a name for the list." });
      return;
    }
    
    const newList = {
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
  const handleLoadList = (list: {name: string, names: string[], timestamp: number}) => {
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

  const renderWinnerList = (names: string[], context: 'main' | 'presentation', isAnimating: boolean) => {
    if (names.length === 0) return null;

    const getStyles = (count: number) => {
      if (context === 'presentation') {
        if (count === 1) return { listClass: 'space-y-1', itemClass: 'text-[10vw]' };
        if (count <= 3) return { listClass: 'space-y-1', itemClass: 'text-[8vw]' };
        if (count <= 6) return { listClass: 'grid grid-cols-2 gap-x-8 gap-y-2', itemClass: 'text-[6vw]' };
        if (count <= 12) return { listClass: 'grid grid-cols-3 gap-x-8 gap-y-2', itemClass: 'text-[4vw]' };
        return { listClass: 'grid grid-cols-4 gap-x-8 gap-y-1', itemClass: 'text-[3vw]' };
      } else {
        if (count === 1) return { listClass: 'space-y-2', itemClass: 'text-4xl' };
        if (count <= 4) return { listClass: 'space-y-2', itemClass: 'text-2xl' };
        if (count <= 9) return { listClass: 'grid grid-cols-2 gap-x-4 gap-y-2', itemClass: 'text-xl' };
        return { listClass: 'grid grid-cols-3 gap-2', itemClass: 'text-lg' };
      }
    };

    const { listClass, itemClass } = getStyles(names.length);
    const animationClass = isAnimating ? '' : (context === 'presentation' ? 'animate-winner-reveal' : 'animate-winner-flash');
    const colorClass = isAnimating ? 'text-primary/70' : 'text-primary';

    return (
      <ul className={cn("w-full text-center", listClass, context === 'presentation' && 'mt-4')}>
        {names.map((name, i) => (
          <li
            key={i}
            className={cn(
              "font-bold font-display tracking-tight transition-all duration-100 p-1",
              itemClass, colorClass, animationClass
            )}
          >
            {name}
          </li>
        ))}
      </ul>
    );
  };

  const renderAnimation = () => {
    if (isCountingDown && countdown > 0) {
      return (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('startingIn')}</p>
          <div className="animate-countdown-pop text-7xl font-bold text-primary font-display leading-none">
            {countdown}
          </div>
        </div>
      );
    }
    if (isPickingFinished) {
      return (
        <div className="flex flex-col items-center gap-4 w-full px-4 animate-in fade-in zoom-in-95 duration-500">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {lastWinners.length === 1 ? t('winnerRevealSingle') : `${lastWinners.length} ${t('winnerRevealPlural')}`}
          </p>
          <div className={cn(
            "w-full rounded-xl transition-all duration-300",
            lastWinners.length === 1
              ? "flex items-center justify-center py-8 bg-primary/5 border border-primary/20 ring-4 ring-primary/10"
              : "space-y-2"
          )}>
            {renderWinnerList(lastWinners, 'main', false)}
          </div>
        </div>
      );
    }
    if (isPicking) {
      return (
        <div className="w-full px-4">
          {animationNames.length > 0 ? (
            renderWinnerList(animationNames, 'main', true)
          ) : (
            <div className="flex justify-center items-center gap-2">
              <span className="animate-dot-pulse w-3 h-3 bg-primary rounded-full" />
              <span className="animate-dot-pulse animation-delay-200 w-3 h-3 bg-primary rounded-full" />
              <span className="animate-dot-pulse animation-delay-400 w-3 h-3 bg-primary rounded-full" />
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-3 text-muted-foreground select-none">
        <Award className="h-10 w-10 opacity-20" />
        <p className="text-sm text-center">
          {t('readyToPick')}<br />
          <span className="text-xs opacity-70">
            Press{" "}
            <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">Space</kbd>
            {" "}or click <span className="font-semibold">{t('pickWinners')}</span>
          </span>
        </p>
      </div>
    );
  };

  return (
    <ToolWrapper
      title={fullDictionary.tools?.tool_list?.random_name?.title || "Random Name Picker"}
      description={fullDictionary.tools?.tool_list?.random_name?.description || "Randomly select a name from a list, perfect for giveaways."}
      dictionary={fullDictionary}
      isPublic={true}
      requiresCloud={false}
    >
      <TooltipProvider>

        {/* Single confetti instance — fixed to viewport for both modes */}
        {showConfetti && viewportSize.width > 0 && viewportSize.height > 0 && (
          <Confetti
            width={viewportSize.width}
            height={viewportSize.height}
            recycle={false}
            numberOfPieces={isPresentationMode ? 800 : 400}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}
          />
        )}

        {/* Fullscreen / Presentation overlay */}
        <div
          ref={presentationRef}
          className={cn(
            "fixed inset-0 z-50 bg-background flex-col items-center justify-center p-8",
            isPresentationMode ? "flex" : "hidden"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={togglePresentationMode}
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <Minimize className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left"><p>{t('exitPresentationMode')}</p></TooltipContent>
          </Tooltip>

          {isCountingDown && countdown > 0 && (
            <div className="animate-countdown-pop text-[20vw] font-bold text-primary font-display leading-none">
              {countdown}
            </div>
          )}
          {isPicking && renderWinnerList(animationNames, 'presentation', true)}
          {isPickingFinished && (
            <div className="text-center">
              <p className="text-muted-foreground text-[2vw] mb-2">
                {lastWinners.length > 1 ? t('winnerRevealPlural') : t('winnerRevealSingle')}
              </p>
              {renderWinnerList(lastWinners, 'presentation', false)}
              <Button size="lg" className="mt-8" onClick={handlePickWinners}>{t('pickAgain')}</Button>
            </div>
          )}
          {!isCountingDown && !isPicking && !isPickingFinished && (
            <div className="text-center">
              <Award className="w-32 h-32 text-muted-foreground mx-auto mb-4 opacity-30" />
              <h2 className="text-4xl font-bold text-muted-foreground font-display mb-8">{t('readyToPick')}</h2>
              <Button size="lg" onClick={handlePickWinners}>{t('startPicking')}</Button>
            </div>
          )}
        </div>

        {/* Main card */}
        <Card
          ref={cardRef}
          className={cn("w-full max-w-4xl mx-auto border-border/60 shadow-sm overflow-hidden", isPresentationMode && "hidden")}
        >

          <CardContent className="p-0">

            {/* Stats bar — full width across both panels */}
            <div className="flex justify-around text-center px-6 py-3 border-b border-border/40 bg-muted/20">
              <div>
                <div className="font-bold text-xl tabular-nums font-mono leading-tight">{allNames.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{t('totalLabel')}</div>
              </div>
              <div className="w-px bg-border/50" />
              <div>
                <div className="font-bold text-xl tabular-nums font-mono leading-tight">{winners.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{t('selectedLabel')}</div>
              </div>
              <div className="w-px bg-border/50" />
              <div>
                <div className="font-bold text-xl tabular-nums font-mono leading-tight">{availableNames.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{t('availableLabel')}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">

              {/* ── Left panel: Input + Settings + Actions ── */}
              <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-border/60">

                {/* Names input */}
                <div className="p-5 border-b border-border/40">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="names-input" className="text-sm font-semibold">{t('enterNames')}</Label>
                    <div className="flex items-center gap-1.5">
                      {allNames.length > 0 && (
                        <Badge variant="secondary" className="text-xs tabular-nums font-mono">
                          {removeWinners
                            ? `${availableNames.length}/${allNames.length} left`
                            : `${allNames.length} total`}
                        </Badge>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Import .txt or .csv</p></TooltipContent>
                      </Tooltip>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.csv"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <Textarea
                    id="names-input"
                    placeholder={t('namesPlaceholder')}
                    value={namesInput}
                    onChange={(e) => setNamesInput(e.target.value)}
                    className="min-h-[180px] resize-none font-mono text-sm leading-relaxed"
                  />
                </div>

                {/* Settings */}
                <div className="p-5 border-b border-border/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{t('settings')}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      <Settings className="h-3.5 w-3.5" />
                      {showAdvanced ? t('less') : t('advancedSettings')}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="num-winners" className="text-xs text-muted-foreground">{t('numberOfWinners')}</Label>
                      <Input
                        id="num-winners"
                        type="number"
                        min="1"
                        max={availableNames.length || 1}
                        value={numWinners}
                        onChange={(e) => setNumWinners(Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="separator" className="text-xs text-muted-foreground">{t('separator')}</Label>
                      <Select value={separator} onValueChange={(v: SeparatorType) => setSeparator(v)}>
                        <SelectTrigger id="separator" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newline">New Line</SelectItem>
                          <SelectItem value="comma">Comma</SelectItem>
                          <SelectItem value="semicolon">Semicolon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="remove-winners" className="text-sm font-normal cursor-pointer">{t('removeWinners')}</Label>
                      <Switch id="remove-winners" checked={removeWinners} onCheckedChange={setRemoveWinners} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sound-enabled" className="text-sm font-normal cursor-pointer">{t('soundEffects')}</Label>
                      <Switch id="sound-enabled" checked={isSoundEnabled} onCheckedChange={setIsSoundEnabled} />
                    </div>
                  </div>

                  {showAdvanced && (
                    <div className="pt-3 space-y-3 border-t border-border/40">
                      <div className="space-y-1.5">
                        <Label htmlFor="shuffle-duration" className="text-xs text-muted-foreground">
                          {t('animationDuration')}
                        </Label>
                        <Input
                          id="shuffle-duration"
                          type="number"
                          min="500"
                          max="10000"
                          step="500"
                          value={shuffleDuration}
                          onChange={(e) => setShuffleDuration(parseInt(e.target.value) || 3000)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="countdown-duration" className="text-xs text-muted-foreground">
                          {t('countdownDuration')}
                        </Label>
                        <Input
                          id="countdown-duration"
                          type="number"
                          min="0"
                          max="10"
                          value={countdownDuration}
                          onChange={(e) => setCountdownDuration(Math.max(0, parseInt(e.target.value) || 0))}
                          className="h-9"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="p-5 mt-auto space-y-2">

                  <Button
                    onClick={handlePickWinners}
                    disabled={isPicking || isCountingDown || allNames.length === 0 || availableNames.length < numWinners}
                    className="w-full"
                    size="lg"
                  >
                    {isCountingDown ? (
                      <><Timer className="h-4 w-4 mr-2 animate-spin" />{t('startingIn')} {countdown}…</>
                    ) : isPicking ? (
                      <><Award className="h-4 w-4 mr-2" />{t('picking')}</>
                    ) : (
                      <><Award className="h-4 w-4 mr-2" />{t('pickWinners')}</>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleReset} variant="outline" size="sm" className="gap-1.5 text-xs">
                      <RotateCcw className="h-3.5 w-3.5" />
                      {t('reset')}
                    </Button>

                    <Button onClick={handleShuffle} variant="outline" size="sm" className="gap-1.5 text-xs" disabled={allNames.length === 0}>
                      <Shuffle className="h-3.5 w-3.5" />
                      {t('shuffle')}
                    </Button>

                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <History className="h-3.5 w-3.5" />
                          {t('savedLists')}
                          {savedLists.length > 0 && (
                            <Badge variant="secondary" className="h-4 min-w-4 px-1 flex items-center justify-center text-[10px] rounded-full">
                              {savedLists.length}
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-80 p-0">
                        <SheetHeader className="px-5 py-4 border-b border-border/60">
                          <SheetTitle className="text-base">{t('savedLists')}</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="h-[calc(100vh-80px)]">
                          <div className="p-5 space-y-3">
                            {savedLists.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-12">{t('noSavedLists')}</p>
                            ) : (
                              savedLists.map((list, i) => (
                                <div key={i} className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium leading-tight">{list.name}</p>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleDeleteList(i)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {list.names.length} {t('names')} · {new Date(list.timestamp).toLocaleDateString()}
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleLoadList(list)}
                                    className="w-full h-7 text-xs"
                                  >
                                    {t('loadList')}
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </SheetContent>
                    </Sheet>

                    <Button
                      onClick={togglePresentationMode}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                    >
                      <Expand className="h-3.5 w-3.5" />
                      {t('present')}
                    </Button>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={allNames.length === 0 && history.length === 0}
                        className="w-full gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('clearAll')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('clearAllConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('clearAllConfirmDescription')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAll} className={buttonVariants({ variant: "destructive" })}>
                          {t('confirmClear')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    onClick={() => setShowSaveDialog(true)}
                    variant="ghost"
                    size="sm"
                    disabled={allNames.length === 0}
                    className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {t('saveList')}
                  </Button>
                </div>
              </div>

              {/* ── Right panel: Tabs ── */}
              <div className="flex flex-col min-h-[520px]">
                <Tabs defaultValue="winners" className="flex flex-col flex-1">

                  {/* Tab bar */}
                  <div className="border-b border-border/40 px-5 pt-0">
                    <TabsList className="h-12 bg-transparent p-0 gap-0 rounded-none">
                      {[
                        { value: 'winners', label: t('winnersTab'), count: lastWinners.length > 0 ? lastWinners.length : null },
                        { value: 'all', label: t('participantsTab'), count: allNames.length > 0 ? allNames.length : null },
                        { value: 'history', label: t('historyTab'), count: history.length > 0 ? history.length : null },
                      ].map(tab => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className={cn(
                            "h-12 px-4 gap-1.5 text-xs font-semibold uppercase tracking-wide rounded-none border-b-2 border-transparent",
                            "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none",
                            "text-muted-foreground hover:text-foreground transition-colors bg-transparent"
                          )}
                        >
                          {tab.label}
                          {tab.count !== null && (
                            <Badge
                              variant="secondary"
                              className="h-4 px-1.5 text-[10px] rounded-full font-mono tabular-nums"
                            >
                              {tab.count}
                            </Badge>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* Winners tab */}
                  <TabsContent value="winners" className="flex-1 m-0 flex flex-col">
                    <div className="flex-1 flex items-center justify-center p-8 min-h-[360px]">
                      {renderAnimation()}
                    </div>
                    {isPickingFinished && (
                      <div className="flex justify-end gap-2 px-6 pb-5 border-t border-border/40 pt-4">
                        <Button onClick={handlePickWinners} variant="outline" size="sm" className="gap-1.5">
                          <Shuffle className="h-3.5 w-3.5" />
                          {t('pickAgain')}
                        </Button>
                        <Button onClick={handleExport} variant="outline" size="sm" className="gap-1.5">
                          <Download className="h-3.5 w-3.5" />
                          {t('export')}
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Participants tab */}
                  <TabsContent value="all" className="flex-1 m-0 flex flex-col">
                    <div className="px-5 py-3 border-b border-border/40">
                      <Input
                        placeholder={t('searchParticipants')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <ScrollArea className="flex-1 h-[420px]">
                      <div className="p-5">
                        {allNames.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-12">{t('noNamesYet')}</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {allNames
                              .filter(n => n.toLowerCase().includes(searchTerm.toLowerCase()))
                              .map((name, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "px-3 py-2 rounded-md border text-sm transition-colors flex items-center justify-between gap-1 min-w-0",
                                    winners.includes(name)
                                      ? "bg-primary/10 border-primary/30 text-primary font-medium"
                                      : "bg-muted/30 border-border/40 text-foreground"
                                  )}
                                >
                                  <span className="flex items-center gap-1 min-w-0 truncate">
                                    {winners.includes(name) && (
                                      <Award className="h-3 w-3 shrink-0" />
                                    )}
                                    <span className="truncate">{name}</span>
                                  </span>
                                  {selectionHistory[name] && (
                                    <Badge variant="secondary" className="shrink-0 h-4 min-w-4 px-1 text-[9px] font-mono tabular-nums rounded-full">
                                      ×{selectionHistory[name]}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* History tab */}
                  <TabsContent value="history" className="flex-1 m-0">
                    <ScrollArea className="h-[480px]">
                      <div className="p-5 space-y-3">
                        {history.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-12">{t('noHistoryYet')}</p>
                        ) : (
                          history.map((entry) => (
                            <div
                              key={entry.timestamp}
                              className="p-3 rounded-lg border border-border/50 bg-muted/10 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(entry.timestamp).toLocaleString()}
                                </span>
                                <Badge variant="secondary" className="text-xs font-mono tabular-nums">
                                  {entry.winners.length}/{entry.totalNames}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {entry.winners.map((winner, j) => (
                                  <Badge key={j} variant="default" className="text-xs">{winner}</Badge>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>

            </div>

            {/* Mobile-only sticky Pick Winners bar */}
            <div className="lg:hidden sticky bottom-0 z-10 p-3 bg-background/95 backdrop-blur-sm border-t border-border/40">
              <Button
                onClick={handlePickWinners}
                disabled={isPicking || isCountingDown || allNames.length === 0 || availableNames.length < numWinners}
                className="w-full"
                size="lg"
              >
                {isCountingDown ? (
                  <><Timer className="h-4 w-4 mr-2 animate-spin" />{t('startingIn')} {countdown}…</>
                ) : isPicking ? (
                  <><Award className="h-4 w-4 mr-2" />{t('picking')}</>
                ) : (
                  <><Award className="h-4 w-4 mr-2" />{t('pickWinners')}</>
                )}
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Save List Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('saveList')}</DialogTitle>
              <DialogDescription>{t('saveListDesc')}</DialogDescription>
            </DialogHeader>
            <Input
              placeholder="e.g. Team Alpha"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveList()}
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>{t('cancel')}</Button>
              <Button onClick={handleSaveList}>{t('save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </TooltipProvider>
    </ToolWrapper>
  );
}

export default RandomNamePicker;
