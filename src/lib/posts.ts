import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { i18n } from '@/i18n-config';

const postsDirectory = path.join(process.cwd(), '_posts');

export type PostFrontmatter = {
  title: string;
  date: string;
  description: string;
  heroImage: string;
  translationKey: string;
  featured?: boolean;
  tags?: string[];
  category?: string;
  [key: string]: any;
};

export type Post<TFrontmatter> = {
  slug: string;
  frontmatter: TFrontmatter;
  locale: string;
};


export function getSortedPostsData(locale: string = i18n.defaultLocale): Post<PostFrontmatter>[] {
  const localeDirectory = path.join(postsDirectory, locale);
  let fileNames: string[];

  try {
    fileNames = fs.readdirSync(localeDirectory);
  } catch (err) {
    return [];
  }

  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(localeDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        frontmatter: data as PostFrontmatter,
        locale,
      };
    });

  return allPostsData.sort((a, b) => {
    if (new Date(a.frontmatter.date) < new Date(b.frontmatter.date)) {
      return 1;
    } else {
      return -1;
    }
  });
}

export type PostData = {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  locale: string;
};

export async function getPostData(slug: string, locale: string = i18n.defaultLocale): Promise<PostData | null> {
  const fullPath = path.join(postsDirectory, locale, `${slug}.mdx`);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data as PostFrontmatter,
    content,
    locale,
  };
}

export function getAllPostSlugs(locale: string = i18n.defaultLocale) {
    const localeDirectory = path.join(postsDirectory, locale);
    let fileNames: string[];
    try {
      fileNames = fs.readdirSync(localeDirectory);
    } catch (err) {
      return [];
    }

    return fileNames
      .filter((fileName) => fileName.endsWith('.mdx'))
      .map((fileName) => {
        return {
          slug: fileName.replace(/\.mdx$/, ''),
        };
      });
}

export function getPostTranslation(translationKey: string, targetLocale: string): Post<PostFrontmatter> | null {
  const allPosts = getSortedPostsData(targetLocale);
  const translatedPost = allPosts.find(p => p.frontmatter.translationKey === translationKey);
  return translatedPost || null;
}

export function getAllLocales() {
  try {
    return fs.readdirSync(postsDirectory).filter(item => 
      fs.statSync(path.join(postsDirectory, item)).isDirectory()
    );
  } catch (error) {
    return [];
  }
}
