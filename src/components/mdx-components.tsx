import Link from "next/link";
import React from "react";
import { slugifyHeading } from "@/lib/mdx-utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Download,
  Cloud,
  Type,
  Cpu,
  Settings,
  FileText,
  ExternalLink,
  Info,
  Lightbulb,
  TriangleAlert,
} from "lucide-react";
import { GithubLogo } from "@/components/icons/github-logo";
import { WindowsStoreLogo } from "@/components/icons/windows-store-logo";
import { downloadLinks } from "@/lib/data-downloads";
import { ZoomableImage } from "./zoomable-image";
import { SpecList, SpecItem } from "./mdx/spec-sheet";
import { Expandable } from "./mdx/expandable";
import { GalleryLightbox, type GalleryImageItem } from "./mdx/gallery-lightbox";
import { CopyablePre } from "./mdx/copyable-pre";

type MdxElementProps = {
  children?: React.ReactNode;
  class?: string;
  className?: string;
  parentName?: string;
} & React.HTMLAttributes<HTMLElement>;

type MdxStepProps = MdxElementProps & {
  stepNumber?: React.ReactNode;
  isLast?: boolean;
};

type MdxCalloutProps = MdxElementProps & {
  title?: React.ReactNode;
  variant?: CalloutVariant;
};

const extractText = (children: React.ReactNode): string => {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (React.isValidElement(child)) {
        return extractText(
          (child.props as { children?: React.ReactNode }).children,
        );
      }

      return "";
    })
    .join("");
};

// Helper to generate IDs for TOC — uses same slugify logic as extractHeadings
const generateId = (children: React.ReactNode) => {
  const text = extractText(children);
  if (!text) return undefined;
  return slugifyHeading(text);
};

const collectGalleryImages = (
  children: React.ReactNode,
  items: GalleryImageItem[] = [],
): GalleryImageItem[] => {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    const props = child.props as {
      src?: unknown;
      alt?: unknown;
      title?: unknown;
      children?: React.ReactNode;
    };

    if (typeof props.src === "string" && props.src.trim().length > 0) {
      const normalizedSrc = props.src.startsWith("public/")
        ? props.src.replace("public/", "/")
        : props.src;

      items.push({
        src: normalizedSrc,
        alt: typeof props.alt === "string" ? props.alt : "",
        title: typeof props.title === "string" ? props.title : undefined,
      });
    }

    if (props.children) {
      collectGalleryImages(props.children, items);
    }
  });

  return items;
};

const getPlatformIcon = (platform?: string, className?: string) => {
  switch (platform) {
    case "windows":
      return <WindowsStoreLogo className={className} />;
    case "gdrive":
      return <Cloud className={className} />;
    case "github":
      return <GithubLogo className={className} />;
    case "font":
      return <Type className={className} />;
    case "driver":
      return <Settings className={className} />;
    case "software":
      return <Cpu className={className} />;
    case "doc":
      return <FileText className={className} />;
    default:
      return <Download className={className} />;
  }
};

/**
 * ZoomableImage - Wrapper component to make images clickable and expandabe.
 */
/**
 * CustomImage - Wrapper around ZoomableImage for MDX
 */
const CustomImage = ({
  class: _class,
  className,
  src,
  alt,
  priority,
  ...props
}: MdxElementProps & { src?: string; alt?: string; priority?: boolean }) => {
  if (!src || typeof src !== "string" || src.trim() === "") {
    return null;
  }

  let normalizedSrc = src;
  if (normalizedSrc.startsWith("public/")) {
    normalizedSrc = normalizedSrc.replace("public/", "/");
  }

  if (process.env.NODE_ENV === "development" && (!alt || alt.trim() === "")) {
    console.warn(`[SEO] Image missing alt text: ${normalizedSrc}`);
  }

  return (
    <span className="block relative my-8 w-full">
      <ZoomableImage
        src={normalizedSrc as string}
        alt={alt ?? ""}
        className={cn(_class, className)}
        priority={priority}
        {...props}
      />
    </span>
  );
};

export const DownloadButton = ({ id }: { id: string }) => {
  const linkData = id ? downloadLinks[id] : null;

  if (!linkData) {
    if (process.env.NODE_ENV === "development") {
      return (
        <span className="block font-bold text-destructive">
          [DownloadButton Error: Invalid ID &quot;{id}&quot;]
        </span>
      );
    }
    return null;
  }

  const linkHref = `/download/${id}`;

  return (
    <span className="block my-6 text-left">
      <span className="inline-flex max-w-full flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-3 py-2.5 align-top shadow-sm transition-colors duration-200 hover:border-primary/20 hover:bg-card/70">
        <span className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground">
            {getPlatformIcon(linkData.platform, "h-4.5 w-4.5")}
          </span>

          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
              {linkData.fileName}
            </span>

            <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {linkData.fileSize && <span>{linkData.fileSize}</span>}
            </span>
          </span>
        </span>

        <Link
          href={linkHref}
          rel="noopener nofollow"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-8 shrink-0 rounded-md border-border/60 px-3 text-xs font-semibold shadow-none",
          )}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Link>
      </span>
    </span>
  );
};

