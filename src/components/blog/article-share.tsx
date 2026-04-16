"use client";

import { usePathname } from "next/navigation";
import {
  Send,
  MessageCircle,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { FacebookLogo } from "@/components/icons/facebook-logo";
import { LinkedinLogo } from "@/components/icons/linkedin-logo";
import { XLogo } from "@/components/icons/x-logo";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SnipTooltip } from "@/components/ui/snip-tooltip";

interface ArticleShareProps {
  title: string;
  imageUrl?: string;
}

// TODO: Replace with your actual production domain
const productionUrl = "https://snipgeek.com";

export function ArticleShare({ title }: ArticleShareProps) {
  const pathname = usePathname();
  const [currentUrl, setCurrentUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Ensure this runs only on the client
    setCurrentUrl(`${productionUrl}${pathname}`);
  }, [pathname]);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!currentUrl) {
    return null;
  }

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);

  const shareButtons = [
    {
      id: "twitter",
      label: "X",
      icon: XLogo,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      hoverClass: "hover:bg-foreground hover:text-background",
      shadowClass:
        "group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] dark:group-hover:shadow-[0_8px_20px_rgba(255,255,255,0.1)]",
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: FacebookLogo,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      hoverClass: "hover:bg-[#1877F2] hover:text-white",
      shadowClass: "group-hover:shadow-[0_8px_20px_rgba(24,119,242,0.4)]",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: LinkedinLogo,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      hoverClass: "hover:bg-[#0A66C2] hover:text-white",
      shadowClass: "group-hover:shadow-[0_8px_20px_rgba(10,102,194,0.4)]",
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: Send,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      hoverClass: "hover:bg-[#229ED9] hover:text-white",
      shadowClass: "group-hover:shadow-[0_8px_20px_rgba(34,158,217,0.4)]",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      hoverClass: "hover:bg-[#25D366] hover:text-white",
      shadowClass: "group-hover:shadow-[0_8px_20px_rgba(37,211,102,0.4)]",
    },
    {
      id: "copy",
      label: copied ? "Copied!" : "Copy",
      icon: copied ? Check : LinkIcon,
      onClick: handleCopy,
      hoverClass: copied
        ? "bg-emerald-500 text-white"
        : "hover:bg-emerald-500 hover:text-white",
      shadowClass: "group-hover:shadow-[0_8px_20px_rgba(16,185,129,0.4)]",
    },
  ];

  return (
    <div className="group/container relative flex items-center justify-center p-1.5 rounded-full border border-primary/10 bg-card/30 backdrop-blur-md shadow-sm max-w-sm mx-auto">
      {shareButtons.map((btn, index) => (
        <div key={btn.id} className="flex items-center flex-1">
          {btn.href ? (
            <div className="group relative flex-1">
              <SnipTooltip label={btn.label} side="top">
                <a
                  href={btn.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center py-4 px-2 rounded-full transition-all duration-300",
                    "text-muted-foreground hover:-translate-y-1.5 hover:scale-110 hover:rotate-3",
                    btn.hoverClass,
                    btn.shadowClass,
                  )}
                  aria-label={`Share on ${btn.label}`}
                >
                  <btn.icon className="h-5 w-5 transition-transform duration-300" />
                </a>
              </SnipTooltip>
            </div>
          ) : (
            <div className="group relative flex-1">
              <SnipTooltip label={btn.label} side="top">
                <button
                  onClick={btn.onClick}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center py-4 px-2 rounded-full transition-all duration-300",
                    "text-muted-foreground hover:-translate-y-1.5 hover:scale-110 hover:rotate-3",
                    btn.hoverClass,
                    btn.shadowClass,
                    btn.id === "copy" && copied && "bg-emerald-500 text-white",
                  )}
                  aria-label={btn.label}
                >
                  <btn.icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-300",
                      btn.id === "copy" && copied && "text-white",
                    )}
                  />
                </button>
              </SnipTooltip>
            </div>
          )}

          {/* Animated Divider */}
          {index < shareButtons.length - 1 && (
            <div className="w-px h-8 bg-primary/10 transition-opacity duration-300 group-hover/container:opacity-0" />
          )}
        </div>
      ))}
    </div>
  );
}
