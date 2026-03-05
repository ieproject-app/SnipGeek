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

// Helper to generate IDs for TOC
const generateId = (children: any) => {
  const text = React.Children.toArray(children)
    .map((child) => (typeof child === "string" ? child : ""))
    .join("");

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
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  class?: string;
  parentName?: string;
}) => {
  if (props.href) {
    return (
      <Link
        href={props.href}
        className={cn(
          "font-medium text-accent underline hover:no-underline",
          _class,
          className,
        )}
      >
        {props.children}
      </Link>
    );
  }
  return <a className={cn(_class, className)} {...props} />;
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
      "mt-6 border-l-2 border-primary/20 pl-6 italic text-muted-foreground",
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
      _class,
      className,
    )}
    style={style}
    {...props}
  >
    {children}
  </pre>
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
      <span className="block my-6">
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
  details: ({
    children,
    class: _class,
    className,
    parentName,
    ...props
  }: any) => (
    <details
      className={cn(
        "my-6 p-4 rounded-lg border bg-muted/20",
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
        "font-headline font-bold cursor-pointer hover:text-accent transition-colors",
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
};
