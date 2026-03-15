import { i18n } from "@/i18n-config";
import type { Locale } from "@/i18n-config";
import type { Metadata } from "next";
import { getPageContent } from "@/lib/pages";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx-components";
import remarkGfm from "remark-gfm";
import rehypeShiki from "@shikijs/rehype";
import { cvData, type Experience } from "@/lib/cv-data";
import { getDictionary } from "@/lib/get-dictionary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  GraduationCap,
  Award,
  Mail,
  ChevronRight,
  FileText,
  MapPin,
  Sparkles,
  Laptop,
  PenLine,
  ArrowRight,
} from "lucide-react";
import { DownloadButton } from "@/components/mdx-components";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MotionDiv, MotionSpan } from "@/components/ui/client-motion";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const currentPrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
  const canonicalPath = `${currentPrefix}/about`;

  const languages: Record<string, string> = {};
  i18n.locales.forEach((loc) => {
    const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
    languages[loc] = `${prefix}/about`;
  });

  return {
    title: dictionary.about.title,
    description: dictionary.about.description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languages,
        "x-default": languages[i18n.defaultLocale] || canonicalPath,
      },
    },
    openGraph: {
      siteName: "SnipGeek",
      title: dictionary.about.title,
      description: dictionary.about.description,
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const { content } = await getPageContent("about", locale);
  const dictionary = await getDictionary(locale);
  const data = cvData[locale] || cvData.en;
  const authorAvatar = "/images/profile/profile.png";
  const learningRole =
    locale === "id"
      ? "Terus belajar, merapikan proses, dan membangun hal-hal yang berguna."
      : "Always learning, refining workflows, and building useful things.";

  return (
    <div className="w-full">
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-14 sm:px-6 lg:px-8">
        <ScrollReveal direction="down">
          <section className="relative overflow-hidden rounded-3xl border border-primary/10 bg-linear-to-br from-primary/6 via-background to-accent/6 p-8 md:p-12">
            <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                  {data.profile.badge}
                </div>

                <h1 className="font-display text-4xl font-black tracking-tighter text-primary">
                  {dictionary.about.title}
                </h1>

                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  {dictionary.about.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Badge
                    variant="outline"
                    className="gap-2 bg-background/70 px-4 py-1.5 text-sm backdrop-blur"
                  >
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    {data.email}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="gap-2 bg-background/70 px-4 py-1.5 text-sm backdrop-blur"
                  >
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                    {data.profile.companyLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="gap-2 bg-background/70 px-4 py-1.5 text-sm backdrop-blur"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {data.profile.locationLabel}
                  </Badge>
                </div>
              </div>

              <div className="flex w-full justify-center lg:justify-end">
                <div className="w-full max-w-md">
                  <div className="relative rounded-7 border border-primary/10 bg-card/70 px-5 pb-6 pt-5 shadow-xl backdrop-blur-sm sm:px-6 sm:pb-7 sm:pt-6">
                    <div className="absolute top-0 right-0 h-15 w-15 rounded-tr-[28px] rounded-bl-3xl bg-background/92 sm:h-18 sm:w-18" />
                    <MotionDiv
                      initial={{
                        opacity: 0,
                        x: 22,
                        y: -18,
                        scale: 0.88,
                        rotate: 4,
                      }}
                      whileInView={{
                        opacity: 1,
                        x: 0,
                        y: 0,
                        scale: 1,
                        rotate: 0,
                      }}
                      viewport={{ once: true, amount: 0.55 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.12,
                        ease: [0.21, 0.47, 0.32, 0.98],
                      }}
                      className="absolute -top-8 right-4 sm:-top-10 sm:right-5"
                    >
                      <div className="relative">
                        <MotionSpan
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full border border-primary/25"
                          whileInView={{
                            scale: [1, 1.16, 1],
                            opacity: [0.45, 0.12, 0.45],
                          }}
                          transition={{
                            duration: 2.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                        <MotionSpan
                          aria-hidden="true"
                          className="absolute -inset-2 rounded-full border border-primary/12"
                          whileInView={{
                            scale: [0.96, 1.1, 0.96],
                            opacity: [0.22, 0.05, 0.22],
                          }}
                          transition={{
                            duration: 3.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.35,
                          }}
                        />
                        <Avatar className="relative h-20 w-20 shadow-2xl ring-4 ring-primary/20 ring-offset-4 ring-offset-background sm:h-24 sm:w-24">
                          <AvatarImage src={authorAvatar} alt={data.name} />
                          <AvatarFallback className="text-xl font-bold">
                            IE
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </MotionDiv>

                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase tracking-widest text-accent">
                        {data.profile.panelLabel}
                      </p>
                      <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-primary">
                        {data.name}
                      </h2>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
                        {learningRole}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                        {data.profile.statement}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.06}>
          <section className="mt-8 mb-16">
            <div className="mx-auto max-w-4xl rounded-7 border border-primary/10 bg-linear-to-br from-card/85 via-card/70 to-background/90 p-6 shadow-sm backdrop-blur-sm sm:p-8">
              <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 sm:pr-8">
                  <div className="mb-3 flex items-center gap-2">
                    <PenLine className="h-4 w-4 text-accent" />
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-accent">
                      {dictionary.about.summary}
                    </p>
                  </div>
                  <p className="text-base leading-relaxed text-foreground/75 sm:text-lg">
                    {data.summary}
                  </p>
                </div>

                <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-70">
                  {data.profile.stats.map((stat) => (
                    <MiniStat
                      key={`${stat.label}-${stat.value}`}
                      label={stat.label}
                      value={stat.value}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <section className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
          <ScrollReveal direction="up" delay={0.05} className="h-full min-h-0">
            <IdentityCard
              icon={Sparkles}
              title={dictionary.about.story}
              description={data.profile.storyCardDescription}
            />
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.1} className="h-full min-h-0">
            <IdentityCard
              icon={Laptop}
              title={dictionary.about.workflow}
              description={data.profile.workflowCardDescription}
            />
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.15} className="h-full min-h-0">
            <IdentityCard
              icon={PenLine}
              title={dictionary.about.philosophy}
              description={data.profile.philosophyCardDescription}
            />
          </ScrollReveal>
        </section>

        <ScrollReveal direction="up" delay={0.1}>
          <section className="mb-20">
            <SectionHeading title={dictionary.about.story} />
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
              <div className="min-w-0">
                <div className="rounded-7 border border-primary/10 bg-card/20 p-6 shadow-sm backdrop-blur-sm sm:p-8">
                  <div className="prose-content text-lg text-foreground/80 [&>h2:first-child]:mt-0 [&>p:first-child]:mt-0">
                    <MDXRemote
                      source={content}
                      components={mdxComponents}
                      options={{
                        mdxOptions: {
                          remarkPlugins: [remarkGfm],
                          rehypePlugins: [
                            [rehypeShiki, { theme: "github-dark" }],
                          ],
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              <aside className="lg:sticky lg:top-24">
                <div className="relative rounded-3xl border border-primary/10 bg-linear-to-br from-primary/6 via-background to-accent/6 p-5 shadow-sm">
                  <div className="absolute top-0 right-0 h-14 w-14 rounded-tr-3xl rounded-bl-[20px] bg-background/92 sm:h-16 sm:w-16" />
                  <MotionDiv
                    initial={{
                      opacity: 0,
                      x: 18,
                      y: -14,
                      scale: 0.9,
                      rotate: 4,
                    }}
                    whileInView={{
                      opacity: 1,
                      x: 0,
                      y: 0,
                      scale: 1,
                      rotate: 0,
                    }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{
                      duration: 0.65,
                      delay: 0.1,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                    className="absolute -top-7 right-3 sm:-top-8 sm:right-4"
                  >
                    <div className="relative">
                      <MotionSpan
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full border border-primary/25"
                        whileInView={{
                          scale: [1, 1.15, 1],
                          opacity: [0.42, 0.12, 0.42],
                        }}
                        transition={{
                          duration: 2.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <MotionSpan
                        aria-hidden="true"
                        className="absolute -inset-1.5 rounded-full border border-primary/12"
                        whileInView={{
                          scale: [0.96, 1.08, 0.96],
                          opacity: [0.22, 0.05, 0.22],
                        }}
                        transition={{
                          duration: 3.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.35,
                        }}
                      />
                      <Avatar className="relative h-16 w-16 shadow-xl ring-4 ring-primary/20 ring-offset-4 ring-offset-background sm:h-20 sm:w-20">
                        <AvatarImage src={authorAvatar} alt={data.name} />
                        <AvatarFallback className="text-lg font-bold">
                          IE
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </MotionDiv>

                  <div className="text-left">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-accent">
                      {data.profile.panelLabel}
                    </p>
                    <h3 className="mt-3 font-display text-lg font-black tracking-tight text-primary">
                      {data.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      {learningRole}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                      {data.profile.statement}
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </ScrollReveal>

        <section className="mb-20">
          <ScrollReveal direction="left">
            <SectionHeading title={dictionary.about.experience} />
          </ScrollReveal>

          <div className="mt-8 rounded-3xl border border-primary/10 bg-card/25 p-6 sm:p-8">
            <div className="mb-8 max-w-3xl">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {data.profile.experienceIntro}
              </p>
            </div>

            <div className="relative px-2 sm:px-0">
              <div className="absolute top-0 bottom-0 left-5 w-px -translate-x-1/2 bg-linear-to-b from-transparent via-primary/20 to-transparent sm:left-1/2" />

              <div className="space-y-10">
                {data.experiences.map((exp, index) => {
                  const isLeft = index % 2 === 0;

                  return (
                    <div
                      key={`${exp.title}-${exp.period}`}
                      className="group relative"
                    >
                      <ScrollReveal
                        delay={index * 0.08}
                        direction={isLeft ? "left" : "right"}
                      >
                        <div className="flex w-full flex-col sm:flex-row sm:items-center">
                          <div className="hidden sm:block sm:w-1/2 sm:pr-10">
                            {isLeft && (
                              <ExperienceCard exp={exp} align="right" />
                            )}
                          </div>

                          <div className="absolute top-8 left-5 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center sm:top-1/2 sm:left-1/2">
                            <div className="relative">
                              <div className="absolute inset-0 scale-150 rounded-full bg-primary/10 group-hover:bg-primary/20" />
                              <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/40 bg-background shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:border-primary">
                                <Briefcase className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                          </div>

                          <div className="w-full pl-14 sm:w-1/2 sm:pl-10">
                            {!isLeft && (
                              <div className="hidden sm:block">
                                <ExperienceCard exp={exp} align="left" />
                              </div>
                            )}
                            <div className="block sm:hidden">
                              <ExperienceCard exp={exp} align="left" />
                            </div>
                          </div>
                        </div>
                      </ScrollReveal>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <ScrollReveal direction="right">
            <SectionHeading title={dictionary.about.skills} />
          </ScrollReveal>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {data.skills.map((cat, index) => (
              <ScrollReveal key={cat.name} delay={index * 0.08} direction="up">
                <Card className="relative h-full overflow-hidden rounded-2xl border-primary/10 bg-card/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <div className="absolute top-0 right-0 left-0 h-0.5 bg-linear-to-r from-transparent via-primary/50 to-transparent" />
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-sm font-bold uppercase tracking-widest text-primary">
                      {cat.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 pt-0">
                    {cat.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="cursor-default px-2.5 py-1 text-xs font-medium transition-colors hover:bg-primary/15"
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

        <div className="mb-16 grid grid-cols-1 gap-10 md:grid-cols-2">
          <section>
            <ScrollReveal direction="left">
              <SectionHeading title={dictionary.about.education} />
            </ScrollReveal>
            <div className="mt-8 space-y-4">
              {data.education.map((edu, index) => (
                <ScrollReveal
                  key={`${edu.school}-${edu.year}`}
                  delay={index * 0.08}
                  direction="left"
                >
                  <Card className="rounded-xl border-primary/10 bg-card/40 transition-all duration-300 hover:border-primary/20 hover:shadow-md">
                    <CardHeader className="p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                          <GraduationCap className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <time className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {edu.year}
                        </time>
                      </div>
                      <CardTitle className="font-display text-sm font-bold uppercase leading-snug">
                        {edu.school}
                      </CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {edu.degree}
                      </p>
                    </CardHeader>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </section>

          <section>
            <ScrollReveal direction="right">
              <SectionHeading title={dictionary.about.certifications} />
            </ScrollReveal>
            <div className="mt-8 space-y-4">
              {data.certifications.map((cert, index) => (
                <ScrollReveal
                  key={`${cert.name}-${cert.period}`}
                  delay={index * 0.08}
                  direction="right"
                >
                  <Card className="rounded-xl border-primary/10 bg-card/40 transition-all duration-300 hover:border-primary/20 hover:shadow-md">
                    <CardHeader className="p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                          <Award className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase tracking-widest"
                        >
                          {cert.period}
                        </Badge>
                      </div>
                      <CardTitle className="font-display text-sm font-bold uppercase leading-snug">
                        {cert.name}
                      </CardTitle>
                      <p className="mt-0.5 mb-1 text-xs font-semibold text-accent">
                        {cert.issuer}
                      </p>
                      <p className="text-xs leading-relaxed text-foreground/60">
                        {cert.description}
                      </p>
                    </CardHeader>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </section>
        </div>

        <ScrollReveal direction="up" distance={40}>
          <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-linear-to-br from-primary/8 via-background to-accent/8 p-10 text-center md:p-14">
            <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative z-10 mx-auto max-w-2xl">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-display text-3xl font-black tracking-tight text-primary">
                {dictionary.about.downloadResume}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {data.profile.resumeDescription}
              </p>
              <div className="mt-6 flex justify-start">
                <DownloadButton id="cv-iwan-efendi" />
              </div>
              <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <span>{data.profile.founderLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
                <span>{data.profile.brandLabel}</span>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </main>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="font-display shrink-0 text-xl font-bold uppercase tracking-tight text-primary">
        {title}
      </h2>
      <div className="h-px flex-1 bg-linear-to-r from-primary/40 to-transparent" />
    </div>
  );
}

function IdentityCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Card className="flex h-full flex-col rounded-2xl border-primary/10 bg-card/45 transition-all duration-300 hover:border-primary/20 hover:shadow-md">
      <CardHeader className="shrink-0">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="font-display text-base font-bold tracking-tight text-primary">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-background/60 px-3 py-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-primary">{value}</p>
    </div>
  );
}

function ExperienceCard({
  exp,
  align,
}: {
  exp: Experience;
  align: "left" | "right";
}) {
  const isRight = align === "right";

  return (
    <Card className="w-full rounded-xl border-primary/10 bg-card/60 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className={`p-5 pb-3 ${isRight ? "text-right" : ""}`}>
        <time className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {exp.period}
        </time>
        <CardTitle className="font-display text-base font-bold leading-tight text-primary md:text-lg">
          {exp.title}
        </CardTitle>
        <p className="mt-0.5 text-sm font-semibold text-accent">
          {exp.company}
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <ul className={`space-y-2 ${isRight ? "flex flex-col items-end" : ""}`}>
          {exp.description.map((item, i) => (
            <li
              key={`${exp.title}-${i}`}
              className={`flex items-start gap-1.5 text-sm text-foreground/65 ${isRight ? "flex-row-reverse" : ""}`}
            >
              <ChevronRight
                className={`mt-0.5 h-3 w-3 shrink-0 text-primary/60 ${isRight ? "rotate-180" : ""}`}
              />
              <span className={isRight ? "text-right" : ""}>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
