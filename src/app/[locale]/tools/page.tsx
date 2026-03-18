
import { i18n, type Locale } from '@/i18n-config';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/get-dictionary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  Shuffle,
  Briefcase,
  Hash,
  Lock,
  Globe,
  ArrowUpRight,
  Dices,
  Crop
} from 'lucide-react';
import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

type ToolCardConfig = {
  id: string;
  icon: React.ReactElement<{ className?: string }>;
  badge?: string;
  badgeVariant?: React.ComponentProps<typeof Badge>['variant'];
  isLink?: boolean;
  href?: string;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  const canonicalPath =
    locale === i18n.defaultLocale ? "/tools" : `/${locale}/tools`;
  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/tools`;
  });

  return {
    title: dictionary.tools.title,
    description: dictionary.tools.description,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
      },
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  const pageContent = dictionary.tools;
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;
  const isDevelopment = process.env.NODE_ENV === 'development';

  const publicTools = [
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
  ];

  const devPreviewTools = [
    {
      id: 'number_to_words',
      icon: <Calculator className="h-8 w-8" />,
    },
    {
      id: 'random_name',
      icon: <Shuffle className="h-8 w-8" />,
    },
  ];

  const internalTools = [
    {
      id: 'employee_history',
      icon: <Briefcase className="h-8 w-8" />,
      isLink: true,
      href: `${linkPrefix}/tools/employee-history`,
      badge: pageContent.open_tool,
      badgeVariant: 'secondary' as const,
    },
    {
      id: 'number_generator',
      icon: <Hash className="h-8 w-8" />,
      isLink: true,
      href: `${linkPrefix}/tools/number-generator`,
      badge: pageContent.open_tool,
      badgeVariant: 'secondary' as const,
    },
  ];

  const renderCard = (
    tool: ToolCardConfig,
    isClickable: boolean = false
  ) => {
    const toolContent = pageContent.tool_list[tool.id as keyof typeof pageContent.tool_list];
    const isComingSoon = !tool.badge;
    const badgeText = tool.badge || pageContent.coming_soon;
    const badgeVariant = tool.badgeVariant || 'outline';

    return (
      <Card
        key={tool.id}
        className={cn(
          "flex h-full flex-col bg-card/50 transition-all duration-200 shadow-sm border-primary/5 overflow-hidden",
          isClickable
            ? "group cursor-pointer hover:border-primary hover:shadow-md hover:scale-[1.02]"
            : "opacity-75 cursor-not-allowed"
        )}
      >
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-4">
          <div className="space-y-1.5">
            <CardTitle className="text-lg tracking-tight text-primary font-display font-bold">
              {toolContent.title}
            </CardTitle>
            <Badge variant={badgeVariant} className={cn(isComingSoon && "opacity-60")}>
              {isComingSoon && <Lock className="h-3 w-3 mr-1 inline" />}
              {badgeText}
            </Badge>
          </div>
          {React.cloneElement(tool.icon, {
            className: cn(
              "h-8 w-8 text-muted-foreground transition-opacity",
              isClickable ? "opacity-50 group-hover:opacity-100" : "opacity-40"
            )
          })}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {toolContent.description}
          </p>
          {isClickable && (
            <div className="mt-4 flex justify-end">
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <main className="mx-auto max-w-5xl px-4 pt-10 pb-16 lg:px-8">
        <ScrollReveal direction="down">
          <header className="mb-8 text-center space-y-3">
            <h1 className="font-display text-4xl font-extrabold tracking-tighter text-primary md:text-5xl">
              {pageContent.title}
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
              {pageContent.description}
            </p>
          </header>
        </ScrollReveal>

        <section className="mb-16">
          <ScrollReveal direction="left">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 shrink-0">
                <Globe className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold font-display text-primary uppercase tracking-tight">
                    {pageContent.public_section}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Accessible to everyone, no login required</p>
                </div>
              </div>
              <div className="h-px bg-border flex-1" />
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {publicTools.map((tool, index) => (
              <ScrollReveal key={tool.id} delay={index * 0.1} direction="up">
                {tool.isLink ? (
                  <Link href={tool.href!} className="block h-full">
                    {renderCard(tool, true)}
                  </Link>
                ) : (
                  renderCard(tool, false)
                )}
              </ScrollReveal>
            ))}
          </div>
        </section>

        {isDevelopment && (
          <section className="mb-16">
            <ScrollReveal direction="up">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 shrink-0">
                  <Lock className="h-5 w-5 text-primary" />
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold font-display text-primary uppercase tracking-tight">
                      {pageContent.coming_soon}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Visible in development only</p>
                  </div>
                </div>
                <div className="h-px bg-border flex-1" />
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {devPreviewTools.map((tool, index) => (
                <ScrollReveal key={tool.id} delay={index * 0.1} direction="up">
                  {renderCard(tool, false)}
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}

        {isDevelopment && (
          <section>
            <ScrollReveal direction="right">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 shrink-0">
                  <Lock className="h-5 w-5 text-primary" />
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold font-display text-primary uppercase tracking-tight">
                      {pageContent.internal_section}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Visible in development only</p>
                  </div>
                </div>
                <div className="h-px bg-border flex-1" />
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {internalTools.map((tool, index) => (
                <ScrollReveal key={tool.id} delay={index * 0.1} direction="up">
                  {tool.isLink ? (
                    <Link href={tool.href!} className="block h-full">
                      {renderCard(tool, true)}
                    </Link>
                  ) : (
                    renderCard(tool, false)
                  )}
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
