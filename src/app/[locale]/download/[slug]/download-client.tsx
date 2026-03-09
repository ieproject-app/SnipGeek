"use client";

import { useEffect, useMemo, useState } from "react";
import type { DownloadInfo } from "@/lib/data-downloads";
import { Button } from "@/components/ui/button";
import { motion, Variants } from "framer-motion";
import {
  Download,
  Cloud,
  Github,
  Type,
  Cpu,
  Settings,
  FileText,
  ShieldCheck,
  Lock,
  ArrowRight,
} from "lucide-react";
import { WindowsStoreLogo } from "@/components/icons/windows-store-logo";
import type { Dictionary } from "@/lib/get-dictionary";
import { cn } from "@/lib/utils";

const COUNTDOWN_SECONDS = 10;

interface DownloadClientProps {
  downloadInfo: DownloadInfo;
  dictionary: Dictionary["downloadGate"];
}

type PlatformKey =
  | "windows"
  | "gdrive"
  | "github"
  | "font"
  | "software"
  | "driver"
  | "doc"
  | "default";

const getPlatformKey = (platform?: DownloadInfo["platform"]): PlatformKey => {
  switch (platform) {
    case "windows":
    case "gdrive":
    case "github":
    case "font":
    case "software":
    case "driver":
    case "doc":
      return platform;
    default:
      return "default";
  }
};

const getPlatformIcon = (
  platform?: DownloadInfo["platform"],
  className?: string,
) => {
  switch (platform) {
    case "windows":
      return <WindowsStoreLogo className={className} />;
    case "gdrive":
      return <Cloud className={className} />;
    case "github":
      return <Github className={className} />;
    case "font":
      return <Type className={className} />;
    case "driver":
      return <Settings className={className} />;
    case "software":
      return <Cpu className={className} />;
    case "doc":
      return <FileText className={className} />;
    default:
      return <Download className={className} />;
  }
};

const PLATFORM_THEME: Record<
  PlatformKey,
  {
    accent: string;
    bg: string;
    border: string;
    gradient: string;
    shadow: string;
  }
> = {
  windows: {
    accent: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    gradient: "from-blue-500 to-cyan-500",
    shadow: "shadow-blue-500/10",
  },
  gdrive: {
    accent: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    gradient: "from-emerald-500 to-lime-500",
    shadow: "shadow-emerald-500/10",
  },
  github: {
    accent: "text-slate-500 dark:text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    gradient: "from-slate-500 to-zinc-500",
    shadow: "shadow-slate-500/10",
  },
  font: {
    accent: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    gradient: "from-purple-500 to-fuchsia-500",
    shadow: "shadow-purple-500/10",
  },
  software: {
    accent: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    gradient: "from-indigo-500 to-violet-500",
    shadow: "shadow-indigo-500/10",
  },
  driver: {
    accent: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    gradient: "from-orange-500 to-amber-500",
    shadow: "shadow-orange-500/10",
  },
  doc: {
    accent: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    gradient: "from-sky-500 to-blue-500",
    shadow: "shadow-sky-500/10",
  },
  default: {
    accent: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    gradient: "from-primary to-accent",
    shadow: "shadow-primary/10",
  },
};

function AdPlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn(
      "relative flex items-center justify-center rounded-2xl border border-dashed border-primary/10 bg-muted/5 group transition-colors hover:bg-muted/10 overflow-hidden",
      className
    )}>
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors z-10 px-4 text-center">
        {label}
      </span>
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[size:24px_24px]" />
      </div>
    </div>
  );
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 15 },
  },
};

