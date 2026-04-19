"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bug,
  X,
  ExternalLink,
  Globe,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToolEntry = {
  id: string;
  name: string;
  path: string;
  indexed: boolean;
  category: "public" | "internal" | "page";
};

const ALL_TOOLS: ToolEntry[] = [
  { id: "tools-listing", name: "Tools (listing)", path: "/tools", indexed: true, category: "page" },
  { id: "bios-keys", name: "BIOS Keys & Boot Menu", path: "/tools/bios-keys-boot-menu", indexed: true, category: "public" },
  { id: "spin-wheel", name: "Spin Wheel", path: "/tools/spin-wheel", indexed: true, category: "public" },
  { id: "random-name", name: "Random Name Picker", path: "/tools/random-name-picker", indexed: true, category: "public" },
  { id: "laptop-estimator", name: "Laptop Service Estimator", path: "/tools/laptop-service-estimator", indexed: true, category: "public" },
  { id: "image-crop", name: "Image Crop", path: "/tools/image-crop", indexed: true, category: "public" },
  { id: "employee-history", name: "Employee History", path: "/tools/employee-history", indexed: false, category: "internal" },
  { id: "number-generator", name: "Number Generator", path: "/tools/number-generator", indexed: false, category: "internal" },
  { id: "prompt-generator", name: "Prompt Generator", path: "/tools/prompt-generator", indexed: false, category: "internal" },
  { id: "signatories-index", name: "Signatories Index", path: "/tools/signatories-index", indexed: false, category: "internal" },
  { id: "compress-pdf", name: "Compress PDF", path: "/tools/compress-pdf", indexed: false, category: "internal" },
  { id: "address-label", name: "Address Label Generator", path: "/tools/address-label-generator", indexed: false, category: "internal" },
];

const CATEGORY_CONFIG = {
  page: { label: "Pages", icon: Globe, color: "text-blue-400" },
  public: { label: "Public Tools", icon: Globe, color: "text-emerald-400" },
  internal: { label: "Internal Tools", icon: Lock, color: "text-amber-400" },
};

function getLocalePrefix(pathname: string): string {
  if (pathname.startsWith("/id")) return "/id";
  return "";
}

export function DevIndexTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const localePrefix = getLocalePrefix(pathname);

  const indexed = ALL_TOOLS.filter((t) => t.indexed);
  const noIndex = ALL_TOOLS.filter((t) => !t.indexed);

  const grouped = (["page", "public", "internal"] as const).map((cat) => ({
    cat,
    tools: ALL_TOOLS.filter((t) => t.category === cat),
  }));

  return (
    <>
      {/* Backdrop — click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9997]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Toggle Dev Index Tracker"
        className={cn(
          "fixed bottom-5 right-5 z-[9999] flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all duration-200",
          "bg-neutral-900 text-neutral-100 ring-1 ring-white/10 hover:ring-white/30 hover:scale-105 active:scale-95",
          isOpen && "rotate-90"
        )}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Bug className="h-4 w-4" />}
      </button>

      {/* Slide-in panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-[9998] h-full w-72 overflow-y-auto",
          "bg-neutral-950 text-neutral-100 border-l border-white/10 shadow-2xl",
          "transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-neutral-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-yellow-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-yellow-400">
              Dev Index Tracker
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1 hover:bg-white/10 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-neutral-400" />
          </button>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-3 border-b border-white/5 bg-neutral-900/50 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <Eye className="h-3 w-3 text-emerald-400" />
            <span className="font-mono text-[11px] font-bold text-emerald-400">
              {indexed.length} indexed
            </span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <EyeOff className="h-3 w-3 text-rose-400" />
            <span className="font-mono text-[11px] font-bold text-rose-400">
              {noIndex.length} noindex
            </span>
          </div>
        </div>

        {/* Tool groups */}
        <div className="flex-1 divide-y divide-white/5 pb-20">
          {grouped.map(({ cat, tools }) => {
            const cfg = CATEGORY_CONFIG[cat];
            const Icon = cfg.icon;
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 bg-neutral-900/30 px-4 py-2">
                  <Icon className={cn("h-3 w-3", cfg.color)} />
                  <span className={cn("font-mono text-[10px] font-bold uppercase tracking-widest", cfg.color)}>
                    {cfg.label}
                  </span>
                </div>
                <ul className="divide-y divide-white/5">
                  {tools.map((tool) => {
                    const href = `${localePrefix}${tool.path}`;
                    return (
                      <li key={tool.id} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-mono text-[11px] font-medium text-neutral-200 leading-snug">
                            {tool.name}
                          </p>
                          <p className="truncate font-mono text-[9px] text-neutral-500 mt-0.5">
                            {tool.path}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={cn(
                              "font-mono text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                              tool.indexed
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-rose-500/15 text-rose-400"
                            )}
                          >
                            {tool.indexed ? "index" : "noindex"}
                          </span>
                          <Link
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Open ${tool.name}`}
                            className="rounded p-1 hover:bg-white/10 text-neutral-500 hover:text-neutral-200 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="sticky bottom-0 border-t border-white/10 bg-neutral-950 px-4 py-2.5">
          <p className="font-mono text-[9px] text-neutral-600 text-center">
            Visible in <span className="text-yellow-500">development</span> only
          </p>
        </div>
      </aside>
    </>
  );
}
