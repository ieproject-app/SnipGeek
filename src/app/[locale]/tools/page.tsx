
import { i18n } from '@/i18n-config';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/get-dictionary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Shuffle, Briefcase, Hash, ClipboardPenLine } from 'lucide-react';
import React from 'react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
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
  const dictionary = await getDictionary(locale);
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

  const renderCard = (tool: { id: string, icon: React.ReactElement, badge?: string, badgeVariant?: any }) => {
      const toolContent = pageContent.tool_list[tool.id as keyof typeof pageContent.tool_list];
      const badgeText = tool.badge || pageContent.coming_soon;
      const badgeVariant = tool.badgeVariant || 'outline';

      return (
        <Card key={tool.id} className="flex h-full flex-col bg-card/50 transition-colors hover:border-primary shadow-sm">
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-4">
                <div className="space-y-1.5">
                <CardTitle className="text-lg tracking-tight text-primary font-headline font-bold">{toolContent.title}</CardTitle>
                <Badge variant={badgeVariant}>{badgeText}</Badge>
                </div>
                {React.cloneElement(tool.icon, { className: "h-8 w-8 text-muted-foreground opacity-20" })}
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground leading-relaxed">{toolContent.description}</p>
            </CardContent>
        </Card>
      );
  }

  return (
    <div className="w-full">
      <main className="mx-auto max-w-5xl px-4 pt-10 pb-16 lg:px-8">
        <header className="mb-12 text-center">
            <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-primary md:text-6xl mb-3">
                {pageContent.title}
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground italic text-lg">{pageContent.description}</p>
        </header>
        
        {/* Public Tools Section */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
             <h2 className="text-2xl font-bold font-headline text-primary shrink-0 uppercase tracking-tight">{pageContent.public_section}</h2>
             <div className="h-px bg-border flex-1" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {publicTools.map(tool => renderCard(tool))}
          </div>
        </section>

        {/* Internal Tools Section */}
        <section>
          <div className="flex items-center gap-4 mb-8">
             <h2 className="text-2xl font-bold font-headline text-primary shrink-0 uppercase tracking-tight">{pageContent.internal_section}</h2>
             <div className="h-px bg-border flex-1" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {internalTools.map(tool => (
              tool.isLink ? (
                <Link href={tool.href!} key={tool.id} className="block h-full">
                  {renderCard(tool)}
                </Link>
              ) : (
                renderCard(tool)
              )
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