export const ImageGrid = ({
  children,
  columns = 2,
  class: _class,
  className,
  ...props
}: MdxElementProps & { columns?: number | string }) => {
  const cols = Number(columns);
  const gridCols =
    {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    }[cols as 1 | 2 | 3 | 4] || "grid-cols-1 sm:grid-cols-2";

  return (
    <div
      className={cn(
        "grid gap-4 my-8 [&>p]:contents [&>p]:m-0 [&>span]:m-0",
        gridCols,
        _class,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const Gallery = ({
  children,
  caption,
  class: _class,
  className,
  ...props
}: MdxElementProps & { caption?: React.ReactNode }) => {
  const images = collectGalleryImages(children);

  if (images.length > 0) {
    return (
      <GalleryLightbox
        images={images}
        caption={caption}
        className={cn(_class, className)}
      />
    );
  }

  const childCount = React.Children.toArray(children).length;
  const gridCols = childCount === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";

  return (
    <div
      className={cn(
        "my-12 w-full relative sm:-mx-8 lg:-mx-16 sm:w-[calc(100%+4rem)] lg:w-[calc(100%+8rem)]",
        _class,
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "grid grid-cols-1 gap-4 [&>p]:contents [&>span]:contents [&_span.block]:my-0! [&_span.block]:w-full [&_img]:my-0! [&_img]:rounded-xl [&_img]:w-full hover:[&_img]:shadow-md transition-shadow",
          gridCols,
        )}
      >
        {children}
      </div>
      {caption && (
        <p className="mt-5 text-center text-[13px] text-muted-foreground/85 font-medium italic">
          {caption}
        </p>
      )}
    </div>
  );
};

const MdxH1 = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => (
  <h1
    id={generateId(children)}
    className={cn(
      "font-display mt-12 mb-6 text-2xl font-black tracking-tighter leading-tight text-primary scroll-mt-24",
      _class,
      className,
    )}
    {...props}
  >
    {children}
  </h1>
);

const MdxH2 = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => (
  <div className="mt-14 mb-6 text-left">
    <h2
      id={generateId(children)}
      className={cn(
        "font-display text-xl font-black tracking-tighter leading-snug text-primary scroll-mt-24 mb-3",
        _class,
        className,
      )}
      {...props}
    >
      {children}
    </h2>
    <div className="w-full h-0.5 bg-linear-to-r from-accent via-accent/50 to-transparent" />
  </div>
);

const MdxH3 = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => (
  <h3
    id={generateId(children)}
    className={cn(
      "font-display mt-10 mb-3 text-lg font-bold tracking-tight leading-snug text-primary scroll-mt-24",
      _class,
      className,
    )}
    {...props}
  >
    {children}
  </h3>
);
const MdxH4 = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => (
  <h4
    id={generateId(children)}
    className={cn(
      "font-display mt-8 mb-2 text-base font-bold tracking-tight leading-normal text-primary/90 scroll-mt-24",
      _class,
      className,
    )}
    {...props}
  >
    {children}
  </h4>
);

const MdxP = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => (
  <span className={cn("block leading-7 my-6", _class, className)} {...props}>
    {children}
  </span>
);

const MdxA = ({
  class: _class,
  className,
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  class?: string;
  parentName?: string;
}) => {
  if (!href) {
    return (
      <a className={cn(_class, className)} {...props}>
        {children}
      </a>
    );
  }

  const isExternal =
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//");

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1 font-medium text-accent underline underline-offset-4 transition-colors hover:text-primary hover:no-underline",
          _class,
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "font-medium text-accent underline underline-offset-4 transition-colors hover:text-primary hover:no-underline",
        _class,
        className,
      )}
    >
      {children}
    </Link>
  );
};

const MdxUl = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => (
  <ul
    className={cn("my-6 ml-6 list-disc [&>li]:mt-2", _class, className)}
    {...props}
  >
    {children}
  </ul>
);
const MdxOl = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => (
  <ol
    className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", _class, className)}
    {...props}
  >
    {children}
  </ol>
);
const MdxAItem = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => (
  <li className={cn(_class, className)} {...props}>
    {children}
  </li>
);
const MdxBlockquote = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => (
  <blockquote
    className={cn(
      "my-8 rounded-r-2xl border-l-4 border-primary/30 bg-primary/5 px-5 py-4 italic text-foreground/75 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
      _class,
      className,
    )}
    {...props}
  >
    {children}
  </blockquote>
);

const MdxHr = ({ class: _class, className, ...props }: MdxElementProps) => (
  <hr
    className={cn(
      "my-10 border-0 h-px bg-linear-to-r from-transparent via-accent/40 to-transparent",
      _class,
      className,
    )}
    {...props}
  />
);

const MdxStrong = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => (
  <strong
    className={cn("font-extrabold text-foreground", _class, className)}
    {...props}
  >
    {children}
  </strong>
);

const MdxEm = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => (
  <em className={cn("italic text-foreground/85", _class, className)} {...props}>
    {children}
  </em>
);

const MdxCode = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => (
  <code
    className={cn(
      "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] font-semibold text-foreground/85",
      _class,
      className,
    )}
    {...props}
  >
    {children}
  </code>
);

export const Kbd = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => (
  <kbd
    className={cn(
      "inline-flex min-h-6 items-center rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[0.78rem] font-bold text-foreground shadow-sm",
      _class,
      className,
    )}
    {...props}
  >
    {children}
  </kbd>
);

type CalloutVariant = "info" | "tip" | "warning" | "danger";

const calloutConfig: Record<
  CalloutVariant,
  {
    icon: React.ElementType;
    className: string;
    iconClassName: string;
    label: string;
  }
> = {
  info: {
    icon: Info,
    className: "border-sky-500/30 bg-sky-500/8",
    iconClassName: "text-sky-500",
    label: "Info",
  },
  tip: {
    icon: Lightbulb,
    className: "border-emerald-500/30 bg-emerald-500/8",
    iconClassName: "text-emerald-500",
    label: "Tip",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-amber-500/30 bg-amber-500/8",
    iconClassName: "text-amber-500",
    label: "Warning",
  },
  danger: {
    icon: TriangleAlert,
    className: "border-rose-500/30 bg-rose-500/8",
    iconClassName: "text-rose-500",
    label: "Important",
  },
};

export const Callout = ({
  children,
  title,
  variant = "info",
  class: _class,
  className,
  ...props
}: MdxCalloutProps) => {
  const config = calloutConfig[variant as CalloutVariant] ?? calloutConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "my-7 rounded-2xl border p-4 sm:p-5",
        config.className,
        _class,
        className,
      )}
      {...props}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", config.iconClassName)} />
        <span className="text-[11px] font-black uppercase tracking-widest text-foreground/70">
          {title || config.label}
        </span>
      </div>
      <div className="text-sm leading-7 text-foreground/80 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
};

