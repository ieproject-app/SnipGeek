import type {MDXComponents} from 'next-mdx-remote/rsc/types'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Download, Cloud, Github, Type, Cpu, Settings, FileText, Maximize2 } from 'lucide-react';
import { WindowsStoreLogo } from '@/components/icons/windows-store-logo';
import { downloadLinks } from '@/lib/data-downloads';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Helper to generate IDs for TOC
const generateId = (children: any) => {
    if (typeof children !== 'string') return undefined;
    return children
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
};

const getPlatformIcon = (platform?: string, className?: string) => {
  switch (platform) {
    case 'windows': return <WindowsStoreLogo className={className} />;
    case 'gdrive': return <Cloud className={className} />;
    case 'github': return <Github className={className} />;
    case 'font': return <Type className={className} />;
    case 'driver': return <Settings className={className} />;
    case 'software': return <Cpu className={className} />;
    case 'doc': return <FileText className={className} />;
    default: return <Download className={className} />;
  }
}

/**
 * ZoomableImage - Wrapper component to make images clickable and expandable.
 */
const ZoomableImage = ({ src, alt, width, height, className, priority, ...props }: any) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="group relative cursor-zoom-in overflow-hidden rounded-lg shadow-md transition-all hover:shadow-xl">
                    <Image
                        src={src}
                        alt={alt || 'SnipGeek Image'}
                        width={width || 1200}
                        height={height || 675}
                        className={cn("h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]", className)}
                        priority={priority}
                        {...props}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 drop-shadow-lg" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent overflow-hidden flex items-center justify-center">
                <DialogTitle className="sr-only">Pratinjau Gambar</DialogTitle>
                <DialogDescription className="sr-only">Tampilan gambar diperbesar untuk {alt || 'gambar artikel'}</DialogDescription>
                <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                        src={src} 
                        alt={alt} 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

const CustomImage = ({ class: _class, className, parentName, priority, ...props }: any) => {
    if (!props.src || typeof props.src !== 'string' || props.src.trim() === '') {
        return null;
    }

    // Clean src if it starts with public/
    let src = props.src;
    if (src.startsWith('public/')) {
        src = src.replace('public/', '/');
    }

    return (
        <span className="block relative my-8 w-full">
            <ZoomableImage
                src={src}
                alt={props.alt}
                className={cn(_class, className)}
                priority={priority}
                {...props}
            />
        </span>
    );
};

export const DownloadButton = ({ id }: { id: string }) => {
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
            {getPlatformIcon(linkData.platform, "mr-2 h-5 w-5")}
            {linkData.fileName}
        </Link>
    </span>
  );
};

export const ImageGrid = ({ children, columns = 2, class: _class, className, parentName, ...props }: any) => {
    const gridCols = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    }[columns as 1 | 2 | 3 | 4] || 'grid-cols-1 sm:grid-cols-2';
  
    return (
      <div className={cn("grid gap-4 my-8 [&>p]:m-0 [&>span]:m-0", gridCols, _class, className)} {...props}>
        {children}
      </div>
    );
};

const MdxH1 = ({ children, class: _class, className, parentName, ...props }: any) => <h1 id={generateId(children)} className={cn("font-headline mt-12 mb-6 text-4xl font-bold tracking-tighter text-primary scroll-mt-24", _class, className)} {...props}>{children}</h1>;

const MdxH2 = ({ children, class: _class, className, parentName, ...props }: any) => (
  <div className="mt-12 mb-8 text-left">
    <h2 id={generateId(children)} className={cn("font-headline text-3xl font-bold tracking-tighter text-primary scroll-mt-24 mb-3", _class, className)} {...props}>
      {children}
    </h2>
    <div className="w-12 h-1 bg-accent rounded-full" />
  </div>
);

const MdxH3 = ({ children, class: _class, className, parentName, ...props }: any) => <h3 id={generateId(children)} className={cn("font-headline mt-8 mb-4 text-2xl font-bold tracking-tighter text-primary scroll-mt-24", _class, className)} {...props}>{children}</h3>;
const MdxH4 = ({ children, class: _class, className, parentName, ...props }: any) => <h4 id={generateId(children)} className={cn("font-headline mt-6 mb-3 text-xl font-bold tracking-tighter text-primary scroll-mt-24", _class, className)} {...props}>{children}</h4>;

const MdxP = ({ children, class: _class, className, parentName, ...props }: any) => (
  <span className={cn("block leading-7 my-6", _class, className)} {...props}>
    {children}
  </span>
);

const MdxA = ({ class: _class, className, parentName, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { class?: string, parentName?: string }) => {
  if (props.href) {
    return <Link href={props.href} className={cn("font-medium text-accent underline hover:no-underline", _class, className)}>{props.children}</Link>;
  }
  return <a className={cn(_class, className)} {...props} />;
};

const MdxUl = ({ children, class: _class, className, parentName, ...props }: any) => <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", _class, className)} {...props}>{children}</ul>;
const MdxOl = ({ children, class: _class, className, parentName, ...props }: any) => <ol className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", _class, className)} {...props}>{children}</ol>;
const MdxAItem = ({ children, class: _class, className, parentName, ...props }: any) => <li className={cn(_class, className)} {...props}>{children}</li>;
const MdxBlockquote = ({ children, class: _class, className, parentName, ...props }: any) => <blockquote className={cn("mt-6 border-l-2 border-primary/20 pl-6 italic text-muted-foreground", _class, className)} {...props}>{children}</blockquote>;

const MdxPre = ({ className, class: _class, parentName, style, ...props }: any) => (
    <pre
        className={cn(
            "rounded-lg p-6 my-6 overflow-x-auto border border-primary/5 text-[13px] leading-relaxed",
            _class,
            className
        )}
        style={style}
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
    table: (props: any) => {
        const { class: _class, parentName, ...rest } = props;
        return <span className="block my-6"><Table {...rest} /></span>;
    },
    thead: TableHeader,
    tbody: TableBody,
    tr: TableRow,
    th: TableHead,
    td: TableCell,
    pre: MdxPre,
    details: ({ children, class: _class, className, parentName, ...props }: any) => (
      <details className={cn("my-6 p-4 rounded-lg border bg-muted/20", _class, className)} {...props}>
        {children}
      </details>
    ),
    summary: ({ children, class: _class, className, parentName, ...props }: any) => (
      <summary className={cn("font-headline font-bold cursor-pointer hover:text-accent transition-colors", _class, className)} {...props}>
        {children}
      </summary>
    ),
    DownloadButton,
    ImageGrid,
}