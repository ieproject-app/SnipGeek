import type { MDXComponents } from 'next-mdx-remote/rsc/types'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

// This component handles how `<img>` tags are rendered via MDX.
const CustomImage = (props: any) => {
    // This check prevents build errors and crashes if the `src` is missing or invalid.
    // An invalid `src` can come from an empty image tag in MDX, like `![]()`.
    if (!props.src || typeof props.src !== 'string') {
        return null;
    }

    return (
        <div className="relative my-8 aspect-video overflow-hidden rounded-lg shadow-md">
            <Image
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                alt={props.alt || 'Blog post image'}
                {...props}
            />
        </div>
    );
};

// We define all the custom components outside of the main object
// to avoid the weird parser issues from the build tool.
const MdxH1 = ({ children }: { children?: React.ReactNode }) => <h1 className="font-headline mt-12 mb-6 text-4xl font-bold tracking-tighter text-primary">{children}</h1>;
const MdxH2 = ({ children }: { children?: React.ReactNode }) => <h2 className="font-headline mt-10 mb-5 border-b pb-2 text-3xl font-bold tracking-tighter text-primary">{children}</h2>;
const MdxH3 = ({ children }: { children?: React.ReactNode }) => <h3 className="font-headline mt-8 mb-4 text-2xl font-bold tracking-tighter text-primary">{children}</h3>;
const MdxH4 = ({ children }: { children?: React.ReactNode }) => <h4 className="font-headline mt-6 mb-3 text-xl font-bold tracking-tighter text-primary">{children}</h4>;
const MdxP = ({ children }: { children?: React.ReactNode }) => {
    // When MDX encounters an image on a line by itself, it wraps it in a <p> tag.
    // This leads to invalid HTML (<p><div>...</div></p>) because our CustomImage renders a div.
    // To fix this, we check if the child is an image and, if so, we render it without the wrapping <p>.
    if (React.isValidElement(children) && children.type === CustomImage) {
        return <>{children}</>;
    }
    return <p className="leading-7 my-6">{children}</p>;
};
const MdxA = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  if (props.href) {
    // Handle internal and external links differently if needed
    return <Link href={props.href} className="font-medium text-accent-foreground underline hover:no-underline">{props.children}</Link>;
  }
  return <a {...props} />;
};
const MdxUl = ({ children }: { children?: React.ReactNode }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>;
const MdxOl = ({ children }: { children?: React.ReactNode }) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>;
const MdxLi = ({ children }: { children?: React.ReactNode }) => <li>{children}</li>;
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
    li: MdxLi,
    blockquote: MdxBlockquote,
    img: CustomImage,
    table: (props) => <div className="my-6"><Table {...props} /></div>,
    thead: TableHeader,
    tbody: TableBody,
    tr: TableRow,
    th: TableHead,
    td: TableCell,
    pre: MdxPre,
}
