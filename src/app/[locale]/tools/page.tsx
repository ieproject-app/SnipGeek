import { i18n } from '@/i18n-config';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/get-dictionary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Shuffle, Briefcase, Hash } from 'lucide-react';
import React from 'react';

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

  const tools = [
    {
      id: 'number_to_words',
      icon: <Calculator className="h-8 w-8 text-primary" />,
    },
    {
      id: 'random_name',
      icon: <Shuffle className="h-8 w-8 text-primary" />,
    },
    {
      id: 'employee_history',
      icon: <Briefcase className="h-8 w-8 text-primary" />,
    },
    {
      id: 'number_generator',
      icon: <Hash className="h-8 w-8 text-primary" />,
    },
  ];

  return (
    <div className="w-full">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        <header className="mb-12 text-center">
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3">
                {pageContent.title}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">{pageContent.description}</p>
        </header>
        
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map(tool => {
            const toolContent = pageContent.tool_list[tool.id as keyof typeof pageContent.tool_list];
            return (
              <Card key={tool.id} className="flex flex-col bg-card/50 text-muted-foreground">
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-4">
                  <div className="space-y-1.5">
                    <CardTitle className="text-lg tracking-tight">{toolContent.title}</CardTitle>
                    <Badge variant="outline">{pageContent.coming_soon}</Badge>
                  </div>
                  {React.cloneElement(tool.icon, { className: "h-8 w-8 text-muted-foreground" })}
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm">{toolContent.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </section>
      </main>
    </div>
  );
}
