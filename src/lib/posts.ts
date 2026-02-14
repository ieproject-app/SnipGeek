import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), '_posts');

export type PostFrontmatter = {
  title: string;
  date: string;
  description: string;
  heroImage: string;
  [key: string]: any;
};

export type Post<TFrontmatter> = {
  slug: string;
  frontmatter: TFrontmatter;
};


export function getSortedPostsData(): Post<PostFrontmatter>[] {
  let fileNames: string[];
  try {
    fileNames = fs.readdirSync(postsDirectory);
  } catch (err) {
    // If the directory doesn't exist, return an empty array
    return [];
  }

  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        frontmatter: data as PostFrontmatter,
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

export async function getPostData(slug: string) {
  const fullPath = path.join(postsDirectory, `${slug}.mdx`);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data as PostFrontmatter,
    content,
  };
}

export function getAllPostSlugs() {
    let fileNames: string[];
    try {
      fileNames = fs.readdirSync(postsDirectory);
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