export function DownloadClient({
  downloadInfo,
  dictionary,
}: DownloadClientProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [mounted, setMounted] = useState(false);

  const platformKey = getPlatformKey(downloadInfo.platform);
  const theme = PLATFORM_THEME[platformKey];

  const progressPercent = useMemo(() => {
    return ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100;
  }, [countdown]);

  useEffect(() => {
    setMounted(true);
    if (countdown <= 0) return;

    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  const handleDownloadClick = () => {
    window.open(downloadInfo.externalUrl, "_blank", "noopener,noreferrer");
  };

  if (!mounted) return null;

  const isReady = countdown <= 0;

  return (
    <div className="w-full min-h-screen relative flex flex-col items-center py-4 sm:py-8 px-4 selection:bg-primary/20 overflow-x-hidden justify-center bg-background/50">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className={cn("absolute top-[-5%] left-[-5%] w-[30%] h-[30%] rounded-full blur-[100px] opacity-15", theme.bg)} />
        <div className={cn("absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] rounded-full blur-[100px] opacity-15", theme.bg)} />
      </div>

      <main className="w-full max-w-7xl flex flex-col items-center gap-4 sm:gap-6">
        {/* Slot A: Top Horizontal Banner - COMPACT */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl h-[80px]"
        >
          <AdPlaceholder label="AD BANNER (Top)" className="h-full rounded-xl" />
        </motion.div>

        {/* Balanced Dashboard Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[250px_1fr_250px] gap-6 items-center">

          {/* Left Sidebar */}
          <aside className="hidden lg:block self-stretch">
            <AdPlaceholder label="SIDEBAR (Left)" className="h-full min-h-[400px] rounded-2xl" />
          </aside>

          {/* Main Card - ULTRA COMPACT */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full flex flex-col items-center"
          >
            <section className={cn(
              "relative overflow-hidden rounded-[2rem] border bg-background/60 backdrop-blur-2xl saturate-150 p-[1px] shadow-2xl w-full max-w-xl mx-auto",
              theme.border,
              theme.shadow
            )}>
              <div className="rounded-[1.95rem] bg-gradient-to-b from-card/90 to-background p-6 sm:p-8">

                {/* Header Section */}
                <div className="flex flex-col items-center text-center">
                  <motion.div variants={itemVariants} className="mb-4">
                    <div className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm",
                      theme.bg,
                      theme.border,
                      theme.accent
                    )}>
                      {getPlatformIcon(downloadInfo.platform, "h-3 w-3")}
                      {downloadInfo.platform ?? "Gateway"}
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="relative mb-5 group">
                    <div className={cn(
                      "absolute -inset-2 rounded-full blur-lg opacity-30 transition-all duration-700",
                      theme.bg
                    )} />
                    <div className={cn(
                      "relative flex h-16 w-16 items-center justify-center rounded-2xl border bg-background shadow-lg transition-transform group-hover:scale-105",
                      theme.border
                    )}>
                      {getPlatformIcon(downloadInfo.platform, cn("h-8 w-8", theme.accent))}
                    </div>
                  </motion.div>

                  <motion.h1 variants={itemVariants} className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
                    {dictionary.title}
                  </motion.h1>

                  <div className="mt-3 space-y-1.5">
                    <h2 className="text-sm font-bold text-foreground/70 tracking-tight line-clamp-1">
                      {downloadInfo.fileName}
                    </h2>
                    {downloadInfo.fileSize && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/40 px-2.5 py-0.5 text-[10px] font-black text-muted-foreground border border-border/40">
                        <FileText className="h-2.5 w-2.5" />
                        {downloadInfo.fileSize}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar Container */}
                <motion.div variants={itemVariants} className="mt-6">
                  <div className="bg-muted/10 border border-primary/5 p-4 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/60">STATUS</span>
                        <span className="text-[10px] font-bold">
                          {isReady ? "Link Validated" : "Analyzing Connection..."}
                        </span>
                      </div>
                      <div className="relative h-8 w-8">
                        <svg className="h-8 w-8 -rotate-90">
                          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-muted-foreground/5" />
                          <motion.circle
                            cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.5" fill="transparent"
                            strokeDasharray="87.96"
                            animate={{ strokeDashoffset: 87.96 * (1 - progressPercent / 100) }}
                            className={cn(theme.accent, "transition-all duration-300")}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-display text-[10px] font-black">{countdown}</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className={cn("h-full rounded-full transition-all duration-300", theme.gradient)}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Main Action */}
                <div className="mt-6 flex flex-col items-center gap-6">
                  <motion.div variants={itemVariants} className="relative w-full sm:w-auto z-10">
                    {isReady && (
                      <div className={cn(
                        "absolute -inset-4 rounded-2xl opacity-20 blur-xl animate-pulse pointer-events-none",
                        theme.bg
                      )} />
                    )}
                    <Button
                      onClick={handleDownloadClick}
                      disabled={!isReady}
                      className={cn(
                        "w-full sm:w-auto h-12 sm:h-14 rounded-xl px-8 text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl cursor-pointer hover:z-20",
                        isReady
                          ? "bg-foreground text-background hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
                          : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Download className={cn("mr-2 h-4 w-4", isReady && "animate-bounce")} />
                      {isReady ? "Download Now" : dictionary.continueButton}
                      <ArrowRight className="ml-2 h-4 w-4 opacity-40 shrink-0" />
                    </Button>
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-medium">
                    <ShieldCheck className={cn("h-3.5 w-3.5", theme.accent)} />
                    Verified Secure Repository
                  </motion.div>
                </div>

              </div>
            </section>
          </motion.div>

          {/* Right Sidebar */}
          <aside className="hidden lg:flex flex-col gap-4 self-stretch">
            <AdPlaceholder label="AD (Side)" className="flex-1 min-h-[300px] rounded-2xl" />
            <div className="p-4 rounded-2xl border border-primary/5 bg-card/60 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-3 w-3 text-muted-foreground/50" />
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Community Support</span>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground/80 leading-relaxed">
                Need help? <span className="text-primary hover:underline cursor-pointer font-bold">Visit Support & Discussion</span>
              </p>
            </div>
          </aside>

        </div>

        {/* Bottom Ad Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-4xl grid grid-cols-2 gap-4"
        >
          <AdPlaceholder label="RECOMENDED (1)" className="h-[70px] rounded-xl" />
          <AdPlaceholder label="RECOMENDED (2)" className="h-[70px] rounded-xl" />
        </motion.div>

      </main>

      <footer className="mt-8 opacity-20 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.3em]">© SNIPGEEK SECURE DELIVERY</p>
      </footer>
    </div>
  );
}