export const Steps = ({
  children,
  class: _class,
  className,
  ...props
}: MdxElementProps) => {
  const items = React.Children.toArray(children);

  return (
    <div className={cn("my-10 ml-4 space-y-0", _class, className)} {...props}>
      {items.map((child, index) => {
        if (!React.isValidElement(child)) {
          return child;
        }

        return React.cloneElement(
          child as React.ReactElement<{
            stepNumber?: number;
            isLast?: boolean;
          }>,
          {
            stepNumber: index + 1,
            isLast: index === items.length - 1,
          },
        );
      })}
    </div>
  );
};

export const Step = ({
  children,
  stepNumber,
  isLast,
  class: _class,
  className,
  ...props
}: MdxStepProps) => (
  <div
    className={cn(
      "relative grid grid-cols-[auto_1fr] gap-x-6 gap-y-0 pb-6",
      isLast && "pb-0",
      _class,
      className,
    )}
    {...props}
  >
    {/* Vertical line and Number container */}
    <div className="flex flex-col items-center">
      {/* Circle Number */}
      <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-[11px] font-black text-primary shadow-sm">
        {stepNumber}
      </div>

      {/* Connector Line */}
      <div
        className={cn(
          "mt-2 h-full w-0.5 bg-linear-to-b from-primary/30 via-primary/10 to-transparent",
          isLast && "opacity-50",
        )}
      />
    </div>

    {/* Content Container */}
    <div className="min-w-0 pt-0.5">
      <div className="text-[15px] leading-7 text-foreground/80 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {children}
      </div>
    </div>
  </div>
);

export const mdxComponents = {
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
  table: (props: MdxElementProps) => {
    const { ...rest } = props;
    return (
      <span className="block my-6 overflow-x-auto">
        <Table {...rest} />
      </span>
    );
  },
  thead: TableHeader,
  tbody: TableBody,
  tr: TableRow,
  th: TableHead,
  td: TableCell,
  pre: CopyablePre,
  hr: MdxHr,
  strong: MdxStrong,
  em: MdxEm,
  code: MdxCode,
  kbd: Kbd,
  details: ({ children, className, ...props }: MdxElementProps) => (
    <details
      className={cn(
        "my-6 rounded-xl border border-primary/10 bg-muted/20 p-4",
        className,
      )}
      {...props}
    >
      {children}
    </details>
  ),
  summary: ({ children, className, ...props }: MdxElementProps) => (
    <summary
      className={cn(
        "font-display cursor-pointer font-bold transition-colors hover:text-accent",
        className,
      )}
      {...props}
    >
      {children}
    </summary>
  ),
  DownloadButton,
  SpecList,
  SpecItem,
  Expandable,
  ImageGrid,
  Gallery,
  Callout,
  Steps,
  Step,
};
