"use client";

import React, {
  useState, useRef, useEffect, useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Maximize2, Minimize2, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SpinWheelCanvasProps {
  entries: string[];
  setEntries: React.Dispatch<React.SetStateAction<string[]>>;
  entryColors: Record<string, string>;
  isSpinning: boolean;
  setIsSpinning: (v: boolean) => void;
  setWinnerHistory: React.Dispatch<React.SetStateAction<string[]>>;
  showCountdown: boolean;   // controlled by parent (default OFF)
  templateContext?: string; // e.g. "quran" | "prayers" | "misc" | undefined
  wheelTitle: string;
  wheelDesc: string;
  triggerSpinRef?: React.MutableRefObject<(() => void) | null>;
  settings: {
    spinDuration: number;
    isMuted: boolean;
    volume: number;
    isIdleSpinEnabled: boolean;
    isRaffleMode: boolean;
  };
  labels: {
    spinButton: string;
    spaceToSpin: string;
    winnerTitle: string;
    closeButton: string;
    removeWinner: string;
  };
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_WHEEL_COLORS = [
  "#6366F1", "#F59E0B", "#10B981", "#EC4899",
  "#3B82F6", "#EF4444", "#8B5CF6", "#14B8A6",
];

// Speed for idle rotation
const IDLE_SPEED = 0.0015;
const WINNER_POPUP_DELAY_MS = 520;
const POINTER_MAX_ANGLE_DEG = 22;

// Spin easing: quintic ease-out gives a natural wheel motion —
// very high initial velocity that decelerates dramatically toward zero.
// Position:  pos(p) = D × (1 − (1 − p)⁵)
// Velocity:  vel(p) = D × 5 × (1 − p)⁴ / T
const EASING_POWER = 5;

function spinEasedPosition(progress: number, totalDist: number): number {
  return totalDist * (1 - Math.pow(1 - progress, EASING_POWER));
}

function spinEasedVelocity(progress: number, totalDist: number, durationSec: number): number {
  return totalDist * EASING_POWER * Math.pow(1 - progress, EASING_POWER - 1) / durationSec;
}

// ─── Helper: draw text on arc ───────────────────────────────────────────────────

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number, cy: number,
  radius: number,
  midAngle: number,
  fontSize: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(midAngle);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = `700 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 4;
  const maxW = radius * 0.72;
  const measured = ctx.measureText(text);
  const displayText =
    measured.width > maxW
      ? text.slice(0, Math.floor((text.length * maxW) / measured.width) - 1) + "…"
      : text;
  ctx.fillText(displayText, radius - 22, fontSize * 0.36, maxW);
  ctx.restore();
}

// ─── Confetti ────────────────────────────────────────────────────────────────────

const CONFETTI_PALETTE = [
  "#6366F1", "#F59E0B", "#10B981", "#EC4899",
  "#3B82F6", "#A855F7", "#22C55E",
];

type ConfettiPiece = {
  id: number;
  x: number;
  delay: number;
  duration: number;
  w: number;
  h: number;
  color: string;
  rotate: number;
  drift: number;
  isCircle: boolean;
};

function ConfettiOverlay({ onDone }: { onDone: () => void }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 48 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      delay: Math.random() * 0.8,
      duration: 2.0 + Math.random() * 1.2,
      w: 6 + Math.random() * 8,
      h: 3 + Math.random() * 5,
      color: CONFETTI_PALETTE[i % CONFETTI_PALETTE.length],
      rotate: Math.random() * 360,
      drift: (Math.random() - 0.5) * 140,
      isCircle: i % 5 === 0,
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPieces(generated);

    const max = Math.max(...generated.map(p => p.delay + p.duration)) * 1000 + 300;
    const t = setTimeout(onDone, max);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-none" aria-hidden>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: "-16px",
            width: p.isCircle ? p.w : p.w,
            height: p.isCircle ? p.w : p.h,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? "50%" : "2px",
            opacity: 0.85,
            animation: `cfFall ${p.duration}s cubic-bezier(0.25,0.46,0.45,0.94) ${p.delay}s both`,
            transform: `rotate(${p.rotate}deg)`,
            "--drift": `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
      <style>{`
        @keyframes cfFall {
          from { transform: translateY(0) translateX(0) rotate(0deg); opacity:0.9; }
          to   { transform: translateY(110vh) translateX(var(--drift)) rotate(540deg); opacity:0; }
        }
      `}</style>
    </div>
  );
}

