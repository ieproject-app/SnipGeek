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
  ChevronRight,
  ExternalLink,
  Lock,
  ArrowRight,
} from "lucide-react";
import { WindowsStoreLogo } from "@/components/icons/windows-store-logo";
import type { Dictionary } from "@/lib/get-dictionary";
import { cn } from "@/lib/utils";

const COUNTDOWN_SECONDS = 5;

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

// ── Components ──

function AdPlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn(
      "relative flex items-center justify-center rounded-2xl border border-dashed border-primary/10 bg-muted/5 group transition-colors hover:bg-muted/10",
      className
    )}>
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors">
        {label}
      </span>
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[size:24px_24px]" />
      </div>
    </div>
  );
}

// ── Motion Variants ──
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 12 },
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
    if (countdown <= 0) {
      window.open(downloadInfo.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, downloadInfo.externalUrl]);

  const handleDownloadClick = () => {
    window.open(downloadInfo.externalUrl, "_blank", "noopener,noreferrer");
  };

  if (!mounted) return null;

  return (
    <div className="w-full min-h-screen relative flex flex-col items-center py-12 px-4 selection:bg-primary/20 overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className={cn("absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20", theme.bg)} />
        <div className={cn("absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20", theme.bg)} />
      </div>

      <main className="w-full max-w-7xl flex flex-col items-center gap-12">
        {/* Slot A: Top Horizontal Banner (Placeholder) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl h-[120px]"
        >
          <AdPlaceholder label="Sponsored Content (Top Banner)" className="h-full" />
        </motion.div>

        {/* Dynamic Balanced Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-8 items-start">

          {/* Left Spacer / Sidebar Slot (Optional) */}
          <div className="hidden lg:block">
            <AdPlaceholder label="Sidebar (Left Banner)" className="h-[600px] hidden xl:flex" />
          </div>

          {/* Main Download Area - CENTERED */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full flex flex-col items-center"
          >
            <section className={cn(
              "relative overflow-hidden rounded-[3rem] border bg-background/40 backdrop-blur-3xl saturate-150 p-[1px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] w-full max-w-3xl",
              theme.border,
              theme.shadow
            )}>
              <div className="rounded-[2.95rem] bg-gradient-to-b from-card/80 to-background/90 p-8 sm:p-14">

                {/* Header Section */}
                <div className="flex flex-col items-center text-center">
                  <motion.div variants={itemVariants} className="mb-8">
                    <div className={cn(
                      "inline-flex items-center gap-2 rounded-2xl border px-5 py-2 text-[10px] font-black uppercase tracking-[0.25em] shadow-sm",
                      theme.bg,
                      theme.border,
                      theme.accent
                    )}>
                      {getPlatformIcon(downloadInfo.platform, "h-4 w-4")}
                      {downloadInfo.platform ?? "Gateway"}
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="relative mb-10 group">
                    <div className={cn(
                      "absolute -inset-4 rounded-full blur-2xl opacity-40 transition-all duration-700 group-hover:scale-125",
                      theme.bg
                    )} />
                    <div className={cn(
                      "relative flex h-28 w-28 items-center justify-center rounded-[2.5rem] border bg-background shadow-2xl transition-transform duration-500 group-hover:rotate-6",
                      theme.border
                    )}>
                      {getPlatformIcon(
                        downloadInfo.platform,
                        cn("h-14 w-14", theme.accent)
                      )}
                    </div>
                  </motion.div>

                  <motion.h1 variants={itemVariants} className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                    {dictionary.title}
                  </motion.h1>

                  <motion.div variants={itemVariants} className="mt-8 space-y-3">
                    <h2 className="text-xl font-bold text-foreground/80 tracking-tight leading-none">
                      {downloadInfo.fileName}
                    </h2>
                    {downloadInfo.fileSize && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-muted/50 px-4 py-1.5 text-xs font-black text-muted-foreground border border-border/60">
                        <FileText className="h-3 w-3" />
                        {downloadInfo.fileSize}
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* Progress Hub */}
                <motion.div variants={itemVariants} className="mt-14 max-w-xl mx-auto">
                  <div className="bg-card/40 border border-primary/5 p-8 rounded-[2rem] shadow-sm backdrop-blur-md">
                    <div className="mb-6 flex items-end justify-between">
                      <div className="space-y-1">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                          Transfer Protocol
                        </span>
                        <span className="text-sm font-bold flex items-center gap-2">
                          {progressPercent === 100 ? (
                            <span className="text-emerald-500 flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                              <ShieldCheck className="h-4 w-4" /> Ready to go!
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                              Verifying Secure Connection...
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="relative h-12 w-12 group">
                        <svg className="h-12 w-12 transform -rotate-90">
                          <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted-foreground/5" />
                          <motion.circle
                            cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" fill="transparent"
                            strokeDasharray="138.23"
                            animate={{ strokeDashoffset: 138.23 * (1 - progressPercent / 100) }}
                            className={cn(theme.accent, "transition-all duration-300")}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-display text-lg font-black">{countdown}</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted/30 p-[2px]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className={cn(
                          "h-full rounded-full bg-gradient-to-r shadow-[0_0_20px_rgba(0,0,0,0.1)]",
                          theme.gradient
                        )}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Action Footer */}
                <div className="mt-14 flex flex-col items-center gap-10">
                  <motion.div variants={itemVariants} className="relative group/btn">
                    <div className={cn(
                      "absolute -inset-6 rounded-[2.5rem] opacity-30 blur-2xl transition-all duration-500 group-hover/btn:opacity-60",
                      theme.bg
                    )} />
                    <Button
                      onClick={handleDownloadClick}
                      size="lg"
                      className={cn(
                        "relative h-16 sm:h-20 rounded-3xl px-10 sm:px-14 text-sm sm:text-base font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.03] active:scale-[0.97] shadow-2xl",
                        "bg-foreground text-background hover:bg-foreground/90"
                      )}
                    >
                      <Download className="mr-3 h-6 w-6" />
                      {dictionary.continueButton}
                      <ArrowRight className="ml-3 h-6 w-6 opacity-40 transition-transform group-hover/btn:translate-x-2" />
                    </Button>
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-primary/5 bg-muted/10 px-6 py-4 transition-all hover:bg-muted/15">
                      <ShieldCheck className={cn("h-5 w-5", theme.accent)} />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Verified Secure</span>
                        <span className="text-[11px] font-medium text-muted-foreground leading-snug">
                          No malware detected. Powered by SnipGeek.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>

              </div>
            </section>
          </motion.div>

          {/* Right Sidebar Ad Space (Placeholder) */}
          <aside className="w-full shrink-0 space-y-6 hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="sticky top-12 space-y-6"
            >
              <AdPlaceholder label="Advertisement (Box 1)" className="aspect-square" />
              <AdPlaceholder label="Advertisement (Box 2)" className="h-[400px]" />

              <div className="p-6 rounded-3xl border border-primary/5 bg-card/40 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="h-4 w-4 text-muted-foreground/60" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Help Center</span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                  Stuck? Read our <span className="text-primary hover:underline cursor-pointer inline">Installation Guide</span> or visit the community forum for troubleshooting.
                </p>
                <Button variant="ghost" className="w-full mt-4 h-9 text-[10px] font-black uppercase tracking-widest border border-primary/5 rounded-xl hover:bg-primary/5 transition-colors">
                  Contact Support
                </Button>
              </div>
            </motion.div>
          </aside>

        </div>

        {/* Slot C: Bottom Horizontal Ad or Relevant Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-5xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdPlaceholder label="Recommended for You (Link 1)" className="h-[100px]" />
            <AdPlaceholder label="Recommended for You (Link 2)" className="h-[100px]" />
          </div>
        </motion.div>

      </main>

      {/* Trust Footer */}
      <footer className="mt-24 pb-12 text-center">
        <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:opacity-100 transition-all duration-700">
          <Cloud className="h-6 w-6" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">SnipGeek Network Systems</p>
          <ShieldCheck className="h-6 w-6" />
        </div>
      </footer>
    </div>
  );
}

