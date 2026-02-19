import type {MDXComponents} from 'next-mdx-remote/rsc/types'
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

const CustomImage = ({ class: _class, className, ...props }: any) => {
    if (!props.src || typeof props.src !== 'string' || props.src.trim() === '') {
        return null;
    }

    return (
        <span className="block relative my-8 w-full">
            <Image
                width={1200}
                height={675}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
                className={cn("h-auto w-full rounded-lg shadow-md object-cover", _class, className)}
                alt={props.alt || 'SnipGeek article image'}
                {...props}
            />
        </span>
    );
};

const DownloadButton = ({ id }: { id: string }) => {
  const linkData = downloadLinks[id];

  if (!linkData) {
    console.warn(`[DownloadButton Component]: The ID "${id}" was not found in data-downloads.ts.`);
    if (process.env.NODE_ENV === 'development') {
      return <span className="block font-bold text-destructive">[DownloadButton Error: Invalid ID &quot;{id}&quot;]</span>;
    }
    return null;
  }

  const linkHref = `/download/${id}`;

  return (
    <span className="block my-6">
        <Link 
          href={linkHref} 
          rel="noopener nofollow"
          className={cn(buttonVariants({ size: "lg" }))}
        >
            <Download className="mr-2 h-5 w-5" />
            {linkData.fileName}
        </Link>
    </span>
  );
};

const ImageGrid = ({ children, columns = 2, class: _class, className }: any) => {
    const gridCols = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    }[columns as 1 | 2 | 3 | 4] || 'grid-cols-1 sm:grid-cols-2';
  
    return (
      <div className={cn("grid gap-4 my-8 [&>p]:m-0 [&>span]:m-0", gridCols, _class, className)}>
        {children}
      </div>
    );
};

const MdxH1 = ({ children, class: _class, className, ...props }: any) => <h1 id={generateId(children)} className={cn("font-headline mt-12 mb-6 text-4xl font-bold tracking-tighter text-primary scroll-mt-6", _class, className)} {...props}>{children}</h1>;
const MdxH2 = ({ children, class: _class, className, ...props }: any) => <h2 id={generateId(children)} className={cn("font-headline mt-10 mb-5 text-3xl font-bold tracking-tighter text-primary scroll-mt-6", _class, className)} {...props}>{children}</h2>;
const MdxH3 = ({ children, class: _class, className, ...props }: any) => <h3 id={generateId(children)} className={cn("font-headline mt-8 mb-4 text-2xl font-bold tracking-tighter text-primary scroll-mt-6", _class, className)} {...props}>{children}</h3>;
const MdxH4 = ({ children, class: _class, className, ...props }: any) => <h4 id={generateId(children)} className={cn("font-headline mt-6 mb-3 text-xl font-bold tracking-tighter text-primary scroll-mt-6", _class, className)} {...props}>{children}</h4>;

const MdxP = ({ children, class: _class, className, ...props }: any) => (
  <span className={cn("block leading-7 my-6", _class, className)} {...props}>
    {children}
  </span>
);

const MdxA = ({ class: _class, className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { class?: string }) => {
  if (props.href) {
    return <Link href={props.href} className={cn("font-medium text-accent underline hover:no-underline", _class, className)}>{props.children}</Link>;
  }
  return <a className={cn(_class, className)} {...props} />;
};

const MdxUl = ({ children, class: _class, className, ...props }: any) => <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", _class, className)} {...props}>{children}</ul>;
const MdxOl = ({ children, class: _class, className, ...props }: any) => <ol className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", _class, className)} {...props}>{children}</ol>;
const MdxAItem = ({ children, class: _class, className, ...props }: any) => <li className={cn(_class, className)} {...props}>{children}</li>;
const MdxBlockquote = ({ children, class: _class, className, ...props }: any) => <blockquote className={cn("mt-6 border-l-2 border-primary/20 pl-6 italic text-muted-foreground", _class, className)} {...props}>{children}</blockquote>;

const MdxPre = ({ className, class: _class, ...props }: any) => (
    <pre
        className={cn(
            "rounded-lg p-6 my-6 overflow-x-auto",
            _class,
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
    table: (props: any) => <span className="block my-6"><Table {...props} /></span>,
    thead: TableHeader,
    tbody: TableBody,
    tr: TableRow,
    th: TableHead,
    td: TableCell,
    pre: MdxPre,
    details: ({ children, class: _class, className, ...props }: any) => (
      <details className={cn("my-6 p-4 rounded-xl border bg-muted/20", _class, className)} {...props}>
        {children}
      </details>
    ),
    summary: ({ children, class: _class, className, ...props }: any) => (
      <summary className={cn("font-bold cursor-pointer hover:text-accent transition-colors", _class, className)} {...props}>
        {children}
      </summary>
    ),
    DownloadButton,
    ImageGrid,
}
