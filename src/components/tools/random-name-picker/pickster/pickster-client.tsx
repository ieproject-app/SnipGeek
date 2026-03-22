
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Confetti from "react-confetti";
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import useSoundEffects from "@/hooks/use-sound-effects";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Shuffle,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Award,
  Timer,
  Settings,
  Book,
  Save,
  Plus,
  Volume2,
  VolumeX,
  Expand,
  Minimize,
  History,
} from "lucide-react";
// import { aiSelectionReasoner } from "@/ai/flows/selection-reasoner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { ChangelogDialog } from "./changelog-dialog";
import { LanguageToggle } from "./language-toggle";
import { useLanguage } from "@/context/language-context";

type SeparatorType = "newline" | "comma" | "semicolon";

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

export default function PicksterClient() {
  const { t } = useLanguage();

  // App settings
  const [numWinners, setNumWinners] = useState(1);
  const [separator, setSeparator] = useState<SeparatorType>("newline");
  const [shuffleDuration, setShuffleDuration] = useState(3);
  const [countdownDuration, setCountdownDuration] = useState(3);
  const [removeAfterPicking, setRemoveAfterPicking] = useState(true);
  
  // Core state
  const [namesInput, setNamesInput] = useState("");
  const [allNames, setAllNames] = useState<string[]>([]);
  const [availableNames, setAvailableNames] = useState<string[]>([]);
  const [winners, setWinners] = useState<string[]>([]);
  const [selectionHistory, setSelectionHistory] = useState<Record<string, number>>({});

  // Animation & feedback state
  const [isPicking, setIsPicking] = useState(false);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastWinners, setLastWinners] = useState<string[]>([]);
  const [animationNames, setAnimationNames] = useState<string[]>([]);
  
  // New features state
  const { isSoundEnabled, setIsSoundEnabled, playCountdownTick, playWinnerSound } = useSoundEffects();
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [savedGroups, setSavedGroups] = useState<Record<string, string[]>>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");

  // AI state (disabled for static export)
  // const [aiSuggestion, setAiSuggestion] = useState<string[]>([]);
  // const [isAiLoading, setIsAiLoading] = useState(false);
  // const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  // Misc state
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const importFileRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const presentationRef = useRef<HTMLDivElement>(null);

  // Load initial data from localStorage
  useEffect(() => {
    try {
      const savedNames = localStorage.getItem("pickster_allNames");
      const savedWinners = localStorage.getItem("pickster_winners");
      const savedHistory = localStorage.getItem("pickster_selectionHistory");
      const savedGroupsData = localStorage.getItem("pickster_groups");
      const savedActiveGroup = localStorage.getItem("pickster_activeGroup");

      if (savedGroupsData) {
        setSavedGroups(JSON.parse(savedGroupsData));
      }
      if (savedActiveGroup) {
        setActiveGroup(savedActiveGroup);
      }
      if (savedNames) {
        const parsedNames = JSON.parse(savedNames);
        setAllNames(parsedNames);
        setNamesInput(parsedNames.join("\n"));
        const parsedWinners = savedWinners ? JSON.parse(savedWinners) : [];
        setWinners(parsedWinners);
        const available = parsedNames.filter((n: string) => !parsedWinners.includes(n));
        setAvailableNames(available);
        if (savedHistory) {
          setSelectionHistory(JSON.parse(savedHistory));
        }
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load saved data." });
    }
  }, [toast]);

  // Save core data to localStorage
  useEffect(() => {
    try {
      if (allNames.length > 0) {
        localStorage.setItem("pickster_allNames", JSON.stringify(allNames));
        localStorage.setItem("pickster_winners", JSON.stringify(winners));
        localStorage.setItem("pickster_selectionHistory", JSON.stringify(selectionHistory));
        if (activeGroup) {
          localStorage.setItem("pickster_activeGroup", activeGroup);
        }
      } else {
        localStorage.removeItem("pickster_allNames");
        localStorage.removeItem("pickster_winners");
        localStorage.removeItem("pickster_selectionHistory");
        localStorage.removeItem("pickster_activeGroup");
      }
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [allNames, winners, selectionHistory, activeGroup]);
  
  // Save groups to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("pickster_groups", JSON.stringify(savedGroups));
    } catch (error) {
      console.error("Failed to save groups to localStorage", error);
    }
  }, [savedGroups]);

  const getSeparatorChar = (s: SeparatorType) => {
    if (s === "comma") return ",";
    if (s === "semicolon") return ";";
    return "\n";
  };

  const handleSetNames = () => {
    const sep = getSeparatorChar(separator);
    const namesArray = namesInput.split(sep).map((n) => n.trim()).filter(Boolean);
    if (namesArray.length === 0) {
      toast({ variant: "destructive", title: t('toast-no-names-title'), description: t('toast-no-names-description') });
      return;
    }
    const uniqueNames = [...new Set(namesArray)];
    const duplicates = namesArray.length - uniqueNames.length;
    if (duplicates > 0) {
      toast({ title: t('toast-duplicates-title'), description: `${duplicates} ${t('toast-duplicates-description')}` });
    }
    setAllNames(uniqueNames);
    setAvailableNames(uniqueNames);
    setWinners([]);
    setSelectionHistory({});
    setLastWinners([]);
    setAnimationNames([]);
    setActiveGroup(null);
    toast({ title: t('toast-list-set-title'), description: t('toast-list-set-description') });
  };

  const handleReset = () => {
    setAvailableNames(allNames);
    setWinners([]);
    setSelectionHistory({});
    setLastWinners([]);
    setAnimationNames([]);
    toast({ title: t('toast-reset-complete-title'), description: t('toast-reset-complete-description') });
  };
  
  const handleSelectWinners = useCallback((newWinners: string[]) => {
    if (newWinners.length === 0) {
      setIsPicking(false);
      return;
    };
    playWinnerSound();
    setLastWinners(newWinners);
    setWinners((prev) => [...prev, ...newWinners]);
    if (removeAfterPicking) {
      setAvailableNames((prev) => prev.filter((n) => !newWinners.includes(n)));
    }
    setSelectionHistory(prev => {
      const newHistory = {...prev};
      newWinners.forEach(winner => {
        newHistory[winner] = (newHistory[winner] || 0) + 1;
      });
      return newHistory;
    });
    setIsPicking(false);
    setShowConfetti(true);
  }, [playWinnerSound, removeAfterPicking]);

  const handlePickWinners = useCallback(() => {
    if (isPicking || isCountingDown) return;
    if (availableNames.length < numWinners) {
      toast({ variant: "destructive", title: t('toast-not-enough-names-title'), description: t('toast-not-enough-names-description') });
      return;
    }

    setShowConfetti(false);
    
    setCountdown(countdownDuration);
    setIsCountingDown(true);
  }, [isPicking, isCountingDown, availableNames, numWinners, toast, countdownDuration, t]);

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

  // Animation effect
  useEffect(() => {
    if (!isPicking) {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      return;
    }
  
    const finalWinners = sample(availableNames, numWinners);
    const animDuration = Math.max(1, shuffleDuration) * 1000;
  
    const animationEnd = () => {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      handleSelectWinners(finalWinners);
    };
  
    const endTimer = setTimeout(animationEnd, animDuration);
  
    const pool = availableNames.length > 1 ? availableNames : allNames;
    setAnimationNames(sample(pool, numWinners));
    animationIntervalRef.current = setInterval(() => {
      setAnimationNames(sample(pool, numWinners));
    }, 120);
  
    return () => {
      clearTimeout(endTimer);
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [isPicking, allNames, availableNames, numWinners, shuffleDuration, handleSelectWinners]);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setNamesInput(content);
      toast({ title: t('toast-imported-title'), description: t('toast-imported-description') });
    };
    reader.readAsText(file);
    if(importFileRef.current) importFileRef.current.value = "";
  };

  const handleExport = () => {
    if (allNames.length === 0) {
      toast({ variant: "destructive", title: t('toast-no-names-export-title') });
      return;
    }
    const content = allNames.join(getSeparatorChar(separator));
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pickster_names.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: t('toast-exported-title'), description: t('toast-exported-description') });
  };
  
  const handleShuffle = () => {
    const shuffled = [...namesInput.split(getSeparatorChar(separator))].sort(() => Math.random() - 0.5);
    setNamesInput(shuffled.join(getSeparatorChar(separator)));
    toast({ title: t('toast-shuffled-title'), description: t('toast-shuffled-description') });
  };

  const handleClearAll = () => {
    setNamesInput("");
    setAllNames([]);
    setAvailableNames([]);
    setWinners([]);
    setSelectionHistory({});
    setLastWinners([]);
    setAnimationNames([]);
    setActiveGroup(null);
    toast({ title: t('toast-cleared-title'), description: t('toast-cleared-description') });
  };
  
  const handleSaveGroup = () => {
    if (!newGroupName) {
        toast({ variant: 'destructive', title: t('toast-invalid-group-name-title'), description: t('toast-invalid-group-name-description') });
        return;
    }
    if (allNames.length === 0) {
        toast({ variant: 'destructive', title: t('toast-empty-list-save-title'), description: t('toast-empty-list-save-description') });
        return;
    }
    setSavedGroups(prev => ({ ...prev, [newGroupName]: allNames }));
    setActiveGroup(newGroupName);
    setNewGroupName("");
    toast({ title: t('toast-group-saved-title'), description: `"${newGroupName}" ${t('toast-group-saved-description')}`});
  };

  const handleLoadGroup = (groupName: string) => {
    if (!savedGroups[groupName]) return;
    setActiveGroup(groupName);
    const loadedNames = savedGroups[groupName];
    setAllNames(loadedNames);
    setNamesInput(loadedNames.join(getSeparatorChar(separator)));
    setAvailableNames(loadedNames);
    setWinners([]);
    setSelectionHistory({});
    toast({ title: t('toast-group-loaded-title'), description: `${t('toast-group-loaded-description')} "${groupName}".` });
  };

  const handleDeleteGroup = (groupName: string) => {
    const newGroups = { ...savedGroups };
    delete newGroups[groupName];
    setSavedGroups(newGroups);
    if (activeGroup === groupName) {
        handleClearAll();
    }
    toast({ title: t('toast-group-deleted-title'), description: `"${groupName}" ${t('toast-group-deleted-description')}` });
  };
  
  const togglePresentationMode = () => {
    const element = presentationRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    } else {
      element.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        setIsPresentationMode(true); // Fallback
      });
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsPresentationMode(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        handlePickWinners();
      }
      if (e.key === 'Escape' && isPresentationMode) {
        togglePresentationMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePickWinners, isPresentationMode]);

  const filteredWinners = winners.filter(w => w.toLowerCase().includes(searchTerm.toLowerCase()));
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
        } else { // 'main' context
            if (count === 1) return { listClass: 'space-y-1', itemClass: 'text-3xl' };
            if (count <= 4) return { listClass: 'space-y-1', itemClass: 'text-2xl' };
            if (count <= 9) return { listClass: 'grid grid-cols-2 gap-x-4', itemClass: 'text-xl' };
            return { listClass: 'grid grid-cols-3 gap-2', itemClass: 'text-lg' };
        }
    };

    const { listClass, itemClass } = getStyles(names.length);
    const animationClass = isAnimating ? '' : (context === 'presentation' ? 'animate-winner-reveal' : 'animate-winner-flash');
    const colorClass = isAnimating ? 'text-primary/80' : 'text-primary';

    return (
        <ul className={cn("w-full text-center", listClass, context === 'presentation' && 'mt-4')}>
            {names.map((name, i) => (
                <li key={i} className={cn("font-bold font-headline tracking-tight transition-all duration-100 p-1", itemClass, colorClass, animationClass)}>
                    {name}
                </li>
            ))}
        </ul>
    );
  };
  
  const renderAnimation = () => {
    if (isCountingDown) {
        return <div className="animate-countdown-pop text-7xl font-bold text-primary font-headline">{countdown}</div>;
    }
    if (isPickingFinished) {
        return renderWinnerList(lastWinners, 'main', false);
    }
     if (isPicking) {
      return (
        <div className="w-full">
          {animationNames.length > 0 ? (
            renderWinnerList(animationNames, 'main', true)
          ) : (
            <div className="flex justify-center items-center space-x-1">
              <span className="animate-dot-pulse w-3 h-3 bg-primary rounded-full" />
              <span className="animate-dot-pulse animation-delay-200 w-3 h-3 bg-primary rounded-full" />
              <span className="animate-dot-pulse animation-delay-400 w-3 h-3 bg-primary rounded-full" />
            </div>
          )}
        </div>
      );
    }

    return <div className="text-muted-foreground">{t('winners-will-appear-here')}</div>;
  };

  return (
    <TooltipProvider>
      <div ref={presentationRef} className={cn("fixed inset-0 bg-background flex-col items-center justify-center p-8", isPresentationMode ? "flex" : "hidden")}>
          {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={800} />}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={togglePresentationMode} variant="ghost" size="icon" className="absolute top-4 right-4">
                  <Minimize />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('presentation-exit-tooltip')}</p>
            </TooltipContent>
          </Tooltip>

          {isCountingDown && (
               <div className="animate-countdown-pop text-[20vw] font-bold text-primary font-headline">
                  {countdown}
              </div>
          )}

          {isPicking && (
             renderWinnerList(animationNames, 'presentation', true)
          )}
          
          {isPickingFinished && (
               <div className="text-center">
                  <p className="text-muted-foreground text-[2vw]">{lastWinners.length > 1 ? t('presentation-winner-reveal-plural') : t('presentation-winner-reveal-single')}</p>
                  {renderWinnerList(lastWinners, 'presentation', false)}
               </div>
          )}

          {!isPicking && !isCountingDown && !isPickingFinished && (
               <div className="text-center">
                  <Award className="w-32 h-32 text-muted-foreground mx-auto mb-4"/>
                  <h2 className="text-4xl text-muted-foreground font-headline">{t('presentation-ready-title')}</h2>
                  <Button size="lg" className="mt-8" onClick={handlePickWinners}>{t('presentation-start-button')}</Button>
              </div>
          )}
      </div>

      <Card ref={cardRef} className={cn("w-full max-w-7xl shadow-lg font-body relative overflow-hidden my-4", isPresentationMode && "hidden")}>
        {showConfetti && cardRef.current && <Confetti width={cardRef.current.clientWidth} height={cardRef.current.clientHeight} recycle={false} numberOfPieces={400} />}
        
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <CardTitle className="text-3xl font-headline tracking-tight">{t('pickster')}</CardTitle>
              <ChangelogDialog />
            </div>
            <CardDescription className="mt-1 text-muted-foreground">
              {t('appDescription')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setIsSoundEnabled(p => !p)} variant="outline" size="icon">
                      {isSoundEnabled ? <Volume2 /> : <VolumeX />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{t('toggleSound')}</p></TooltipContent>
              </Tooltip>
              <LanguageToggle />
              <ThemeToggle />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={togglePresentationMode} variant="outline" size="icon">
                      <Expand />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('presentationModeTooltip')}</p>
                    <p className="text-xs text-muted-foreground">{t('presentationModeTooltipTip')}</p>
                </TooltipContent>
              </Tooltip>
          </div>
        </CardHeader>
        
        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Input */}
          <div className="flex flex-col gap-4">
              <Tabs defaultValue="input" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="input"><Plus className="mr-2"/>{t('new-list')}</TabsTrigger>
                      <TabsTrigger value="groups"><Book className="mr-2"/>{t('saved-groups')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="input">
                      <Textarea
                          placeholder={t('namesPlaceholder')}
                          className="min-h-[200px] lg:min-h-[360px] mt-2 text-base"
                          value={namesInput}
                          onChange={(e) => setNamesInput(e.target.value)}
                      />
                      <Button onClick={handleSetNames} className="w-full mt-2">{t('set-as-current-list')}</Button>
                  </TabsContent>
                  <TabsContent value="groups">
                      <div className="mt-2 space-y-2">
                          <Select onValueChange={handleLoadGroup} value={activeGroup || ""}>
                              <SelectTrigger>
                                  <SelectValue placeholder={t('select-group-placeholder')} />
                              </SelectTrigger>
                              <SelectContent>
                                  {Object.keys(savedGroups).length > 0 ? Object.keys(savedGroups).map(name => (
                                      <SelectItem key={name} value={name}>{name}</SelectItem>
                                  )) : <div className="p-4 text-sm text-muted-foreground text-center">No saved groups.</div>}
                              </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                              <Input 
                                  placeholder={t('new-group-name-placeholder')} 
                                  value={newGroupName} 
                                  onChange={(e) => setNewGroupName(e.target.value)}
                              />
                              <Button onClick={handleSaveGroup}><Save className="mr-2"/>{t('save-current-group')}</Button>
                          </div>
                          {activeGroup && (
                              <Button variant="destructive" className="w-full" onClick={() => handleDeleteGroup(activeGroup)}>
                                  <Trash2 className="mr-2"/> {t('delete-group-prefix')} "{activeGroup}"
                              </Button>
                          )}
                      </div>
                  </TabsContent>
              </Tabs>
          </div>

          {/* Column 2: Settings & Actions */}
          <div className="flex flex-col gap-4 rounded-lg bg-muted/30 dark:bg-muted/10 p-4">
            <h3 className="text-lg font-medium tracking-tight text-foreground/90 flex items-center gap-2"><Settings /> {t('settings-actions')}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <Label htmlFor="num-winners">{t('winners-label')}</Label>
                      <Input id="num-winners" type="number" min="1" max={allNames.length || 1} value={numWinners} onChange={(e) => setNumWinners(Math.max(1, parseInt(e.target.value) || 1))} />
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="shuffle-duration">{t('anim-duration-label')}</Label>
                      <Input id="shuffle-duration" type="number" min="1" max="10" value={shuffleDuration} onChange={(e) => setShuffleDuration(Math.max(1, parseInt(e.target.value) || 1))} />
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="countdown-duration">{t('timer-label')}</Label>
                      <Input id="countdown-duration" type="number" min="0" max="10" value={countdownDuration} onChange={(e) => setCountdownDuration(Math.max(0, parseInt(e.target.value) || 0))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="separator">{t('name-separator-label')}</Label>
                    <Select value={separator} onValueChange={(v: SeparatorType) => setSeparator(v)}>
                        <SelectTrigger id="separator"><SelectValue placeholder="Separator" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newline">{t('separator-newline')}</SelectItem>
                            <SelectItem value="comma">{t('separator-comma')}</SelectItem>
                            <SelectItem value="semicolon">{t('separator-semicolon')}</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-background/50 p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="remove-after-picking">{t('remove-after-picking-label')}</Label>
                    <p className="text-xs text-muted-foreground">{t('remove-after-picking-description')}</p>
                  </div>
                  <Switch
                      id="remove-after-picking"
                      checked={removeAfterPicking}
                      onCheckedChange={setRemoveAfterPicking}
                  />
              </div>
              <Separator/>
              <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={handleShuffle}><Shuffle/>{t('shuffle-input-button')}</Button>
                    <Button variant="outline" onClick={handleReset}><RotateCcw/>{t('reset-winners-button')}</Button>
                    <Button variant="outline" onClick={() => importFileRef.current?.click()}><Upload />{t('import-from-txt')}</Button>
                    <Button variant="outline" onClick={handleExport}><Download/>{t('export-to-txt')}</Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="col-span-2"><Trash2/>{t('clear-everything')}</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('clear-everything-confirm-title')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('clear-everything-confirm-description')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearAll} className={buttonVariants({ variant: "destructive" })}>{t('confirm-clear')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <input type="file" ref={importFileRef} onChange={handleImport} accept=".txt" className="hidden" />
              </div>
            </div>
          </div>
  
          {/* Column 3: Results */}
          <div className="flex flex-col gap-4">
              <div className="bg-muted/50 dark:bg-muted/20 rounded-lg text-center p-4 min-h-[200px] lg:min-h-[300px] flex items-center justify-center">
                   {renderAnimation()}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                  <Button className="text-lg py-6" onClick={handlePickWinners} disabled={isPicking || isCountingDown || availableNames.length === 0}>
                      {isCountingDown ? <><Timer className="animate-spin"/>{t('starting-button')}</> : isPicking ? <><Award/>{t('picking-button')}</> : <><Award/>{t('pick-winners-button')}</>}
                  </Button>
              </div>

              <div className="flex justify-around w-full text-center py-2 bg-muted/30 dark:bg-muted/10 rounded-lg">
                  <div><div className="font-bold text-2xl font-headline">{allNames.length}</div><div className="text-sm text-muted-foreground">{t('total-label')}</div></div>
                  <div><div className="font-bold text-2xl font-headline">{winners.length}</div><div className="text-sm text-muted-foreground">{t('selected-label')}</div></div>
                  <div><div className="font-bold text-2xl font-headline">{availableNames.length}</div><div className="text-sm text-muted-foreground">{t('available-label')}</div></div>
              </div>
          </div>
        </CardContent>
  
        <CardFooter className="flex-col items-start gap-4 p-6 pt-4">
          <Separator className="w-full" />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full"><History className="mr-2"/> {t('view-history-button')}</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{t('history-title')}</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <Input
                  placeholder={t('search-winners-placeholder')}
                  className="mb-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ScrollArea className="h-[calc(100vh-10rem)] w-full">
                  <ul className="space-y-1 pr-4">
                    {winners.length > 0 ? filteredWinners.slice().reverse().map((winner, i) => (
                      <li key={`${winner}-${i}`} className={cn("p-2 rounded-md flex justify-between items-center text-sm", lastWinners.includes(winner) ? "bg-primary/10 animate-winner-flash" : "bg-muted/50 dark:bg-muted/20")}>
                        <span>{winners.length - i}. {winner}</span>
                        <span className="text-xs text-muted-foreground">{t('history-picked-times').replace('{count}', (selectionHistory[winner] || 1).toString())}</span>
                      </li>
                    )) : <p className="text-sm text-muted-foreground text-center py-8">{t('history-empty')}</p>}
                  </ul>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex justify-center items-center gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-primary hover:underline">{t('about-link')}</Link>
            <Link href="/privacy-policy" className="hover:text-primary hover:underline">{t('privacy-policy-link')}</Link>
            <Link href="/terms-of-service" className="hover:text-primary hover:underline">{t('terms-of-service-link')}</Link>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}

    

    