"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { 
  Calculator, 
  Shuffle, 
  Briefcase, 
  Hash, 
  Lock, 
  Globe, 
  ArrowUpRight, 
  Dices, 
  Crop, 
  Terminal,
  LogOut,
  Chrome,
  FileDown,
  FileSignature,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser, useAuth } from "@/firebase";
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/get-dictionary";
import { useNotification } from "@/hooks/use-notification";

type ToolCardConfig = {
  id: string;
  icon: React.ReactElement<{ className?: string }>;
  badge?: string;
  badgeVariant?: React.ComponentProps<typeof Badge>['variant'];
  isLink?: boolean;
  href?: string;
  requiresAuth?: boolean;
};

interface ToolsListProps {
  dictionary: Dictionary;
  locale: string;
  isDevelopment: boolean;
}

export function ToolsList({ dictionary, locale, isDevelopment }: ToolsListProps) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { notify } = useNotification();
  const pageContent = dictionary.tools;
  const linkPrefix = locale === "en" ? "" : `/${locale}`;

  const publicTools: ToolCardConfig[] = [
    {
      id: 'bios_keys',
      icon: <Terminal className="h-8 w-8" />,
      isLink: true,
      href: `${linkPrefix}/tools/bios-keys-boot-menu`,
      badge: pageContent.open_tool,
      badgeVariant: 'secondary' as const,
    },
    {
      id: 'spin_wheel',
      icon: <Dices className="h-8 w-8" />,
      isLink: true,
      href: `${linkPrefix}/tools/spin-wheel`,
      badge: pageContent.open_tool,
      badgeVariant: 'secondary' as const,
    },
    {
      id: 'image_crop',
      icon: <Crop className="h-8 w-8" />,
      isLink: true,
      href: `${linkPrefix}/tools/image-crop`,
      badge: pageContent.open_tool,
      badgeVariant: 'secondary' as const,
    },
    {
      id: 'random_name',
      icon: <Shuffle className="h-8 w-8" />,
      isLink: true,
      href: `${linkPrefix}/tools/random-name-picker`,
      badge: pageContent.open_tool,
      badgeVariant: 'secondary' as const,
    },
  ];

  const devPreviewTools: ToolCardConfig[] = [
    {
      id: 'number_to_words',
      icon: <Calculator className="h-8 w-8" />,
    },
  ];

  const internalTools: ToolCardConfig[] = [
    {
      id: "employee_history",
      icon: <Briefcase className="h-8 w-8" />,
      isLink: true,
      href: `${linkPrefix}/tools/employee-history`,
      badge: pageContent.open_tool,
      badgeVariant: "secondary" as const,
      requiresAuth: true,
    },
    {
      id: "signatories_index",
      icon: <FileSignature className="h-8 w-8" />,
      isLink: true,
      href: `${linkPrefix}/tools/signatories-index`,
      badge: pageContent.open_tool,
      badgeVariant: "secondary" as const,
      requiresAuth: true,
    },
    {
      id: "compress_pdf",
      icon: <FileDown className="h-8 w-8" />,
      isLink: true,
      href: `${linkPrefix}/tools/compress-pdf`,
      badge: pageContent.open_tool,
      badgeVariant: "secondary" as const,
      requiresAuth: true,
    },
    {
      id: "address_label",
      icon: <ScrollText className="h-8 w-8" />,
      isLink: true,
      href: `${linkPrefix}/tools/address-label-generator`,
      badge: pageContent.open_tool,
      badgeVariant: "secondary" as const,
      requiresAuth: true,
    },
    {
      id: "number_generator",
      icon: <Hash className="h-8 w-8" />,
      isLink: true,
      href: `${linkPrefix}/tools/number-generator`,
      badge: pageContent.open_tool,
      badgeVariant: "secondary" as const,
      requiresAuth: true,
    },
  ];

  const handleLogin = async () => {
    if (!auth) return;
    try {
      await initiateGoogleSignIn(auth);
    } catch (error) {
      notify("Login failed. Please try again.", <Lock className="h-4 w-4" />);
    }
  };

  const renderCard = (
    tool: ToolCardConfig,
    isClickable: boolean = false
  ) => {
    const toolContent = pageContent.tool_list[tool.id as keyof typeof pageContent.tool_list];
    const isComingSoon = !tool.badge;
    const badgeText = tool.badge || pageContent.coming_soon;
    const badgeVariant = tool.badgeVariant || 'outline';

    const content = (
      <Card
        className={cn(
          "flex h-full flex-col bg-card/50 transition-all duration-300 shadow-sm border-primary/5 overflow-hidden",
          isClickable
            ? "group cursor-pointer hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] active:scale-[0.98]"
            : "opacity-75 cursor-not-allowed grayscale"
        )}
      >
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-4">
          <div className="space-y-2">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg tracking-tight text-primary font-display font-bold group-hover:text-accent transition-colors">
                {toolContent.title}
              </CardTitle>
              {tool.requiresAuth && !user && (
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600/60">
                  <Lock className="h-2.5 w-2.5" />
                  <span>Restricted</span>
                </div>
              )}
            </div>
            <Badge variant={badgeVariant} className={cn(isComingSoon && "opacity-60", "text-[10px] font-bold tracking-tight")}>
              {isComingSoon && <Lock className="h-3 w-3 mr-1 inline" />}
              {badgeText}
            </Badge>
          </div>
          {React.cloneElement(tool.icon, {
            className: cn(
              "h-8 w-8 text-primary/40 transition-all duration-500",
              isClickable ? "group-hover:text-accent group-hover:scale-110 group-hover:rotate-6" : "opacity-30"
            )
          })}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">
            {toolContent.description}
          </p>
          {isClickable && (
            <div className="mt-4 flex justify-end">
              <div className="p-2 rounded-full bg-primary/5 group-hover:bg-accent/10 transition-colors">
                <ArrowUpRight className="h-4 w-4 text-primary/40 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );

    if (isClickable && tool.href) {
      return (
        <Link href={tool.href} className="block h-full no-underline">
          {content}
        </Link>
      );
    }

    return content;
  };

  return (
    <div className="space-y-20">
      {/* Public Tools Section */}
      <section>
        <ScrollReveal direction="left">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black font-display text-primary uppercase tracking-tighter">
                  {pageContent.public_section}
                </h2>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
                  Accessible to everyone
                </p>
              </div>
            </div>
            <div className="h-px bg-primary/5 flex-1" />
          </div>
        </ScrollReveal>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {publicTools.map((tool, index) => (
            <ScrollReveal key={tool.id} delay={index * 0.1} direction="up">
              {renderCard(tool, tool.isLink)}
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Internal Tools / Member Area Section */}
      <section className="relative">
        <ScrollReveal direction="right">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-3 shrink-0">
              <div className={cn("p-2 rounded-xl transition-colors duration-500", user ? "bg-emerald-500/10" : "bg-amber-500/10")}>
                <Lock className={cn("h-5 w-5 transition-colors duration-500", user ? "text-emerald-500" : "text-amber-500")} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black font-display text-primary uppercase tracking-tighter">
                  {pageContent.internal_section}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", user ? "bg-emerald-500" : "bg-amber-500")} />
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 italic">
                    {user ? "Member Lounge Active" : "Authorized Team Only"}
                  </p>
                </div>
              </div>
            </div>
            <div className="h-px bg-primary/5 flex-1" />
          </div>
        </ScrollReveal>

        {!user && !isUserLoading ? (
          <ScrollReveal direction="up" delay={0.1}>
            <Card className="border-dashed border-2 border-primary/10 bg-primary/[0.01] overflow-hidden group hover:border-primary/20 transition-all duration-500">
              <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6">
                <div className="p-4 bg-background rounded-full shadow-lg border border-primary/5 group-hover:scale-110 transition-transform duration-500">
                  <Chrome className="h-8 w-8 text-primary/40" />
                </div>
                <div className="max-w-sm space-y-2">
                  <h3 className="text-xl font-bold tracking-tight text-primary">Member Login Required</h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    Please log in to your SnipGeek account to unlock our secure internal utilities and dashboard.
                  </p>
                </div>
                <Button 
                  onClick={handleLogin}
                  className="rounded-full px-8 py-6 h-auto font-black uppercase tracking-widest gap-3 shadow-xl hover:scale-105 transition-all"
                >
                  <Chrome className="h-5 w-5" />
                  Continue with Google
                </Button>
              </CardContent>
            </Card>
          </ScrollReveal>
        ) : isUserLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="h-10 w-10 rounded-full border-4 border-primary/10 border-t-accent animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 animate-pulse">
               Verifying Access...
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch animate-in fade-in slide-in-from-bottom-4 duration-700">
            {internalTools.map((tool, index) => (
              <ScrollReveal key={tool.id} delay={index * 0.1} direction="up">
                {renderCard(tool, tool.isLink)}
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* Dev Preview Tools Section */}
      {isDevelopment && (
        <section>
          <ScrollReveal direction="up">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-3 shrink-0">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <Terminal className="h-5 w-5 text-accent" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black font-display text-primary uppercase tracking-tighter">
                   {pageContent.coming_soon}
                  </h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
                    Active Development
                  </p>
                </div>
              </div>
              <div className="h-px bg-primary/5 flex-1" />
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {devPreviewTools.map((tool, index) => (
              <ScrollReveal key={tool.id} delay={index * 0.1} direction="up">
                {renderCard(tool, false)}
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
