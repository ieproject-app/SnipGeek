import { i18n } from '@/i18n-config';
import type { Metadata } from 'next';
import { getPageContent } from '@/lib/pages';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/components/mdx-components';
import remarkGfm from 'remark-gfm';
import rehypeShiki from '@shikijs/rehype';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cvData } from '@/lib/cv-data';
import { getDictionary } from '@/lib/get-dictionary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, GraduationCap, Award, Mail, ChevronRight, FileText } from 'lucide-react';
import { DownloadButton } from '@/components/mdx-components';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as any);
  const currentPrefix = locale === i18n.defaultLocale ? '' : `/${locale}`;
  const canonicalPath = `${currentPrefix}/about`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? '' : `/${loc}`;
    languages[loc] = `${prefix}/about`;
  });

  return {
    title: dictionary.about.title,
    description: dictionary.about.description,
    alternates: {
        canonical: canonicalPath,
        languages: {
            ...languages,
            'x-default': languages[i18n.defaultLocale] || canonicalPath
        }
    },
    openGraph: {
        siteName: 'SnipGeek'
    }
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { content } = await getPageContent('about', locale);
  const dictionary = await getDictionary(locale as any);
  const data = cvData[locale] || cvData.en;
  
  const authorAvatar = "/images/profile/profile.png";
  
  return (
    <div className="w-full">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16">
        
        {/* Hero Section */}
        <section className="mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Avatar className="w-32 h-32 mx-auto mb-6 shadow-xl ring-4 ring-primary/10">
                <AvatarImage src={authorAvatar} alt={data.name} />
                <AvatarFallback>IE</AvatarFallback>
            </Avatar>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-3 uppercase">
                {data.name}
            </h1>
            <p className="text-xl md:text-2xl font-headline font-bold text-muted-foreground mb-6">
                {data.role}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="outline" className="px-4 py-2 text-sm bg-card/50">
                    <Mail className="w-4 h-4 mr-2" />
                    {data.email}
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm bg-card/50">
                    <Briefcase className="w-4 h-4 mr-2" />
                    PT Telkom Akses
                </Badge>
            </div>
        </section>

        {/* Summary Section */}
        <section className="mb-20">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold font-headline text-primary shrink-0 uppercase tracking-tight">{dictionary.about.summary}</h2>
                <div className="h-px bg-border flex-1" />
            </div>
            <p className="text-lg leading-relaxed text-foreground/80 italic text-center max-w-3xl mx-auto">
                "{data.summary}"
            </p>
        </section>

        {/* Personal Story Section (from MDX) */}
        <section className="mb-20 prose prose-lg dark:prose-invert max-w-none">
             <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold font-headline text-primary shrink-0 uppercase tracking-tight">{dictionary.about.title}</h2>
                <div className="h-px bg-border flex-1" />
            </div>
            <div className="text-foreground/80">
                <MDXRemote
                    source={content}
                    components={mdxComponents}
                    options={{
                        mdxOptions: {
                            remarkPlugins: [remarkGfm],
                            rehypePlugins: [[rehypeShiki, { theme: 'github-dark' }]],
                        },
                    }}
                />
            </div>
        </section>

        {/* Experience Section */}
        <section className="mb-20">
            <div className="flex items-center gap-4 mb-10">
                <h2 className="text-2xl font-bold font-headline text-primary shrink-0 uppercase tracking-tight">{dictionary.about.experience}</h2>
                <div className="h-px bg-border flex-1" />
            </div>
            
            <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {data.experiences.map((exp, index) => (
                    <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        {/* Dot */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        {/* Content */}
                        <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-primary/10">
                            <CardHeader className="p-6">
                                <time className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">{exp.period}</time>
                                <CardTitle className="text-xl font-headline font-bold text-primary">{exp.title}</CardTitle>
                                <p className="text-sm font-semibold text-accent">{exp.company}</p>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <ul className="space-y-3">
                                    {exp.description.map((item, i) => (
                                        <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                                            <ChevronRight className="w-3 h-3 mt-1 text-primary shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        </section>

        {/* Skills Section */}
        <section className="mb-20">
            <div className="flex items-center gap-4 mb-10">
                <h2 className="text-2xl font-bold font-headline text-primary shrink-0 uppercase tracking-tight">{dictionary.about.skills}</h2>
                <div className="h-px bg-border flex-1" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.skills.map((cat, index) => (
                    <Card key={index} className="bg-card/50 border-primary/10 h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg font-headline text-primary uppercase tracking-wide">{cat.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {cat.skills.map(skill => (
                                <Badge key={skill} variant="secondary" className="px-3 py-1 font-medium">{skill}</Badge>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>

        {/* Education & Certs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold font-headline text-primary shrink-0 uppercase tracking-tight">{dictionary.about.education}</h2>
                    <div className="h-px bg-border flex-1" />
                </div>
                {data.education.map((edu, index) => (
                    <Card key={index} className="bg-card/50 border-primary/10">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <GraduationCap className="w-5 h-5 text-primary" />
                                <time className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{edu.year}</time>
                            </div>
                            <CardTitle className="text-lg font-headline uppercase">{edu.school}</CardTitle>
                            <p className="text-sm text-muted-foreground">{edu.degree}</p>
                        </CardHeader>
                    </Card>
                ))}
            </section>
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold font-headline text-primary shrink-0 uppercase tracking-tight">{dictionary.about.certifications}</h2>
                    <div className="h-px bg-border flex-1" />
                </div>
                {data.certifications.map((cert, index) => (
                    <Card key={index} className="bg-card/50 border-primary/10">
                        <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <Award className="w-5 h-5 text-primary" />
                                <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{cert.period}</Badge>
                            </div>
                            <CardTitle className="text-lg font-headline uppercase">{cert.name}</CardTitle>
                            <p className="text-sm text-muted-foreground font-semibold mb-2">{cert.issuer}</p>
                            <p className="text-xs text-foreground/70 leading-relaxed">{cert.description}</p>
                        </CardHeader>
                    </Card>
                ))}
            </section>
        </div>

        {/* Download Section */}
        <section className="text-center bg-primary/5 border border-primary/10 rounded-2xl p-8 md:p-12">
            <FileText className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold font-headline text-primary mb-4 uppercase tracking-tight">{dictionary.about.downloadResume}</h2>
            <div className="flex justify-center">
                <DownloadButton id="cv-iwan-efendi" />
            </div>
        </section>

      </main>
    </div>
  );
}
