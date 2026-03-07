import Image from "next/image";
import Link from "next/link";
import React from "react";
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
  Github,
  Type,
  Cpu,
  Settings,
  FileText,
  Maximize2,
  ExternalLink,
  Info,
  Lightbulb,
  TriangleAlert,
  ShieldAlert,
} from "lucide-react";
import { WindowsStoreLogo } from "@/components/icons/windows-store-logo";
import { downloadLinks } from "@/lib/data-downloads";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

// Helper to generate IDs for TOC
const generateId = (children: React.ReactNode) => {
  const text = extractText(children);

  if (!text) return undefined;

  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
};

const getPlatformIcon = (platform?: string, className?: string) => {
  switch (platform) {
    case "windows":
      return <WindowsStoreLogo className={className} />;
    case "gdrive":
      return <Cloud className={className} />;
    case "github":
      return <Github className={className} />;
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
const ZoomableImage = ({
  src,
  alt,
  width,
  height,
  className,
  priority,
  ...props
}: any) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group relative cursor-zoom-in overflow-hidden rounded-lg shadow-md transition-all hover:shadow-xl">
          <Image
            src={src}
            alt={alt || "SnipGeek Image"}
            width={width || 1200}
            height={height || 675}
            className={cn(
              "h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]",
              className,
            )}
            priority={priority}
            {...props}
          />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-colors flex items-center justify-center">
            <Maximize2 className="text-white h-8 w-8 drop-shadow-lg" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent overflow-hidden flex items-center justify-center">
        <DialogTitle className="sr-only">Pratinjau Gambar</DialogTitle>
        <DialogDescription className="sr-only">
          Tampilan gambar diperbesar untuk {alt || "gambar artikel"}
        </DialogDescription>
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

const CustomImage = ({
  class: _class,
  className,
  parentName,
  priority,
  ...props
}: any) => {
  if (!props.src || typeof props.src !== "string" || props.src.trim() === "") {
    return null;
  }

  let src = props.src;
  if (src.startsWith("public/")) {
    src = src.replace("public/", "/");
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

  const platformLabelMap: Record<string, string> = {
    windows: "Windows",
    gdrive: "Google Drive",
    github: "GitHub",
    font: "Font Pack",
    software: "Software",
    driver: "Driver",
    doc: "Document",
  };

  const platformLabel = linkData.platform
    ? (platformLabelMap[linkData.platform] ?? "Download")
    : "Download";

  const platformAccentClass =
    linkData.platform === "windows"
      ? "text-blue-500 border-blue-500/30 bg-blue-500/10"
      : linkData.platform === "gdrive"
        ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
        : linkData.platform === "github"
          ? "text-slate-500 dark:text-slate-300 border-slate-500/30 bg-slate-500/10"
          : linkData.platform === "font"
            ? "text-purple-500 border-purple-500/30 bg-purple-500/10"
            : linkData.platform === "driver"
              ? "text-orange-500 border-orange-500/30 bg-orange-500/10"
              : linkData.platform === "doc"
                ? "text-sky-500 border-sky-500/30 bg-sky-500/10"
                : "text-indigo-500 border-indigo-500/30 bg-indigo-500/10";

  return (
    <span className="block my-7">
      <span className="group block rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30">
        <span className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
              platformAccentClass,
            )}
          >
            {getPlatformIcon(linkData.platform, "h-3.5 w-3.5")}
            {platformLabel}
          </span>
          {linkData.fileSize && (
            <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Size: {linkData.fileSize}
            </span>
          )}
        </span>

        <span className="mb-4 block text-sm sm:text-base font-semibold leading-snug text-foreground">
          {linkData.fileName}
        </span>

        <Link
          href={linkHref}
          rel="noopener nofollow"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full justify-center font-black uppercase tracking-wide text-[11px] h-11",
          )}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Now
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
  parentName,
  ...props
}: any) => {
  const gridCols =
    {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    }[columns as 1 | 2 | 3 | 4] || "grid-cols-1 sm:grid-cols-2";

  return (
    <div
      className={cn(
        "grid gap-4 my-8 [&>p]:m-0 [&>span]:m-0",
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

const MdxH1 = ({
  children,
  class: _class,
  className,
  parentName,
  ...props
}: any) => (
  <h1
    id={generateId(children)}
    className={cn(
      "font-headline mt-12 mb-6 font-black tracking-tighter text-primary scroll-mt-24",
      _class,
      className,
    )}
    style={{
      fontSize: "clamp(1.3rem, 1.25rem + 0.25vw, var(--sz-h1, 1.5rem))",
      lineHeight: "1.3",
      letterSpacing: "-0.02em",
    }}
    {...props}
  >
    {children}
  </h1>
);

const MdxH2 = ({
  children,
  class: _class,
  className,
  parentName,
  ...props
}: any) => (
  <div className="mt-14 mb-6 text-left">
    <h2
      id={generateId(children)}
      className={cn(
        "font-headline font-black tracking-tighter text-primary scroll-mt-24 mb-3",
        _class,
        className,
      )}
      style={{
        fontSize: "clamp(1.2rem, 1.15rem + 0.25vw, var(--sz-h2, 1.4rem))",
        lineHeight: "1.35",
        letterSpacing: "-0.015em",
      }}
      {...props}
    >
      {children}
    </h2>
    <div className="w-14 h-[3px] bg-accent rounded-full" />
  </div>
);

const MdxH3 = ({
  children,
  class: _class,
  className,
  parentName,
  ...props
}: any) => (
  <h3
    id={generateId(children)}
    className={cn(
      "font-headline mt-10 mb-3 font-bold tracking-tight text-primary scroll-mt-24",
      _class,
      className,
    )}
    style={{
      fontSize: "clamp(1.1rem, 1.05rem + 0.25vw, var(--sz-h3, 1.3rem))",
      lineHeight: "1.4",
      letterSpacing: "-0.01em",
    }}
    {...props}
  >
    {children}
  </h3>
);
const MdxH4 = ({
  children,
  class: _class,
  className,
  parentName,
  ...props
}: any) => (
  <h4
    id={generateId(children)}
    className={cn(
      "font-headline mt-8 mb-2 font-bold tracking-tight text-primary/90 scroll-mt-24",
      _class,
      className,
    )}
    style={{
      fontSize: "clamp(1rem, 0.95rem + 0.2vw, var(--sz-h4, 1.2rem))",
      lineHeight: "1.45",
      letterSpacing: "0em",
    }}
    {...props}
  >
    {children}
  </h4>
);

const MdxP = ({
  children,
  class: _class,
  className,
  parentName,
  ...props
}: any) => (
  <span className={cn("block leading-7 my-6", _class, className)} {...props}>
    {children}
  </span>
);

const MdxA = ({
  class: _class,
  className,
  parentName,
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
  parentName,
  ...props
}: any) => (
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
  parentName,
  ...props
}: any) => (
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
  parentName,
  ...props
}: any) => (
  <li className={cn(_class, className)} {...props}>
    {children}
  </li>
);
const MdxAItemOl = ({
  children,
  class: _class,
  className,
  parentName,
  ...props
}: any) => (
  <li className={cn(_class, className)} {...props}>
    {children}
  </li>
);
const MdxBlockquote = ({
  children,
  class: _class,
  className,
  parentName,
  ...props
}: any) => (
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

const MdxPre = ({
  children,
  className,
  class: _class,
  parentName,
  style,
  ...props
}: any) => (
  <pre
    className={cn(
      "rounded-lg p-6 my-6 overflow-x-auto border border-primary/5 text-[13px] leading-relaxed font-mono",
      "[&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit [&>code]:font-normal",
      _class,
      className,
    )}
    style={style}
    {...props}
  >
    {children}
  </pre>
);

const MdxHr = ({ class: _class, className, parentName, ...props }: any) => (
  <hr
    className={cn(
      "my-10 border-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent",
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
  parentName,
  ...props
}: any) => (
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
  parentName,
  ...props
}: any) => (
  <em className={cn("italic text-foreground/85", _class, className)} {...props}>
    {children}
  </em>
);

const MdxCode = ({
  children,
  class: _class,
  className,
  parentName,
  ...props
}: any) => (
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
  parentName,
  ...props
}: any) => (
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
    icon: ShieldAlert,
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
  parentName,
  ...props
}: any) => {
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
  parentName,
  ...props
}: any) => {
  const items = React.Children.toArray(children);

  return (
    <div className={cn("my-10 ml-4 space-y-0", _class, className)} {...props}>
      {items.map((child, index) => {
        if (!React.isValidElement(child)) {
          return child;
        }

        return React.cloneElement(child as React.ReactElement<any>, {
          stepNumber: index + 1,
          isLast: index === items.length - 1,
        });
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
  parentName,
  ...props
}: any) => (
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
          "mt-2 h-full w-0.5 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent",
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
  table: (props: any) => {
    const { class: _class, parentName, ...rest } = props;
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
  pre: MdxPre,
  hr: MdxHr,
  strong: MdxStrong,
  em: MdxEm,
  code: MdxCode,
  kbd: Kbd,
  details: ({
    children,
    class: _class,
    className,
    parentName,
    ...props
  }: any) => (
    <details
      className={cn(
        "my-6 rounded-xl border border-primary/10 bg-muted/20 p-4",
        _class,
        className,
      )}
      {...props}
    >
      {children}
    </details>
  ),
  summary: ({
    children,
    class: _class,
    className,
    parentName,
    ...props
  }: any) => (
    <summary
      className={cn(
        "font-headline cursor-pointer font-bold transition-colors hover:text-accent",
        _class,
        className,
      )}
      {...props}
    >
      {children}
    </summary>
  ),
  DownloadButton,
  ImageGrid,
  Callout,
  Steps,
  Step,
};
