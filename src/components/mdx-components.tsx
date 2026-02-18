import type { MDXComponents } from 'next-mdx-remote/rsc/types'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadLinks } from '@/lib/data-downloads';

// Helper to generate IDs for TOC
const generateId = (children: any) => {
    if (typeof children !== 'string') return undefined;
    return children
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
};

const CustomImage = (props: any) => {
    if (!props.src || typeof props.src !== 'string' || props.src.trim() === '') {
        return null;
    }

    return (
        <Image
            width={768}
            height={432}
            className="my-8 h-auto w-full rounded-lg shadow-md"
            alt={props.alt || 'Blog post image'}
            {...props}
        />
    );
};

const DownloadButton = ({ id }: { id: string }) => {
  const linkData = downloadLinks[id];

  if (!linkData) {
    console.warn(`[DownloadButton Component]: The ID "${id}" was not found in data-downloads.ts.`);
    if (process.env.NODE_ENV === 'development') {
      return <p className="font-bold text-destructive">[DownloadButton Error: Invalid ID &quot;{id}&quot;]</p>;
    }
    return null;
  }

  const linkHref = `/download/${id}`;

  return (
    <div className="my-6">
        <Link 
          href={linkHref} 
          rel="noopener nofollow"
          className={cn(buttonVariants({ size: "lg" }))}
        >
            <Download className="mr-2 h-5 w-5" />
            {linkData.fileName}
        </Link>
    </div>
  );
};

const MdxH1 = ({ children }: { children?: React.ReactNode }) => <h1 id={generateId(children)} className="font-headline mt-12 mb-6 text-4xl font-bold tracking-tighter text-primary scroll-mt-6">{children}</h1>;
const MdxH2 = ({ children }: { children?: React.ReactNode }) => <h2 id={generateId(children)} className="font-headline mt-10 mb-5 text-3xl font-bold tracking-tighter text-primary scroll-mt-6">{children}</h2>;
const MdxH3 = ({ children }: { children?: React.ReactNode }) => <h3 id={generateId(children)} className="font-headline mt-8 mb-4 text-2xl font-bold tracking-tighter text-primary scroll-mt-6">{children}</h3>;
const MdxH4 = ({ children }: { children?: React.ReactNode }) => <h4 id={generateId(children)} className="font-headline mt-6 mb-3 text-xl font-bold tracking-tighter text-primary scroll-mt-6">{children}</h4>;
const MdxP = ({ children }: { children?: React.ReactNode }) => <p className="leading-7 my-6">{children}</p>;
const MdxA = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  if (props.href) {
    return <Link href={props.href} className="font-medium text-accent underline hover:no-underline">{props.children}</Link>;
  }
  return <a {...props} />;
};
const MdxUl = ({ children }: { children?: React.ReactNode }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>;
const MdxOl = ({ children }: { children?: React.ReactNode }) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>;
const MdxAItem = ({ children }: { children?: React.ReactNode }) => <li>{children}</li>;
const MdxBlockquote = ({ children }: { children?: React.ReactNode }) => <blockquote className="mt-6 border-l-2 border-primary/20 pl-6 italic text-muted-foreground">{children}</blockquote>;

const MdxPre = ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
        className={cn(
            "rounded-lg p-6 my-6 overflow-x-auto",
            className
        )}
        {...props}
    />
);

export const mdxComponents: MDXComponents = {
    h1: MdxH1,
    h2: MdxH2,
    h3: MdxH3,
    h4: MdxH4,
    p: MdxP,
    a: MdxA,
    ul: MdxUl,
    ol: MdxOl,
    li: MdxAItem,
    blockquote: MdxBlockquote,
    img: CustomImage,
    table: (props) => <div className="my-6"><Table {...props} /></div>,
    thead: TableHeader,
    tbody: TableBody,
    tr: TableRow,
    th: TableHead,
    td: TableCell,
    pre: MdxPre,
    DownloadButton,
}