import { getSortedPostsData } from "@/lib/posts";
import { getFirstLatestPostImageHref } from "@/lib/home-latest-image";
import type { Locale } from "@/i18n-config";

export default async function Head({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const posts = await getSortedPostsData(locale);
  const firstLatestPostImageHref = getFirstLatestPostImageHref(posts);

  return (
    <>
      <link rel="preconnect" href="https://studio-8697076532-14512.firebaseapp.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.googleapis.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://apis.google.com" crossOrigin="anonymous" />
      {firstLatestPostImageHref && (
        <link
          rel="preload"
          as="image"
          href={firstLatestPostImageHref}
          fetchPriority="high"
        />
      )}
    </>
  );
}