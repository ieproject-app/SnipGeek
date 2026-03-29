"use client";

import React, { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotification } from "@/hooks/use-notification";

type CopyablePreProps = {
  children?: React.ReactNode;
  className?: string;
  class?: string;
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLPreElement>;

export function CopyablePre({
  children,
  className,
  class: _class,
  style,
  ...props
}: CopyablePreProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const { notify } = useNotification();

  const handleCopy = async () => {
    const text = preRef.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify("Copied to Clipboard", <Check className="h-4 w-4" />);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      notify("Copied to Clipboard", <Check className="h-4 w-4" />);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="group relative my-6">
      <pre
        ref={preRef}
        className={cn(
          "rounded-lg p-6 overflow-x-auto border border-primary/5 text-[13px] leading-relaxed font-mono",
          "[&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit [&>code]:font-normal",
          _class,
          className,
        )}
        style={style}
        {...props}
      >
        {children}
      </pre>

      <button
        onClick={handleCopy}
        aria-label="Copy code"
        title="Copy code"
        className={cn(
          "absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md",
          "border border-primary/10 bg-background/80 backdrop-blur-sm",
          "text-muted-foreground shadow-sm transition-all duration-200",
          "opacity-0 group-hover:opacity-100",
          "hover:border-primary/20 hover:bg-card hover:text-foreground hover:scale-105",
          copied && "opacity-100 text-emerald-500 border-emerald-500/30 bg-emerald-500/5",
        )}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
