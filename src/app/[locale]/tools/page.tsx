import { i18n } from '@/i18n-config';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/get-dictionary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Shuffle, Briefcase, Hash, ClipboardPenLine } from 'lucide-react';
import React from 'react';
import Link from 'next/link';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const dictionary = await getDictionary(locale);
  return {
    title: dictionary.tools.title,
    description: dictionary.tools.description,
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function ToolsPage({ params: { locale } }: { params: { locale: string } }) {
  const dictionary = await getDictionary(locale);
  const pageContent = dictionary.tools;
  const linkPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;

  const tools = [
    {
      id: 'ai_prompt_generator',
      icon: <ClipboardPenLine className="h-8 w-8" />,
      isLink: true,
      href: `${linkPrefix}/tools/prompt-generator`,
      badge: pageContent.new_badge,
      badgeVariant: 'secondary' as const,
    },
    {
      id: 'number_to_words',
      icon: <Calculator className="h-8 w-8" />,
    },
    {
      id: 'random_name',
      icon: <Shuffle className="h-8 w-8" />,
    },
    {
      id: 'employee_history',
      icon: <Briefcase className="h-8 w-8" />,
    },
    {
      id: 'number_generator',
      icon: <Hash className="h-8 w-8" />,
    },
  ];

  const renderCard = (tool: (typeof tools)[0]) => {
      const toolContent = pageContent.tool_list[tool.id as keyof typeof pageContent.tool_list];
      const badgeText = tool.badge || pageContent.coming_soon;
      const badgeVariant = tool.badgeVariant || 'outline';

      return (
        <Card key={tool.id} className="flex h-full flex-col bg-card/50 transition-colors hover:border-primary">
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-4">
                <div className="space-y-1.5">
                <CardTitle className="text-lg tracking-tight text-primary">{toolContent.title}</CardTitle>
                <Badge variant={badgeVariant}>{badgeText}</Badge>
                </div>
                {React.cloneElement(tool.icon, { className: "h-8 w-8 text-muted-foreground" })}
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">{toolContent.description}</p>
            </CardContent>
        </Card>
      );
  }

  return (
    <div className="w-full">
      <main className="mx-auto max-w-5xl px-4 pt-24 pb-12 sm:px-6 sm:pt-32 sm:pb-16 lg:px-8">
        <header className="mb-12 text-center">
            <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-primary md:text-6xl mb-3">
                {pageContent.title}
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">{pageContent.description}</p>
        </header>
        
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map(tool => (
            tool.isLink ? (
              <Link href={tool.href!} key={tool.id} className="block h-full">{renderCard(tool)}</Link>
            ) : (
              renderCard(tool)
            )
          ))}
        </section>
      </main>
    </div>
  );
}
