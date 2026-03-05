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
import { Briefcase, GraduationCap, Award, Mail, ChevronRight, FileText, MapPin } from 'lucide-react';
import { DownloadButton } from '@/components/mdx-components';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

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
        openGraph: { siteName: 'SnipGeek' }
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
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

                {/* ─── HERO ─── */}
                <ScrollReveal direction="down">
                    <section className="relative mb-16 overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 md:p-12 text-center">
                        {/* Decorative blobs */}
                        <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

                        <div className="relative z-10">
                            <div className="relative inline-block mb-6">
                                <Avatar className="w-28 h-28 mx-auto shadow-2xl ring-4 ring-primary/20 ring-offset-4 ring-offset-background">
                                    <AvatarImage src={authorAvatar} alt={data.name} />
                                    <AvatarFallback className="text-2xl font-bold">IE</AvatarFallback>
                                </Avatar>
                                {/* Online indicator */}
                                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-background" />
                            </div>

                            <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tighter text-primary mb-2 uppercase">
                                {data.name}
                            </h1>
                            <p className="text-lg md:text-xl font-semibold text-muted-foreground mb-6">
                                {data.role}
                            </p>

                            <div className="flex flex-wrap justify-center gap-3">
                                <Badge variant="outline" className="px-4 py-1.5 text-sm bg-background/60 backdrop-blur gap-2">
                                    <Mail className="w-3.5 h-3.5 text-primary" />
                                    {data.email}
                                </Badge>
                                <Badge variant="outline" className="px-4 py-1.5 text-sm bg-background/60 backdrop-blur gap-2">
                                    <Briefcase className="w-3.5 h-3.5 text-primary" />
                                    PT Telkom Akses
                                </Badge>
                                <Badge variant="outline" className="px-4 py-1.5 text-sm bg-background/60 backdrop-blur gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-primary" />
                                    Indonesia
                                </Badge>
                            </div>
                        </div>
                    </section>
                </ScrollReveal>

                {/* ─── SUMMARY ─── */}
                <ScrollReveal direction="up" delay={0.1}>
                    <section className="mb-16">
                        <SectionHeading title={dictionary.about.summary} />
                        <blockquote className="relative mt-8 border-l-4 border-primary/40 pl-6 py-2">
                            <div className="absolute -left-3 top-0 text-6xl leading-none text-primary/20 font-serif select-none">"</div>
                            <p className="text-lg leading-relaxed text-foreground/75 italic">
                                {data.summary}
                            </p>
                        </blockquote>
                    </section>
                </ScrollReveal>

                {/* ─── MDX CONTENT ─── */}
                <ScrollReveal direction="up" delay={0.1}>
                    <section className="mb-16">
                        <SectionHeading title={dictionary.about.title} />
                        <div className="mt-8 prose prose-lg dark:prose-invert max-w-none text-foreground/80">
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
                </ScrollReveal>

                {/* ─── EXPERIENCE (Zigzag Timeline) ─── */}
                <section className="mb-20">
                    <ScrollReveal direction="left">
                        <SectionHeading title={dictionary.about.experience} />
                    </ScrollReveal>

                    <div className="relative mt-12 px-2 sm:px-0">
                        {/* Central Line - visible on mobile and desktop */}
                        <div className="absolute left-[20px] sm:left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

                        <div className="space-y-12">
                            {data.experiences.map((exp, index) => {
                                const isLeft = index % 2 === 0;
                                return (
                                    <div key={index} className="relative group">
                                        <ScrollReveal delay={index * 0.1} direction={isLeft ? "left" : "right"}>
                                            <div className="flex flex-col sm:flex-row items-center">

                                                {/* Left Side (Desktop Only) */}
                                                <div className="hidden sm:flex sm:w-1/2 sm:pr-10 sm:justify-end">
                                                    {isLeft && <ExperienceCard exp={exp} align="right" />}
                                                </div>

                                                {/* Center Icon/Dot */}
                                                <div className="absolute left-[20px] sm:left-1/2 top-[30px] sm:top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center z-10">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping group-hover:bg-primary/20 scale-150" />
                                                        <div className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary/40 bg-background shadow-xl group-hover:border-primary group-hover:scale-110 transition-all duration-300">
                                                            <Briefcase className="w-4 h-4 text-primary" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Side (Mobile & Desktop) */}
                                                <div className="flex-1 sm:w-1/2 sm:pl-10 ml-14 sm:ml-0">
                                                    {!isLeft && <ExperienceCard exp={exp} align="left" />}
                                                    {/* Mobile fallback for Left Cards */}
                                                    <div className="sm:hidden">
                                                        {isLeft && <ExperienceCard exp={exp} align="left" />}
                                                    </div>
                                                </div>

                                            </div>
                                        </ScrollReveal>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ─── SKILLS ─── */}
                <section className="mb-16">
                    <ScrollReveal direction="right">
                        <SectionHeading title={dictionary.about.skills} />
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
                        {data.skills.map((cat, index) => (
                            <ScrollReveal key={index} delay={index * 0.1}>
                                <Card className="
                                    relative overflow-hidden bg-card/50 border-primary/10 rounded-xl h-full
                                    hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
                                    transition-all duration-300
                                ">
                                    {/* Subtle top accent bar */}
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-headline font-bold text-primary uppercase tracking-widest">
                                            {cat.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-wrap gap-2 pt-0">
                                        {cat.skills.map(skill => (
                                            <Badge
                                                key={skill}
                                                variant="secondary"
                                                className="px-2.5 py-1 text-xs font-medium hover:bg-primary/15 transition-colors cursor-default"
                                            >
                                                {skill}
                                            </Badge>
                                        ))}
                                    </CardContent>
                                </Card>
                            </ScrollReveal>
                        ))}
                    </div>
                </section>

                {/* ─── EDUCATION + CERTIFICATIONS ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">

                    {/* Education */}
                    <section>
                        <ScrollReveal direction="left">
                            <SectionHeading title={dictionary.about.education} />
                        </ScrollReveal>
                        <div className="mt-8 space-y-4">
                            {data.education.map((edu, index) => (
                                <ScrollReveal key={index} delay={index * 0.1} direction="left">
                                    <Card className="
                                        bg-card/50 border-primary/10 rounded-xl
                                        hover:border-primary/20 hover:shadow-md transition-all duration-300
                                    ">
                                        <CardHeader className="p-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
                                                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <time className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    {edu.year}
                                                </time>
                                            </div>
                                            <CardTitle className="text-sm font-headline font-bold uppercase leading-snug">
                                                {edu.school}
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground mt-0.5">{edu.degree}</p>
                                        </CardHeader>
                                    </Card>
                                </ScrollReveal>
                            ))}
                        </div>
                    </section>

                    {/* Certifications */}
                    <section>
                        <ScrollReveal direction="right">
                            <SectionHeading title={dictionary.about.certifications} />
                        </ScrollReveal>
                        <div className="mt-8 space-y-4">
                            {data.certifications.map((cert, index) => (
                                <ScrollReveal key={index} delay={index * 0.1} direction="right">
                                    <Card className="
                                        bg-card/50 border-primary/10 rounded-xl
                                        hover:border-primary/20 hover:shadow-md transition-all duration-300
                                    ">
                                        <CardHeader className="p-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
                                                    <Award className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                                                    {cert.period}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-sm font-headline font-bold uppercase leading-snug">
                                                {cert.name}
                                            </CardTitle>
                                            <p className="text-xs font-semibold text-accent mt-0.5 mb-1">{cert.issuer}</p>
                                            <p className="text-xs text-foreground/60 leading-relaxed">{cert.description}</p>
                                        </CardHeader>
                                    </Card>
                                </ScrollReveal>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ─── DOWNLOAD RESUME ─── */}
                <ScrollReveal direction="up" distance={40}>
                    <section className="
                        relative overflow-hidden text-center
                        rounded-2xl border border-primary/15
                        bg-gradient-to-br from-primary/8 via-background to-accent/8
                        p-10 md:p-14
                    ">
                        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full bg-primary/10 blur-3xl" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
                                <FileText className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold font-headline text-primary mb-2 uppercase tracking-tight">
                                {dictionary.about.downloadResume}
                            </h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                Download my full CV / Resume in PDF format
                            </p>
                            <div className="flex justify-center">
                                <DownloadButton id="cv-iwan-efendi" />
                            </div>
                        </div>
                    </section>
                </ScrollReveal>

            </main>
        </div>
    );
}

/* ── Helper: reusable section heading ── */
function SectionHeading({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold font-headline text-primary shrink-0 uppercase tracking-tight">
                {title}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
        </div>
    );
}

/* ── Helper: experience card, reused for both mobile and desktop ── */
function ExperienceCard({
    exp,
    align,
}: {
    exp: { period: string; title: string; company: string; description: string[] };
    align: 'left' | 'right';
}) {
    const isRight = align === 'right';
    return (
        <Card className="
            bg-card/60 backdrop-blur border-primary/10 rounded-xl w-full
            hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1
            transition-all duration-300
        ">
            <CardHeader className={`p-5 pb-3 ${isRight ? 'text-right' : ''}`}>
                <time className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                    {exp.period}
                </time>
                <CardTitle className="text-base md:text-lg font-headline font-bold text-primary leading-tight">
                    {exp.title}
                </CardTitle>
                <p className="text-sm font-semibold text-accent mt-0.5">{exp.company}</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
                <ul className={`space-y-2 ${isRight ? 'flex flex-col items-end' : ''}`}>
                    {exp.description.map((item, i) => (
                        <li
                            key={i}
                            className={`text-sm text-foreground/65 flex items-start gap-1.5 ${isRight ? 'flex-row-reverse' : ''}`}
                        >
                            <ChevronRight className={`w-3 h-3 mt-0.5 text-primary/60 shrink-0 ${isRight ? 'rotate-180' : ''}`} />
                            <span className={isRight ? 'text-right' : ''}>{item}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}