import { i18n, type Locale } from "@/i18n-config";
import { getDictionary } from "@/lib/get-dictionary";
import { getAllTags } from "@/lib/tags";
import { cn, getLinkPrefix } from "@/lib/utils";
import Link from "next/link";
import { Hash, ArrowRight } from "lucide-react";
import { getBadgeStyle } from "@/components/layout/category-badge";
import { LayoutBreadcrumbs } from "@/components/layout/layout-breadcrumbs";
import type { Metadata } from "next";

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);
    const currentPrefix = locale === i18n.defaultLocale ? "" : `/${locale}`;
    const canonicalPath = `${currentPrefix}/tags`;
    const languages: Record<string, string> = {};
    i18n.locales.forEach((loc) => {
        const prefix = loc === i18n.defaultLocale ? "" : `/${loc}`;
        languages[loc] = `${prefix}/tags`;
    });

    return {
        title: dictionary.tags.allTagsTitle,
        description: dictionary.tags.allTagsDescription,
        alternates: {
            canonical: canonicalPath,
            languages: {
                ...languages,
                "x-default": languages[i18n.defaultLocale] || canonicalPath,
            },
        },
    };
}

export default async function TagsPage({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);
    const tags = await getAllTags(locale);
    const linkPrefix = getLinkPrefix(locale);

    const breadcrumbSegments = [
        { label: dictionary.home.breadcrumbHome, href: linkPrefix || "/" },
        { label: dictionary.tags.allTagsTitle },
    ];

    return (
        <div className="w-full">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pb-24">
                <header className="mb-12 text-center">
                    <LayoutBreadcrumbs
                        segments={breadcrumbSegments}
                        className="mb-6 justify-center"
                    />

                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                        <Hash className="h-3.5 w-3.5" />
                        Archive
                    </div>

                    <h1 className="font-display text-4xl font-extrabold tracking-tighter text-primary mb-4 sm:text-5xl">
                        {dictionary.tags.allTagsTitle}
                    </h1>

                    <p className="max-w-xl mx-auto text-muted-foreground text-sm sm:text-base leading-relaxed">
                        {dictionary.tags.allTagsDescription}
                    </p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tags.map((tag) => {
                        const style = getBadgeStyle(tag.name);
                        return (
                            <Link
                                key={tag.name}
                                href={`${linkPrefix}/tags/${encodeURIComponent(tag.name.toLowerCase())}`}
                                className="group relative overflow-hidden rounded-2xl border border-primary/5 bg-card/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-3">
                                        <div className={cn(
                                            "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-300 group-hover:bg-primary/5",
                                            style.border,
                                            style.bg
                                        )}>
                                            <Hash className={cn("h-5 w-5", style.text)} />
                                        </div>

                                        <div>
                                            <h2 className="text-lg font-bold tracking-tight text-primary transition-colors group-hover:text-primary">
                                                {tag.name}
                                            </h2>
                                            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-muted-foreground/60">
                                                <span>{tag.count} {tag.count === 1 ? 'item' : 'items'}</span>
                                                <span className="h-1 w-1 rounded-full bg-border" />
                                                <span className="capitalize">{tag.type === 'both' ? 'blog & notes' : tag.type}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-full bg-primary/5 p-2 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </div>

                                {/* Decorative background element */}
                                <div className={cn(
                                    "absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-[0.03] transition-transform duration-500 group-hover:scale-150",
                                    style.dot
                                )} />
                            </Link>
                        );
                    })}
                </div>

                {tags.length === 0 && (
                    <div className="py-20 text-center">
                        <p className="text-muted-foreground">{dictionary.tags.noItems}</p>
                    </div>
                )}
            </main>
        </div>
    );
}
