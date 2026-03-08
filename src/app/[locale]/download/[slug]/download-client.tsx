"use client";

import { useEffect, useMemo, useState } from "react";
import type { DownloadInfo } from "@/lib/data-downloads";
import { Button } from "@/components/ui/button";
import {
  Download,
  Cloud,
  Github,
  Type,
  Cpu,
  Settings,
  FileText,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { WindowsStoreLogo } from "@/components/icons/windows-store-logo";
import type { Dictionary } from "@/lib/get-dictionary";

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
    softBg: string;
    softBorder: string;
  }
> = {
  windows: {
    accent: "text-blue-500",
    softBg: "from-blue-500/10 to-cyan-500/10",
    softBorder: "border-blue-500/20",
  },
  gdrive: {
    accent: "text-emerald-500",
    softBg: "from-emerald-500/10 to-lime-500/10",
    softBorder: "border-emerald-500/20",
  },
  github: {
    accent: "text-slate-500 dark:text-slate-300",
    softBg: "from-slate-500/10 to-zinc-500/10",
    softBorder: "border-slate-500/20",
  },
  font: {
    accent: "text-purple-500",
    softBg: "from-purple-500/10 to-fuchsia-500/10",
    softBorder: "border-purple-500/20",
  },
  software: {
    accent: "text-indigo-500",
    softBg: "from-indigo-500/10 to-violet-500/10",
    softBorder: "border-indigo-500/20",
  },
  driver: {
    accent: "text-orange-500",
    softBg: "from-orange-500/10 to-amber-500/10",
    softBorder: "border-orange-500/20",
  },
  doc: {
    accent: "text-sky-500",
    softBg: "from-sky-500/10 to-blue-500/10",
    softBorder: "border-sky-500/20",
  },
  default: {
    accent: "text-primary",
    softBg: "from-primary/10 to-accent/10",
    softBorder: "border-primary/20",
  },
};

export function DownloadClient({
  downloadInfo,
  dictionary,
}: DownloadClientProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const platformKey = getPlatformKey(downloadInfo.platform);
  const theme = PLATFORM_THEME[platformKey];

  const progressPercent = useMemo(() => {
    return ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100;
  }, [countdown]);

  useEffect(() => {
    if (countdown <= 0) {
      window.location.assign(downloadInfo.externalUrl);
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, downloadInfo.externalUrl]);

  const handleDownloadClick = () => {
    window.location.assign(downloadInfo.externalUrl);
  };

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-32">
        <section
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${theme.softBg} p-1 shadow-xl ${theme.softBorder}`}
        >
          <div className="rounded-[calc(theme(borderRadius.xl)-2px)] bg-background/95 p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-center">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${theme.softBorder} ${theme.accent}`}
              >
                {getPlatformIcon(downloadInfo.platform, "h-3.5 w-3.5")}
                {downloadInfo.platform ?? "download"}
              </div>
            </div>

            <header className="mb-8 text-center">
              <div
                className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border bg-background ${theme.softBorder}`}
              >
                {getPlatformIcon(
                  downloadInfo.platform,
                  `h-10 w-10 ${theme.accent}`,
                )}
              </div>

              <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {dictionary.title}
              </h1>

              <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                {downloadInfo.fileName}
              </p>

              {downloadInfo.fileSize && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-semibold">
                    {dictionary.fileSizeLabel}
                  </span>{" "}
                  {downloadInfo.fileSize}
                </p>
              )}
            </header>

            <div className="mx-auto mb-5 w-full max-w-xl">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">
                  {dictionary.redirecting.replace(
                    "{countdown}",
                    countdown.toString(),
                  )}
                </span>
                <span className={`font-black ${theme.accent}`}>
                  {countdown}s
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
                    platformKey === "windows"
                      ? "from-blue-500 to-cyan-500"
                      : platformKey === "gdrive"
                        ? "from-emerald-500 to-lime-500"
                        : platformKey === "github"
                          ? "from-slate-500 to-zinc-500"
                          : platformKey === "font"
                            ? "from-purple-500 to-fuchsia-500"
                            : platformKey === "software"
                              ? "from-indigo-500 to-violet-500"
                              : platformKey === "driver"
                                ? "from-orange-500 to-amber-500"
                                : platformKey === "doc"
                                  ? "from-sky-500 to-blue-500"
                                  : "from-primary to-accent"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3">
              <Button
                onClick={handleDownloadClick}
                size="lg"
                className="group h-12 w-full text-sm font-bold uppercase tracking-wide"
              >
                <Download className="mr-2 h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                {dictionary.continueButton}
                <ExternalLink className="ml-2 h-4 w-4 opacity-80" />
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {dictionary.redirecting.replace(
                  "{countdown}",
                  countdown.toString(),
                )}
              </p>
            </div>

            <div
              className={`mx-auto mt-6 w-full max-w-xl rounded-xl border p-3 ${theme.softBorder}`}
            >
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck
                  className={`mt-0.5 h-4 w-4 shrink-0 ${theme.accent}`}
                />
                <span>
                  {dictionary.redirecting.replace(
                    "{countdown}",
                    countdown.toString(),
                  )}
                </span>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
