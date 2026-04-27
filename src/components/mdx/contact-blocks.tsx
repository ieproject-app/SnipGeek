import React from "react";
import type { ComponentType, SVGProps } from "react";
import {
  Mail,
  MessageSquare,
  Handshake,
  Bug,
  FileQuestion,
  ShieldAlert,
  Lightbulb,
  Clock,
  ArrowRight,
  AlertTriangle,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Lucide icon name → component map for contact MDX blocks.
 * Falls back to Mail when an unknown name is supplied.
 */
const iconMap: Record<string, IconComponent> = {
  Mail,
  MessageSquare,
  Handshake,
  Bug,
  FileQuestion,
  ShieldAlert,
  Lightbulb,
  Clock,
  ArrowRight,
  AlertTriangle,
  Send,
};

function resolveIcon(name?: string): IconComponent {
  if (!name) return Mail;
  return iconMap[name] ?? Mail;
}

/* -------------------------------------------------------------------------- */
/* ContactEmailCta                                                            */
/* -------------------------------------------------------------------------- */

type ContactEmailCtaProps = {
  email: string;
  title: string;
  subtitle?: string;
};

export function ContactEmailCta({
  email,
  title,
  subtitle,
}: ContactEmailCtaProps) {
  return (
    <div className="not-prose my-12">
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-linear-to-br from-primary/6 via-background to-accent/6 p-6 sm:p-8 text-center">
        <div className="pointer-events-none absolute -top-20 -left-20 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
        <div
          className="pointer-events-none absolute -bottom-16 h-40 w-40 rounded-full bg-accent/8 blur-3xl"
          style={{ right: "-4rem" }}
        />

        <div className="relative z-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>

          <h2 className="font-display text-2xl font-black tracking-tight text-primary">
            {title}
          </h2>

          {subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}

          <div className="mt-5">
            <a href={`mailto:${email}`}>
              <Button
                size="lg"
                className="gap-2 rounded-xl px-8 font-bold shadow-lg shadow-primary/10"
              >
                <Mail className="h-4 w-4" />
                {email}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ContactCategoryGrid + ContactCategory                                      */
/* -------------------------------------------------------------------------- */

type ContactCategoryGridProps = {
  children?: React.ReactNode;
  className?: string;
};

export function ContactCategoryGrid({
  children,
  className,
}: ContactCategoryGridProps) {
  return (
    <div
      className={cn(
        "not-prose my-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ContactCategoryProps = {
  icon?: string;
  title: string;
  children?: React.ReactNode;
};

export function ContactCategory({
  icon,
  title,
  children,
}: ContactCategoryProps) {
  const Icon = resolveIcon(icon);

  return (
    <div className="h-full rounded-2xl border border-primary/10 bg-card/40 p-5 transition-all duration-300 hover:border-primary/25 hover:shadow-md hover:shadow-primary/5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h3 className="font-display text-sm font-bold tracking-tight text-primary">
        {title}
      </h3>
      <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground [&>span]:my-0 [&>span]:block">
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ResponseList + ResponseItem                                                */
/* -------------------------------------------------------------------------- */

type ResponseListProps = {
  children?: React.ReactNode;
  title?: string;
  className?: string;
};

export function ResponseList({
  children,
  title,
  className,
}: ResponseListProps) {
  return (
    <div
      className={cn(
        "not-prose my-8 rounded-2xl border border-primary/10 bg-card/30 p-6 backdrop-blur-sm sm:p-7",
        className,
      )}
    >
      {title ? (
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display text-base font-bold tracking-tight text-primary">
            {title}
          </h3>
        </div>
      ) : null}

      <div className="space-y-3">{children}</div>
    </div>
  );
}

type ResponseItemProps = {
  icon?: string;
  children?: React.ReactNode;
};

export function ResponseItem({ icon, children }: ResponseItemProps) {
  const Icon = resolveIcon(icon);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-primary/5 bg-background/50 px-4 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="text-sm text-foreground/75 [&>span]:my-0 [&>span]:block">
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ImportantNote                                                              */
/* -------------------------------------------------------------------------- */

type ImportantNoteProps = {
  title: string;
  children?: React.ReactNode;
};

export function ImportantNote({ title, children }: ImportantNoteProps) {
  return (
    <div className="not-prose my-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-foreground/80">{title}</p>
          <div className="mt-1 text-sm text-muted-foreground [&>span]:my-2 [&>span]:block [&>span:first-child]:mt-0 [&>span:last-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
