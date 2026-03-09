import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/get-dictionary";
import { LanguageSwitcher } from "./language-switcher";
import type { TranslationsMap } from "@/lib/posts";
import {
  Facebook,
  Youtube,
  Instagram,
  User2,
  ShieldCheck,
  ShieldAlert,
  Mail,
  FileText,
} from "lucide-react";
import { TikTokLogo } from "@/components/icons/tiktok-logo";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SnipTooltip } from "@/components/ui/snip-tooltip";
import { getLinkPrefix } from "@/lib/utils";

export function LayoutFooter({
  locale,
  dictionary,
  translationsMap,
}: {
  locale: string;
  dictionary: Dictionary;
  translationsMap: TranslationsMap;
}) {
  const linkPrefix = getLinkPrefix(locale);
  const footerNavItems = [
    {
      id: "footer-terms",
      title: dictionary.navigation.terms,
      href: `${linkPrefix}/terms`,
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: "footer-privacy",
      title: dictionary.navigation.privacy,
      href: `${linkPrefix}/privacy`,
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      id: "footer-disclaimer",
      title: dictionary.navigation.disclaimer,
      href: `${linkPrefix}/disclaimer`,
      icon: <ShieldAlert className="h-5 w-5" />,
    },
    {
      id: "footer-contact",
      title: dictionary.navigation.contact,
      href: `${linkPrefix}/contact`,
      icon: <Mail className="h-5 w-5" />,
    },
  ];

  const authorName = "Iwan Efendi";
  const authorAvatar = "/images/profile/profile.png";

  const socialLinks = [
    {
      icon: <Facebook className="h-5 w-5" />,
      href: "https://www.facebook.com/iwan.efendi.777",
      label: "Facebook",
    },
    {
      icon: <Youtube className="h-5 w-5" />,
      href: "https://www.youtube.com/@iwantools",
      label: "YouTube",
    },
    {
      icon: <Instagram className="h-5 w-5" />,
      href: "https://www.instagram.com/iwnefnd/",
      label: "Instagram",
    },
    {
      icon: <TikTokLogo className="h-5 w-5" />,
      href: "https://www.tiktok.com/@iwantools",
      label: "TikTok",
    },
  ];

  return (
    <footer className="relative w-full mt-16 sm:mt-24">
      {/* Sub-Footer Section */}
      <section
        aria-label="Footer details"
        className="relative w-full pt-20 pb-12 bg-card border-t border-primary/5 transition-all duration-300 ease-in-out"
      >

        {/* Bisected Avatar */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 z-20">
          <ScrollReveal
            direction="down"
            delay={0.2}
            className="relative rounded-full ring-2 ring-primary/20 ring-offset-4 ring-offset-background shadow-2xl transition-all duration-300 ease-in-out group hover:ring-primary/40"
          >
            <Avatar className="w-24 h-24 mx-auto border-4 border-background bg-background transition-transform duration-500 group-hover:scale-105">
              <AvatarImage src={authorAvatar} alt={authorName} />
              <AvatarFallback className="bg-muted text-primary">
                {authorName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </ScrollReveal>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal
            direction="up"
            delay={0.3}
            className="text-center mb-12"
          >
            <h4 className="font-display text-2xl font-bold text-foreground tracking-tight">
              {authorName}
            </h4>
            <p className="mt-2 text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed font-medium animate-in fade-in duration-700">
              {dictionary.footer.authorBio}
            </p>

            <div className="mt-6 flex justify-center">
              <Link
                href={`${linkPrefix}/about`}
                className="group/btn relative inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/10 text-primary text-[13px] font-bold transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 shadow-sm"
              >
                <User2 className="h-4 w-4" />
                <span>{dictionary.footer.viewProfile}</span>
              </Link>
            </div>

            {/* Social Links */}
            <ul
              className="flex items-center justify-center gap-4 mt-8"
              aria-label="Social links"
            >
              {socialLinks.map((social, index) => {
                const brandStyles: Record<string, string> = {
                  Facebook:
                    "hover:shadow-[0_0_20px_rgba(59,89,152,0.5)] hover:bg-[#3b5998]",
                  YouTube:
                    "hover:shadow-[0_0_20px_rgba(255,0,0,0.5)] hover:bg-[#ff0000]",
                  Instagram:
                    "hover:shadow-[0_0_20px_rgba(225,48,108,0.5)] hover:bg-[#e1306c]",
                  TikTok:
                    "hover:shadow-[0_0_20px_rgba(0,242,234,0.5)] hover:bg-[#00f2ea] hover:text-black",
                };
                const brandStyle =
                  brandStyles[social.label] ||
                  "hover:bg-accent hover:text-primary";

                return (
                  <li key={social.label}>
                    <ScrollReveal direction="up" delay={0.4 + index * 0.1}>
                      <SnipTooltip label={social.label} side="top">
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={social.label}
                          className={cn(
                            "relative inline-flex p-3 rounded-full bg-primary/90 text-primary-foreground shadow-md transition-all duration-300 ease-in-out",
                            "hover:-translate-y-1 hover:scale-105",
                            brandStyle,
                          )}
                          aria-label={social.label}
                        >
                          {social.icon}
                        </a>
                      </SnipTooltip>
                    </ScrollReveal>
                  </li>
                );
              })}
            </ul>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.6}>
            <div className="flex flex-col justify-center items-center gap-6 text-sm text-primary/80 border-t border-primary/10 pt-12 mt-12">
              <div className="flex items-center gap-4">
                <LanguageSwitcher
                  translationsMap={translationsMap}
                  dictionary={dictionary}
                  variant="minimal"
                />
              </div>
              <div className="flex flex-col items-center justify-center gap-5 text-center">
                <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-6 py-2.5 rounded-full bg-muted/20 border border-primary/5 backdrop-blur-sm">
                  {footerNavItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-accent transition-all duration-300"
                    >
                      {item.title}
                    </Link>
                  ))}
                </nav>
                <div className="flex flex-row items-center gap-2">
                  <small className="font-extrabold tracking-widest text-[10px] uppercase text-primary/30 hover:text-primary transition-colors duration-300">
                    &copy; {new Date().getFullYear()} SnipGeek. All Rights Reserved.
                  </small>
                  <a
                    href="#"
                    className="text-[10px] font-black uppercase tracking-widest text-primary/30 hover:text-primary transition-colors duration-300"
                    aria-label="Back to top"
                  >
                    Back to Top
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </footer>
  );
}
