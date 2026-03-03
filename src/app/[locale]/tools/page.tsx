
import { i18n } from '@/i18n-config';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/get-dictionary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Shuffle, 
  Briefcase, 
  Hash, 
  ClipboardPenLine, 
  Lock, 
  Globe, 
  ArrowUpRight 
} from 'lucide-react';
import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as any);
  return {
    title: dictionary.tools.title,
    description: dictionary.tools.description,
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as any);
  const pageContent = dictionary.tools;
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  const publicTools = [
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
      id: 'ai_prompt_generator',
      icon: <ClipboardPenLine className="h-8 w-8" />,
      isLink: true,
      href: `${linkPrefix}/tools/prompt-generator`,
      badge: pageContent.new_badge,
      badgeVariant: 'secondary' as const,
    },
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
    tool: { id: string, icon: React.ReactElement, badge?: string, badgeVariant?: any }, 
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
                  <CardTitle className="text-lg tracking-tight text-primary font-headline font-bold">
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
        <header className="mb-8 text-center space-y-3">
            <h1 className="font-headline text-4xl font-extrabold tracking-tighter text-primary md:text-5xl">
                {pageContent.title}
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
              {pageContent.description}
            </p>
        </header>
        
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-6">
             <div className="flex items-center gap-2 shrink-0">
                <Globe className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">
                    {pageContent.public_section}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Accessible to everyone, no login required</p>
                </div>
             </div>
             <div className="h-px bg-border flex-1" />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {publicTools.map(tool => renderCard(tool, false))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-6">
             <div className="flex items-center gap-2 shrink-0">
                <Lock className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">
                    {pageContent.internal_section}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">For internal team use</p>
                </div>
             </div>
             <div className="h-px bg-border flex-1" />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {internalTools.map(tool => (
              tool.isLink ? (
                <Link href={tool.href!} key={tool.id} className="block h-full">
                  {renderCard(tool, true)}
                </Link>
              ) : (
                renderCard(tool, false)
              )
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