// ─── Template context labels ────────────────────────────────────────────────────

function getTemplateWinnerLabel(ctx: string | undefined): { emoji: string; label: string } {
  switch (ctx) {
    case "quran":   return { emoji: "📖", label: "Surah Terpilih" };
    case "prayers": return { emoji: "🤲", label: "Doa Terpilih" };
    default:        return { emoji: "🏆", label: "Winner!" };
  }
}

// ─── Winner Card (Glassmorphism, renders inside wrapperRef) ─────────────────────

interface WinnerCardProps {
  winner: string;
  winnerColor: string;
  templateContext?: string;
  labels: SpinWheelCanvasProps["labels"];
  isRaffleMode: boolean;
  isFullscreen: boolean;
  onClose: () => void;
  onRemove: () => void;
  onSpinAgain: () => void;
}

function WinnerCard({
  winner, winnerColor, templateContext, labels, isRaffleMode,
  isFullscreen, onClose, onRemove, onSpinAgain,
}: WinnerCardProps) {
  const [visible, setVisible] = useState(false);
  const { emoji, label } = getTemplateWinnerLabel(templateContext);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 260);
  };

  // In fullscreen: render as absolute overlay inside the wrapper.
  // Outside fullscreen: render as fixed overlay over the whole page.
  const positionClass = isFullscreen
    ? "absolute inset-0 z-60"
    : "fixed inset-0 z-300";

  return (
    <div
      className={`${positionClass} flex items-center justify-center p-4`}
      style={{
        background: `radial-gradient(ellipse at 50% 45%, ${winnerColor}28 0%, rgba(0,0,0,0.68) 62%)`,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        transition: "opacity 0.26s ease",
        opacity: visible ? 1 : 0,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: 420,
          borderRadius: 28,
          border: `1.5px solid ${winnerColor}55`,
          boxShadow: `0 0 0 1px ${winnerColor}18, 0 28px 80px rgba(0,0,0,0.45), 0 0 70px ${winnerColor}18`,
          transform: visible ? "translateY(0) scale(1)" : "translateY(36px) scale(0.90)",
          transition: "transform 0.42s cubic-bezier(0.34,1.56,0.64,1), opacity 0.26s ease",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* ── Rich gradient header ── */}
        <div
          className="relative flex flex-col items-center justify-end gap-3 pt-10 pb-6"
          style={{
            background: `linear-gradient(160deg, ${winnerColor} 0%, ${winnerColor}cc 55%, ${winnerColor}88 100%)`,
          }}
        >
          {/* Subtle noise overlay */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "180px",
            }}
          />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-black/20 hover:bg-black/38 text-white/75 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Emoji — pops in with spring */}
          <div
            className="relative z-10 text-6xl leading-none select-none"
            style={{
              filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.30))",
              animation: "wcEmojiPop 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.06s both",
            }}
          >
            {emoji}
          </div>

          {/* Badge */}
          <span
            className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/22 text-white/90"
            style={{ animation: "wcFadeUp 0.38s ease 0.22s both" }}
          >
            <Sparkles className="w-3 h-3" />
            {label}
          </span>
        </div>

        {/* ── Body ── */}
        <div
          className="flex flex-col items-center gap-5 px-7 pt-7 pb-7"
          style={{ background: "hsl(var(--card))" }}
        >
          {/* Winner name */}
          <div
            className="font-display font-black tracking-tight leading-tight break-words text-center w-full"
            style={{
              fontSize: "clamp(2rem, 6vw, 2.75rem)",
              color: winnerColor,
              textShadow: `0 0 24px ${winnerColor}60, 0 0 56px ${winnerColor}28`,
              animation: "wcFadeUp 0.44s cubic-bezier(0.22,1,0.36,1) 0.16s both",
            }}
          >
            {winner}
          </div>

          {/* Accent divider */}
          <div
            className="w-10 h-0.5 rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${winnerColor}70, transparent)` }}
          />

          {/* Action buttons */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => { onSpinAgain(); handleClose(); }}
              className="flex-1 h-12 font-bold gap-2 rounded-2xl border-2 transition-all hover:border-primary/30"
            >
              <RotateCcw className="h-4 w-4" />
              Spin Again
            </Button>
            <Button
              onClick={() => { if (!isRaffleMode) onRemove(); handleClose(); }}
              disabled={isRaffleMode}
              className="flex-1 h-12 font-bold rounded-2xl border-0 transition-all"
              style={!isRaffleMode ? {
                background: `linear-gradient(135deg, ${winnerColor} 0%, ${winnerColor}cc 100%)`,
                color: "#fff",
                boxShadow: `0 4px 18px ${winnerColor}50`,
              } : {}}
            >
              {labels.removeWinner}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wcEmojiPop {
          from { opacity: 0; transform: scale(0.25) rotate(-18deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes wcFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function SpinWheelCanvas({
  entries, setEntries, entryColors, isSpinning, setIsSpinning,
  setWinnerHistory, settings, labels, showCountdown, templateContext,
  wheelTitle, wheelDesc, triggerSpinRef,
}: SpinWheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animIdRef = useRef<number | null>(null);
  const rotRef = useRef(0);
  const lastTickRotRef = useRef(0);
  const dprRef = useRef(1);
  
  // Time-based spin state
  const pendingWinnerRef = useRef<{ name: string; color: string } | null>(null);

  const [winner, setWinner] = useState<string | null>(null);
  const [winnerColor, setWinnerColor] = useState("#6366F1");
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAwaitingWinnerReveal, setIsAwaitingWinnerReveal] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const winnerRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Physics state
  const physicsRef = useRef({
    startRot: 0,
    totalDist: 0,
    targetRot: 0,
    startTimeMs: 0,
    durationMs: 0,
    peakVelocity: 0,
  });
  const lastFrameTimeRef = useRef(0);
  const pointerPhysicsRef = useRef({ angle: 0, velocity: 0 });
  // ── Helpers ───────────────────────────────────────────────────────────────────

  const filtered = useCallback(
    () => entries.map(e => e.trim()).filter(Boolean),
    [entries]
  );

  const removeWinner = useCallback(
    (w: string) => setEntries(prev => {
      const idx = prev.findIndex(e => e.trim() === w.trim());
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    }),
    [setEntries]
  );

  const getSegmentColor = useCallback((item: string, index: number) =>
    entryColors[item] || DEFAULT_WHEEL_COLORS[index % DEFAULT_WHEEL_COLORS.length],
    [entryColors]
  );

  // ── Canvas sizing ─────────────────────────────────────────────────────────────

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    const size = Math.min(container.clientWidth, container.clientHeight);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
  }, []);

  useEffect(() => {
    resizeCanvas();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(el);
    return () => ro.disconnect();
  }, [resizeCanvas]);

  // ── Draw ──────────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = dprRef.current;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.max(0, Math.min(cx, cy) - 8 * dpr);
    const items = filtered();
    const n = items.length;
    const arc = n > 0 ? (2 * Math.PI) / n : 0;
    const fs = Math.max(8 * dpr, Math.min(16 * dpr, R / Math.max(n, 5)));

    ctx.clearRect(0, 0, W, H);

    // Outer glow ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R + 6 * dpr, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(99,102,241,0.18)";
    ctx.lineWidth = 10 * dpr;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotRef.current);
    ctx.translate(-cx, -cy);

    if (n === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      g.addColorStop(0, "#334155");
      g.addColorStop(1, "#1e293b");
      ctx.fillStyle = g;
      ctx.fill();
    } else {
      for (let i = 0; i < n; i++) {
        const a = i * arc;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a, a + arc);
        ctx.closePath();
        ctx.fillStyle = getSegmentColor(items[i], i);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();
        drawLabel(ctx, items[i], cx, cy, R, a + arc / 2, fs);
      }
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.12, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fill();
    }
    ctx.restore();
  }, [filtered, getSegmentColor]);

  const syncPointer = useCallback(() => {
    const pointer = pointerRef.current;
    if (!pointer) return;
    const angle = Math.max(-POINTER_MAX_ANGLE_DEG, Math.min(POINTER_MAX_ANGLE_DEG, pointerPhysicsRef.current.angle));
    const stretch = 1 + Math.min(Math.abs(angle) / POINTER_MAX_ANGLE_DEG, 0.16);
    pointer.style.transform = `translateX(-50%) translateY(-2px) rotate(${angle}deg) scaleY(${stretch})`;
  }, []);

  const stepPointer = useCallback((dt: number) => {
    const pointer = pointerPhysicsRef.current;
    const spring = 180;
    const damping = 22;
    const accel = (-spring * pointer.angle) - (damping * pointer.velocity);
    pointer.velocity += accel * dt;
    pointer.angle += pointer.velocity * dt;

    if (Math.abs(pointer.angle) < 0.02 && Math.abs(pointer.velocity) < 0.02) {
      pointer.angle = 0;
      pointer.velocity = 0;
    }

    syncPointer();
  }, [syncPointer]);

  const kickPointer = useCallback((velocity: number, boundaryCount: number) => {
    const maxExpectedVel = Math.max(physicsRef.current.peakVelocity, 0.001);
    const speedRatio = Math.max(0, Math.min(1, velocity / maxExpectedVel));
    const impulse = (4.5 + (speedRatio * 4.5) + ((1 - speedRatio) * 2.5)) * Math.min(boundaryCount, 2);
    pointerPhysicsRef.current.velocity -= impulse * 2.35;
    pointerPhysicsRef.current.angle = Math.max(
      -POINTER_MAX_ANGLE_DEG,
      pointerPhysicsRef.current.angle - (impulse * 0.42),
    );
    syncPointer();
  }, [syncPointer]);

  // ── Audio tick ────────────────────────────────────────────────────────────────

  const tick = useCallback((vol: number, pitch?: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime((pitch || 600) + Math.random() * 150, ctx.currentTime);
    gain.gain.setValueAtTime(vol * 0.20, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(); osc.stop(ctx.currentTime + 0.06);
  }, []);

  const finishSpin = useCallback(() => {
    rotRef.current = physicsRef.current.targetRot;
    draw();
    setIsSpinning(false);
    setIsAwaitingWinnerReveal(true);
    lastFrameTimeRef.current = 0;
    if (winnerRevealTimeoutRef.current) clearTimeout(winnerRevealTimeoutRef.current);

    const pw = pendingWinnerRef.current;
    if (!pw) return;

    winnerRevealTimeoutRef.current = setTimeout(() => {
      setWinner(pw.name);
      setWinnerColor(pw.color);
      setIsAwaitingWinnerReveal(false);
      pendingWinnerRef.current = null;
      winnerRevealTimeoutRef.current = null;
    }, WINNER_POPUP_DELAY_MS);
  }, [draw, setIsSpinning]);

  const applyBoundaryEffects = useCallback((fromRot: number, toRot: number, velocity: number, arcSize: number) => {
    if (!Number.isFinite(arcSize) || arcSize <= 0 || toRot <= fromRot) return;

    const prevBoundaryIdx = Math.floor(lastTickRotRef.current / arcSize);
    const newBoundaryIdx = Math.floor(toRot / arcSize);

    if (newBoundaryIdx <= prevBoundaryIdx) return;

    const boundaryCount = newBoundaryIdx - prevBoundaryIdx;
    const maxExpectedVel = Math.max(physicsRef.current.peakVelocity, 0.001);
    const speedRatio = Math.max(0, Math.min(1, velocity / maxExpectedVel));

    if (!settings.isMuted) {
      const pitch = 180 + (speedRatio * 420);
      const vol = settings.volume * (0.82 + (1 - speedRatio) * 0.72);
      tick(vol, pitch);
    }

    lastTickRotRef.current = newBoundaryIdx * arcSize;
    kickPointer(velocity, boundaryCount);
  }, [kickPointer, settings.isMuted, settings.volume, tick]);

  // ── Winner effect ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!winner) return;
    setShowConfetti(true);
    setWinnerHistory(prev => [winner, ...prev]);
    if (settings.isRaffleMode) removeWinner(winner);
  }, [winner]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animation loops ───────────────────────────────────────────────────────────

  const idleLoop = useCallback(() => {
    rotRef.current += IDLE_SPEED;
    draw();
    stepPointer(1 / 60);
    animIdRef.current = requestAnimationFrame(idleLoop);
  }, [draw, stepPointer]);

  // Easing-based spin loop: quintic ease-out gives a natural wheel motion —
  // high initial velocity that decelerates dramatically toward zero, spending
  // most of the spin at speed and only crawling to a stop at the very end.
  const spinLoop = useCallback((time: number) => {
    if (!lastFrameTimeRef.current) lastFrameTimeRef.current = time;
    const dt = Math.max(0.001, (time - lastFrameTimeRef.current) / 1000);
    lastFrameTimeRef.current = time;

    const items = filtered();
    const n = items.length;
    const arcSize = n > 0 ? (2 * Math.PI) / n : 0;
    const { startRot, totalDist, targetRot, startTimeMs, durationMs } = physicsRef.current;
    const lastRot = rotRef.current;
    const elapsedMs = Math.max(0, time - startTimeMs);
    const progress = Math.min(1, elapsedMs / durationMs);
    const durationSec = durationMs / 1000;
    const currentVelocity = spinEasedVelocity(progress, totalDist, durationSec);
    const nextRot = Math.min(targetRot, startRot + spinEasedPosition(progress, totalDist));

    applyBoundaryEffects(lastRot, nextRot, currentVelocity, arcSize);

    rotRef.current = nextRot;
    draw();
    stepPointer(dt);

    if (progress >= 1 || nextRot >= targetRot) {
      finishSpin();
      return;
    }

    animIdRef.current = requestAnimationFrame(spinLoop);
  }, [applyBoundaryEffects, draw, filtered, finishSpin, stepPointer]);

  useEffect(() => {
    if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    if (isSpinning) {
      lastFrameTimeRef.current = performance.now();
      animIdRef.current = requestAnimationFrame(spinLoop);
    } else if (settings.isIdleSpinEnabled && !winner && !isAwaitingWinnerReveal) {
      animIdRef.current = requestAnimationFrame(idleLoop);
    } else {
      draw();
      stepPointer(1 / 60);
    }
    return () => { if (animIdRef.current) cancelAnimationFrame(animIdRef.current); };
  }, [isSpinning, settings.isIdleSpinEnabled, winner, isAwaitingWinnerReveal, spinLoop, idleLoop, draw, stepPointer]);

  // ── Spin handler ──────────────────────────────────────────────────────────────

  const startActualSpin = useCallback(() => {
    const items = filtered();
    if (items.length < 2 || isSpinning) return;
    if (winnerRevealTimeoutRef.current) {
      clearTimeout(winnerRevealTimeoutRef.current);
      winnerRevealTimeoutRef.current = null;
    }
    setIsAwaitingWinnerReveal(false);
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const n = items.length;
    const arcDeg = 360 / n;

    // Pre-determine winner
    const winnerIdx = Math.floor(Math.random() * n);
    const winnerName = items[winnerIdx];
    const winnerCol = getSegmentColor(winnerName, winnerIdx);
    pendingWinnerRef.current = { name: winnerName, color: winnerCol };

    // To make it incredibly dramatic, we want it to almost ALWAYS land near
    // the absolute edges of the segment (near-misses).
    // An x^5 curve pushes >80% of the spread into the outer 10% of the segment.
    let r = Math.random();
    r = r < 0.5 
      ? Math.pow(r * 2, 5) / 2 
      : 1 - Math.pow((1 - r) * 2, 5) / 2;
    
    // Allow landing between 0.5% and 99.5% of the segment width (literally touching the line)
    const randomOffset = arcDeg * (0.005 + r * 0.990);
    const targetLanding = winnerIdx * arcDeg + randomOffset;
    const currentAngleDeg = ((rotRef.current * 180) / Math.PI) % 360;
    const currentLanding = (360 - currentAngleDeg + 270) % 360;
    let delta = (currentLanding - targetLanding + 360) % 360;
    if (delta < arcDeg) delta += 360;

    // Extra rotations setup 
    const extraRotations = Math.round(settings.spinDuration * 1.5) + 2;
    const totalDeltaRad = ((delta + extraRotations * 360) * Math.PI) / 180;

    const targetRot = rotRef.current + totalDeltaRad;

    // ── Easing-based spin setup ──
    const durationSec = settings.spinDuration;

    physicsRef.current = {
      startRot: rotRef.current,
      totalDist: totalDeltaRad,
      targetRot: targetRot,
      startTimeMs: performance.now(),
      durationMs: durationSec * 1000,
      peakVelocity: spinEasedVelocity(0, totalDeltaRad, durationSec),
    };
    pointerPhysicsRef.current.angle = 0;
    pointerPhysicsRef.current.velocity = 0;
    syncPointer();

    lastTickRotRef.current = Math.floor(rotRef.current / ((2 * Math.PI) / n)) * ((2 * Math.PI) / n);
    
    setIsSpinning(true);
    setWinner(null);
    setShowConfetti(false);
  }, [filtered, isSpinning, settings.spinDuration, setIsSpinning, getSegmentColor, syncPointer]);

  const handleSpin = useCallback(() => {
    const items = filtered();
    if (items.length < 2 || isSpinning || countdown !== null) return;

    if (!showCountdown) {
      startActualSpin();
      return;
    }

    // Countdown 3-2-1 then spin
    let count = 3;
    setCountdown(count);
    countdownRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        setCountdown(null);
        startActualSpin();
      } else {
        setCountdown(count);
      }
    }, 800);
  }, [filtered, isSpinning, countdown, showCountdown, startActualSpin]);

  useEffect(() => () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (winnerRevealTimeoutRef.current) clearTimeout(winnerRevealTimeoutRef.current);
  }, []);

  // ── Fullscreen ────────────────────────────────────────────────────────────────

  const toggleFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ── Keyboard ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (["INPUT", "TEXTAREA"].includes((document.activeElement as HTMLElement)?.tagName)) return;
      e.preventDefault();
      handleSpin();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSpin]);

  useEffect(() => {
    if (triggerSpinRef) triggerSpinRef.current = handleSpin;
  }, [triggerSpinRef, handleSpin]);

  // ── Render ────────────────────────────────────────────────────────────────────

  const items = filtered();
  const canSpin = items.length >= 2 && !isSpinning && countdown === null;

  return (
    // wrapperRef is the fullscreen target — includes title, desc, wheel, and winner popup
    <div
      ref={wrapperRef}
      className={cn(
        "relative flex flex-col items-center gap-4 w-full",
        isFullscreen && "bg-background h-full justify-center py-10 px-6"
      )}
    >
      {/* Confetti lives inside wrapper so it shows in fullscreen too */}
      {showConfetti && <ConfettiOverlay onDone={() => setShowConfetti(false)} />}

      {/* Winner popup: absolute inside wrapper (works in both fullscreen and normal) */}
      {winner && (
        <WinnerCard
          winner={winner}
          winnerColor={winnerColor}
          templateContext={templateContext}
          labels={labels}
          isRaffleMode={settings.isRaffleMode}
          isFullscreen={isFullscreen}
          onClose={() => setWinner(null)}
          onRemove={() => { if (winner) removeWinner(winner); setWinner(null); }}
          onSpinAgain={() => setWinner(null)}
        />
      )}

      {/* Title + description (shown in normal mode AND fullscreen) */}
      <div className="text-center w-full max-w-130 mx-auto">
        <h2 className="text-h2 font-display font-black text-primary leading-tight">
          {wheelTitle}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{wheelDesc}</p>
      </div>

      {/* Wheel area */}
      <div className={cn(
        "flex flex-col items-center gap-6 w-full",
        isFullscreen && "flex-1 justify-center"
      )}>
        <div
          ref={containerRef}
          className={cn(
            "relative w-full aspect-square mx-auto",
            isFullscreen ? "max-w-[min(65vh,560px)]" : "max-w-130"
          )}
          style={{ minWidth: 240 }}
        >
          {/* Fullscreen toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 z-30 w-8 h-8 rounded-full bg-background/70 backdrop-blur-sm border border-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-background/90 transition-all shadow-sm"
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </TooltipContent>
          </Tooltip>

          {/* Pointer */}
          <div
            ref={pointerRef}
            className="absolute top-0 left-1/2 z-20"
            style={{
              transform: "translateX(-50%) translateY(-2px)",
              transformOrigin: "50% 0%",
              width: 0, height: 0,
              borderLeft: "16px solid transparent",
              borderRight: "16px solid transparent",
              borderTop: "36px solid hsl(var(--destructive))",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4)) drop-shadow(0 0 10px rgba(239,68,68,0.3))",
              willChange: "transform",
            }}
          />

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-full"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18), inset 0 0 0 6px rgba(255,255,255,0.08)" }}
          />

          {/* Countdown overlay */}
          {countdown !== null && (
            <div
              className="absolute inset-0 flex items-center justify-center z-20 rounded-full"
              style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
            >
              <span
                key={countdown}
                className="font-display font-black text-white leading-none"
                style={{
                  fontSize: "clamp(80px, 22vw, 130px)",
                  textShadow: "0 0 60px rgba(99,102,241,0.9)",
                  animation: "countPop 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
                }}
              >
                {countdown}
              </span>
            </div>
          )}

          {/* Spin button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSpin}
                disabled={!canSpin}
                aria-label={labels.spinButton}
                className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
                  "size-[22%] min-w-15 min-h-15 rounded-full",
                  "font-display font-black text-base md:text-lg",
                  "bg-white text-gray-900 shadow-2xl border-4 border-white/80",
                  "transition-all duration-200 select-none active:scale-95",
                  canSpin
                    ? "hover:scale-110 cursor-pointer ring-4 ring-white/30 ring-offset-2 ring-offset-transparent"
                    : "opacity-60 cursor-not-allowed grayscale",
                  isSpinning && "animate-spin-slow pointer-events-none",
                )}
              >
                {isSpinning
                  ? <Sparkles className="w-5 h-5 md:w-7 md:h-7 mx-auto animate-pulse" />
                  : countdown !== null
                    ? <Sparkles className="w-5 h-5 md:w-7 md:h-7 mx-auto animate-bounce" />
                    : labels.spinButton}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>{labels.spaceToSpin}</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Item count pill */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border text-xs font-bold uppercase tracking-wider">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
          {items.length < 2 && (
            <span className="text-destructive text-xs font-bold">
              — Add at least 2 items to spin
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes countPop {
          from { opacity: 0; transform: scale(0.4) rotate(-12deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
