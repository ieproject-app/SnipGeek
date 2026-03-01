
import { getPostData, getAllPostSlugs, getAllLocales } from '@/lib/posts';
import { getDictionary } from '@/lib/get-dictionary';
import { i18n } from '@/i18n-config';
import { PostPageClient } from './post-page-client';

export async function generateStaticParams() {
  const locales = getAllLocales();
  return locales.flatMap((locale) => {
    const slugs = getAllPostSlugs(locale);
    return slugs.map(item => ({ slug: item.slug, locale }));
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string, locale: string }> }) {
  const { slug, locale } = await params;
  const initialPost = await getPostData(slug, locale);
  const dictionary = await getDictionary(locale as any);

  return (
    <PostPageClient 
        initialPost={initialPost as any} 
        slug={slug} 
        locale={locale} 
        dictionary={dictionary} 
    />
  );
}
