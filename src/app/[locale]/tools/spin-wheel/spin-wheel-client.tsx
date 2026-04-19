"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Shuffle, Settings, List, Sparkles,
  Layout, Volume2, VolumeX, Repeat, Trophy,
  Palette, Timer, AlarmClock, Hash, ChevronDown,
} from "lucide-react";
import { SpinWheelCanvas } from "./spin-wheel-canvas";
import { SpinWheelTemplates } from "./spin-wheel-templates";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/get-dictionary";

// ─── Presets ────────────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444",
  "#F59E0B", "#10B981", "#3B82F6", "#14B8A6",
  "#F97316", "#84CC16", "#06B6D4", "#D946EF",
];

// ─── Props ───────────────────────────────────────────────────────────────────────

interface SpinWheelClientProps {
  locale: string;
  dictionary: Dictionary;
}

// ─── Component ───────────────────────────────────────────────────────────────────

export function SpinWheelClient({ locale }: SpinWheelClientProps) {
  // ── Core state ───────────────────────────────────────────────────────────────
  const [entries, setEntries] = useState<string[]>([
    "Apple", "Banana", "Cherry", "Dragonfruit", "Elderberry", "Fig",
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerHistory, setWinnerHistory] = useState<string[]>([]);
  const [entryColors, setEntryColors] = useState<Record<string, string>>({});

  // Template context for contextual winner popup
  const [templateContext, setTemplateContext] = useState<string | undefined>(undefined);

  // Settings
  const [spinDuration, setSpinDuration] = useState(5);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isIdleSpinEnabled, setIsIdleSpinEnabled] = useState(true);
  const [isRaffleMode, setIsRaffleMode] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false); // default OFF per user request

  // Timer Mode (auto-spin)
  const [isTimerMode, setIsTimerMode] = useState(false);
  const [timerInterval, setTimerInterval] = useState(10);
  const [timerCountdown, setTimerCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggerSpinRef = useRef<(() => void) | null>(null);

  // Design
  const [wheelTitle, setWheelTitle] = useState(
    locale === "id" ? "Putar Roda" : "Spin the Wheel"
  );
  const [wheelDesc, setWheelDesc] = useState(
    locale === "id"
      ? "Tambahkan nama, klik Putar, dan dapatkan pemenang acak!"
      : "Add entries, spin, and get a random winner!"
  );

  // ── i18n ─────────────────────────────────────────────────────────────────────
  const t = {
    pageTitle: "Spin Wheel",
    pageDesc: locale === "id"
      ? "Roda putar interaktif — masukkan nama, putar, dan pilih pemenang secara acak."
      : "Interactive randomizer wheel — add entries, spin, and pick a winner at random.",

    tabList:      locale === "id" ? "Daftar"     : "Entries",
    tabTemplates: locale === "id" ? "Templat"    : "Templates",
    tabSettings:  locale === "id" ? "Opsi"       : "Settings",
    tabEdit:      locale === "id" ? "Desain"     : "Design",
    tabHistory:   locale === "id" ? "Riwayat"    : "History",

    entriesLabel:       locale === "id" ? "Daftar Nama"    : "Entry List",
    entriesPlaceholder: locale === "id" ? "Satu nama per baris..." : "One entry per line...",
    itemCount:          (n: number) => locale === "id" ? `${n} item` : `${n} items`,

    shuffle:       locale === "id" ? "Acak Urutan"     : "Shuffle",
    historyTitle:  locale === "id" ? "Riwayat Pemenang" : "Winner History",
    deleteHistory: locale === "id" ? "Hapus Riwayat"   : "Clear History",
    noWinners:     locale === "id" ? "Belum ada pemenang." : "No winners yet.",

    spinDurationLabel: locale === "id" ? "Durasi Putaran"  : "Spin Duration",
    muteLabel:         locale === "id" ? "Bisukan Suara"   : "Mute Sound",
    idleSpinLabel:     locale === "id" ? "Putaran Idle"    : "Idle Spin",
    raffleModeLabel:   locale === "id" ? "Mode Raffle"     : "Raffle Mode",
    raffleModeDesc:    locale === "id"
      ? "Hapus otomatis pemenang dari daftar"
      : "Automatically remove winner from list",

    countdownLabel: locale === "id" ? "Hitung Mundur 3-2-1" : "Countdown 3-2-1",
    countdownDesc:  locale === "id"
      ? "Tampilkan hitungan mundur sebelum roda berputar"
      : "Show countdown before the wheel spins",

    timerModeLabel:    locale === "id" ? "Mode Timer"        : "Timer Mode",
    timerModeDesc:     locale === "id"
      ? "Putar otomatis setiap beberapa detik"
      : "Auto-spin every few seconds",
    timerIntervalLabel: locale === "id" ? "Interval Timer"   : "Timer Interval",

    wheelTitleLabel:   locale === "id" ? "Judul Roda"        : "Wheel Title",
    wheelDescLabel:    locale === "id" ? "Deskripsi"         : "Description",
    colorPickerLabel:  locale === "id" ? "Warna per Item"    : "Color per Item",

    spinButton:   locale === "id" ? "Putar"                : "Spin",
    spaceToSpin:  locale === "id" ? "Spacebar untuk memutar" : "Spacebar to spin",
    winnerTitle:  locale === "id" ? "Pemenang!"            : "Winner!",
    closeButton:  locale === "id" ? "Tutup"                : "Close",
    removeWinner: locale === "id" ? "Hapus dari Daftar"    : "Remove from List",
  };

  // ── Shuffle ───────────────────────────────────────────────────────────────────
  const handleShuffle = () => setEntries(prev => [...prev].sort(() => Math.random() - 0.5));

  // ── Template selection ────────────────────────────────────────────────────────
  const handleSelectTemplate = (items: string[], context?: string) => {
    setEntries(items);
    setTemplateContext(context);
  };

  // ── Timer Mode ────────────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setTimerCountdown(null);
  }, []);

  const startTimerCycle = useCallback(() => {
    stopTimer();
    let remaining = timerInterval;
    setTimerCountdown(remaining);
    timerRef.current = setInterval(() => {
      remaining--;
      setTimerCountdown(remaining);
      if (remaining <= 0) {
        remaining = timerInterval;
        setTimerCountdown(remaining);
        const valid = entries.map(e => e.trim()).filter(Boolean);
        if (!isSpinning && valid.length >= 2) {
          triggerSpinRef.current?.();
        }
      }
    }, 1000);
  }, [stopTimer, timerInterval, entries, isSpinning]);

  useEffect(() => {
    if (!isTimerMode) { stopTimer(); return; }
    startTimerCycle();
    return stopTimer;
  }, [isTimerMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pause timer while spinning, resume after
  useEffect(() => {
    if (isSpinning) stopTimer();
    else if (isTimerMode) startTimerCycle();
  }, [isSpinning]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Color helpers ─────────────────────────────────────────────────────────────
  const setColor  = (item: string, color: string) => setEntryColors(prev => ({ ...prev, [item]: color }));
  const clearColor = (item: string) => setEntryColors(prev => { const n = { ...prev }; delete n[item]; return n; });

  // ── Render ────────────────────────────────────────────────────────────────────

  const filteredEntries = useMemo(() => entries.map(e => e.trim()).filter(Boolean), [entries]);

  return (
    <TooltipProvider delayDuration={300}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

        {/* ── Page heading ─────────────────────────────────────────────── */}
        <header className="text-center space-y-3 mb-10">
          <h1 className="font-display text-4xl font-extrabold tracking-tighter text-primary uppercase">
            {t.pageTitle}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-accent/30" />
            <p className="text-muted-foreground italic text-lg font-medium">{t.pageDesc}</p>
            <div className="h-px w-8 bg-accent/30" />
          </div>
        </header>

        {/* ── Main grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-start">

          {/* Left: Wheel (canvas includes title, desc, winner popup internally) */}
          <div className="flex flex-col items-center gap-4">
            {/* Timer badge */}
            {isTimerMode && timerCountdown !== null && (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-bold animate-pulse">
                <AlarmClock className="w-4 h-4" />
                Auto-spin in {timerCountdown}s
              </div>
            )}

            <SpinWheelCanvas
              entries={entries}
              setEntries={setEntries}
              entryColors={entryColors}
              isSpinning={isSpinning}
              setIsSpinning={setIsSpinning}
              setWinnerHistory={setWinnerHistory}
              showCountdown={showCountdown}
              templateContext={templateContext}
              wheelTitle={wheelTitle}
              wheelDesc={wheelDesc}
              triggerSpinRef={triggerSpinRef}
              settings={{ spinDuration, isMuted, volume, isIdleSpinEnabled, isRaffleMode }}
              labels={{
                spinButton: t.spinButton,
                spaceToSpin: t.spaceToSpin,
                winnerTitle: t.winnerTitle,
                closeButton: t.closeButton,
                removeWinner: t.removeWinner,
              }}
            />
          </div>

          {/* Right: Control panel */}
          <Card className="border-2 shadow-xl rounded-2xl overflow-hidden">
            <Tabs defaultValue="entries" className="flex flex-col">
              {/* 5 tabs: Entries | Templates | Settings | Design | History */}
              <TabsList className="grid grid-cols-5 h-14 rounded-none bg-muted/40 border-b shrink-0">
                <TabsTrigger value="entries" className="flex flex-col gap-0.5 h-full py-1 data-[state=active]:bg-background text-xs">
                  <List className="w-4 h-4" />
                  <span>{t.tabList}</span>
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex flex-col gap-0.5 h-full py-1 data-[state=active]:bg-background text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>{t.tabTemplates}</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex flex-col gap-0.5 h-full py-1 data-[state=active]:bg-background text-xs">
                  <Settings className="w-4 h-4" />
                  <span>{t.tabSettings}</span>
                </TabsTrigger>
                <TabsTrigger value="customize" className="flex flex-col gap-0.5 h-full py-1 data-[state=active]:bg-background text-xs">
                  <Layout className="w-4 h-4" />
                  <span>{t.tabEdit}</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="relative flex flex-col gap-0.5 h-full py-1 data-[state=active]:bg-background text-xs">
                  <Trophy className="w-4 h-4" />
                  <span>{t.tabHistory}</span>
                  {winnerHistory.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                      {winnerHistory.length > 9 ? "9+" : winnerHistory.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ── Entries ────────────────────────────────────────────────── */}
              <TabsContent value="entries" className="p-5 flex flex-col gap-4 focus-visible:ring-0 min-h-125">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-base">{t.entriesLabel}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleShuffle} disabled={entries.length < 2}>
                        <Shuffle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.shuffle}</TooltipContent>
                  </Tooltip>
                </div>

                <Textarea
                  value={entries.join("\n")}
                  onChange={e => {
                    setEntries(e.target.value.split("\n"));
                    // Reset template context when user manually edits entries
                    setTemplateContext(undefined);
                  }}
                  placeholder={t.entriesPlaceholder}
                  className="flex-1 min-h-70 font-mono text-sm resize-none bg-muted/20 border-2 rounded-xl p-3 leading-relaxed"
                />

                <p className="text-xs text-muted-foreground font-medium text-right">
                  {t.itemCount(filteredEntries.length)}
                </p>
              </TabsContent>

              {/* ── Templates ──────────────────────────────────────────────── */}
              <TabsContent value="templates" className="p-0 focus-visible:ring-0 min-h-125">
                <SpinWheelTemplates
                  onSelectTemplate={(items, context) => handleSelectTemplate(items, context)}
                />
              </TabsContent>

              {/* ── Settings ───────────────────────────────────────────────── */}
              <TabsContent value="settings" className="p-5 flex flex-col gap-6 focus-visible:ring-0 min-h-125">

                {/* Spin Duration */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="font-bold">{t.spinDurationLabel}</Label>
                    <span className="text-sm font-mono bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-bold">
                      {spinDuration}s
                    </span>
                  </div>
                  <input type="range" min={2} max={10} step={1} value={spinDuration}
                    onChange={e => setSpinDuration(Number(e.target.value))}
                    className="w-full h-2 rounded-full accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-medium">
                    <span>2s</span><span>10s</span>
                  </div>
                </div>

                {/* Sound */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold flex items-center gap-2">
                      {isMuted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4" />}
                      {t.muteLabel}
                    </Label>
                    <Switch checked={isMuted} onCheckedChange={setIsMuted} />
                  </div>
                  {!isMuted && (
                    <div className="space-y-1.5">
                      <input type="range" min={0} max={1} step={0.1} value={volume}
                        onChange={e => setVolume(Number(e.target.value))}
                        className="w-full h-2 rounded-full accent-primary cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span className="font-mono font-bold">{Math.round(volume * 100)}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t" />

                {/* Idle spin */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-bold flex items-center gap-2">
                      <Repeat className="h-4 w-4" /> {t.idleSpinLabel}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {locale === "id" ? "Roda berputar pelan saat idle" : "Wheel slowly rotates when idle"}
                    </p>
                  </div>
                  <Switch checked={isIdleSpinEnabled} onCheckedChange={setIsIdleSpinEnabled} />
                </div>

                {/* Raffle mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-bold flex items-center gap-2">
                      <Trophy className="h-4 w-4" /> {t.raffleModeLabel}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.raffleModeDesc}</p>
                  </div>
                  <Switch checked={isRaffleMode} onCheckedChange={setIsRaffleMode} />
                </div>

                {/* Countdown 3-2-1 (default OFF) */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-bold flex items-center gap-2">
                      <Hash className="h-4 w-4" /> {t.countdownLabel}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.countdownDesc}</p>
                  </div>
                  <Switch checked={showCountdown} onCheckedChange={setShowCountdown} />
                </div>

                <div className="border-t" />

                {/* Timer Mode */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-bold flex items-center gap-2">
                        <Timer className="h-4 w-4" /> {t.timerModeLabel}
                        {isTimerMode && (
                          <Badge className="h-4 px-1.5 text-[8px] font-black uppercase bg-accent/10 text-accent border-none animate-pulse">ON</Badge>
                        )}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.timerModeDesc}</p>
                    </div>
                    <Switch checked={isTimerMode} onCheckedChange={v => { setIsTimerMode(v); if (!v) stopTimer(); }} />
                  </div>

                  {isTimerMode && (
                    <div className="space-y-2 pl-4 border-l-2 border-accent/20">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-bold">{t.timerIntervalLabel}</Label>
                        <span className="text-sm font-mono bg-accent/10 text-accent px-2.5 py-1 rounded-lg font-bold">{timerInterval}s</span>
                      </div>
                      <input type="range" min={5} max={60} step={5} value={timerInterval}
                        onChange={e => { setTimerInterval(Number(e.target.value)); stopTimer(); }}
                        className="w-full h-2 rounded-full accent-accent cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <span>5s</span><span>60s</span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Design ─────────────────────────────────────────────────── */}
              <TabsContent value="customize" className="p-5 flex flex-col gap-5 focus-visible:ring-0 min-h-125">
                <div className="space-y-2">
                  <Label className="font-bold">{t.wheelTitleLabel}</Label>
                  <Input value={wheelTitle} onChange={e => setWheelTitle(e.target.value)}
                    className="border-2 h-12 text-base rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">{t.wheelDescLabel}</Label>
                  <Textarea value={wheelDesc} onChange={e => setWheelDesc(e.target.value)}
                    rows={3} className="border-2 text-sm rounded-xl bg-muted/20" />
                </div>

                {/* Color per Item */}
                {filteredEntries.length > 0 && (
                  <div className="space-y-3">
                    <Label className="font-bold flex items-center gap-2">
                      <Palette className="h-4 w-4" /> {t.colorPickerLabel}
                    </Label>
                    <ScrollArea className="h-55 rounded-xl border-2 p-3 bg-muted/20">
                      <div className="space-y-3">
                        {filteredEntries.map((item, i) => {
                          const currentColor = entryColors[item];
                          return (
                            <div key={`${item}-${i}`} className="flex items-center gap-3">
                              <div
                                className="w-5 h-5 rounded-full shrink-0 border-2 border-white/30 shadow-sm"
                                style={{
                                  background: currentColor || [
                                    "#6366F1","#F59E0B","#10B981","#EC4899",
                                    "#3B82F6","#EF4444","#8B5CF6","#14B8A6",
                                  ][i % 8],
                                }}
                              />
                              <span className="text-sm font-medium flex-1 truncate">{item}</span>
                              <div className="flex gap-1 flex-wrap justify-end max-w-35">
                                {COLOR_PRESETS.map(color => (
                                  <button key={color}
                                    onClick={() => currentColor === color ? clearColor(item) : setColor(item, color)}
                                    className="w-4 h-4 rounded-full border transition-transform hover:scale-125 focus:outline-none"
                                    style={{
                                      background: color,
                                      borderColor: currentColor === color ? "#fff" : "transparent",
                                      boxShadow: currentColor === color ? `0 0 0 2px ${color}` : "none",
                                    }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    <p className="text-xs text-muted-foreground">
                      {locale === "id"
                        ? "Klik warna untuk ubah, klik lagi untuk reset"
                        : "Click a swatch to set, click again to reset"}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── History Tab (not Dialog) ───────────────────────────────── */}
              <TabsContent value="history" className="p-5 flex flex-col gap-4 focus-visible:ring-0 min-h-125">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    {t.historyTitle}
                  </Label>
                  {winnerHistory.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setWinnerHistory([])}
                      className="text-destructive text-xs font-bold h-8 px-3 hover:bg-destructive/10"
                    >
                      {t.deleteHistory}
                    </Button>
                  )}
                </div>

                <ScrollArea className="flex-1 rounded-xl border-2 bg-muted/20 min-h-100">
                  {winnerHistory.length > 0 ? (
                    <ol className="p-3 space-y-2">
                      {winnerHistory.map((item, idx) => (
                        <li
                          key={idx}
                          className="p-3 bg-card border rounded-xl flex justify-between items-center text-sm gap-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-muted-foreground text-xs font-mono shrink-0">
                              #{winnerHistory.length - idx}
                            </span>
                            <span className="font-bold truncate">{item}</span>
                          </div>
                          {idx === 0 && (
                            <Badge className="shrink-0 text-[9px] font-black bg-amber-500/10 text-amber-600 border-amber-500/20 h-5">
                              Latest
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="h-full min-h-95 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <ChevronDown className="w-10 h-10 opacity-20" />
                      <p className="text-sm font-medium">{t.noWinners}</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

            </Tabs>
          </Card>

        </div>
      </main>
    </TooltipProvider>
  );
}
