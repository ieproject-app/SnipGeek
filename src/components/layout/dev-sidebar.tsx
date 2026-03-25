"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  Wand2,
  Hash,
  Users,
  Image as ImageIcon,
  Shuffle,
  ChevronRight,
  Monitor,
  FileArchive,
  ScanSearch,
  FileInput,
} from "lucide-react";
import { usePathname, useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SnipTooltip } from "@/components/ui/snip-tooltip";

interface DevTool {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isPublic?: boolean;
  badge?: string;
}

const devTools: DevTool[] = [
  {
    id: "prompt-generator",
    name: "Prompt Studio",
    description: "AI article and note prompt generator",
    href: "/tools/prompt-generator",
    icon: Wand2,
    badge: "AI",
  },
  {
    id: "random-name-picker",
    name: "Random Name Picker",
    description: "Randomly select names from a list",
    href: "/tools/random-name-picker",
    icon: Shuffle,
  },
  {
    id: "number-generator",
    name: "Number Generator",
    description: "Generate unique sequential numbers",
    href: "/tools/number-generator",
    icon: Hash,
    isPublic: false,
  },
  {
    id: "employee-history",
    name: "Employee History",
    description: "Track employee work history",
    href: "/tools/employee-history",
    icon: Users,
    isPublic: false,
  },
  {
    id: "image-crop",
    name: "Image Crop",
    description: "Crop images to 16:9 ratio",
    href: "/tools/image-crop",
    icon: ImageIcon,
  },
  {
    id: "bios-keys",
    name: "BIOS & Boot Keys",
    description: "Find BIOS & Boot Menu keys",
    href: "/tools/bios-keys-boot-menu",
    icon: Monitor,
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    description: "Perkecil ukuran file PDF",
    href: "/tools/compress-pdf",
    icon: FileArchive,
    badge: "PDF",
    isPublic: false,
  },
  {
    id: "signatories-index",
    name: "Signatories Index",
    description: "Cari letak ttd pihak via OCR",
    href: "/tools/signatories-index",
    icon: ScanSearch,
    badge: "PDF",
    isPublic: false,
  },
  {
    id: "address-label-generator",
    name: "Address Label",
    description: "Buat label pengiriman PDF",
    href: "/tools/address-label-generator",
    icon: FileInput,
    badge: "Doc",
    isPublic: false,
  },
];

export function DevSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params.locale as string) || "en";

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const getLocalizedHref = (href: string) => {
    return `/${currentLocale}${href}`;
  };

  const isActiveTool = (href: string) => {
    const localizedHref = getLocalizedHref(href);
    return pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="fixed bottom-6 right-6 z-40 md:bottom-6 md:right-20">
          <SnipTooltip label="Dev Tools" side="left">
            <Button
              variant="default"
              size="icon"
              className={cn(
                "relative inline-flex h-10 w-10 rounded-full border border-border bg-background text-foreground shadow-2xl transition-all duration-300",
                "hover:-translate-y-0.5 hover:scale-105 active:scale-95",
                isOpen && "rotate-45"
              )}
            >
              <Terminal className="h-4 w-4" />
            </Button>
          </SnipTooltip>
        </div>
      </SheetTrigger>

      <SheetContent side="right" className="w-[360px] border-l border-border/80 p-0 sm:w-[380px]">
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <div className="pr-8">
            <SheetTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
              <Terminal className="h-4 w-4" />
              Development Tools
            </SheetTitle>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Quick access to internal tools and utilities
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-96px)] px-6">
          <div className="space-y-5 py-5 pb-8">
            {/* Public Tools */}
            <div>
              <h4 className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground/80">
                Public Tools
              </h4>
              <div className="space-y-2">
                {devTools
                  .filter((tool) => tool.isPublic !== false)
                  .map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      isActive={isActiveTool(tool.href)}
                      localizedHref={getLocalizedHref(tool.href)}
                      onClick={(href) => {
                        setIsOpen(false);
                        router.push(href);
                      }}
                    />
                  ))}
              </div>
            </div>

            <Separator />

            {/* Internal Tools */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <h4 className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground/80">
                  Internal Tools
                </h4>
                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wide">
                  Auth Required
                </Badge>
              </div>
              <div className="space-y-2">
                {devTools
                  .filter((tool) => tool.isPublic === false)
                  .map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      isActive={isActiveTool(tool.href)}
                      localizedHref={getLocalizedHref(tool.href)}
                      onClick={(href) => {
                        setIsOpen(false);
                        router.push(href);
                      }}
                    />
                  ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface ToolCardProps {
  tool: DevTool;
  isActive: boolean;
  localizedHref: string;
  onClick: (href: string) => void;
}

function ToolCard({ tool, isActive, localizedHref, onClick }: ToolCardProps) {
  const Icon = tool.icon;

  return (
    <button
      type="button"
      onClick={() => {
        onClick(localizedHref);
      }}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent/10 hover:shadow-sm",
        isActive && "border-accent/40 bg-accent/10 shadow-sm"
      )}
    >
      <div
        className={cn(
          "rounded-xl p-2.5 transition-all duration-200",
          isActive ? "bg-accent/20 text-accent shadow-sm" : "bg-muted/70 text-muted-foreground",
          "group-hover:bg-accent/20 group-hover:text-accent group-hover:shadow-sm"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold tracking-tight">{tool.name}</p>
          {tool.badge && (
            <Badge
              variant={tool.badge === "AI" ? "default" : "secondary"}
              className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            >
              {tool.badge}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
    </button>
  );
}
