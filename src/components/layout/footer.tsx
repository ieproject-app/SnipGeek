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
} from "lucide-react";
import { TikTokLogo } from "@/components/icons/tiktok-logo";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SnipTooltip } from "@/components/ui/snip-tooltip";

export function Footer({
  dictionary,
  translationsMap,
}: {
  dictionary: Dictionary;
  translationsMap: TranslationsMap;
}) {
  const footerNavItems = [
    {
      id: "footer-about",
      title: dictionary.navigation.about,
      href: "/about",
      icon: <User2 className="h-5 w-5" />,
      colorClass: "from-blue-600/40 to-blue-900/40",
      borderClass: "group-hover:border-blue-500/50",
      glowClass: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]",
    },
    {
      id: "footer-privacy",
      title: dictionary.navigation.privacy,
      href: "/privacy",
      icon: <ShieldCheck className="h-5 w-5" />,
      colorClass: "from-green-600/40 to-green-900/40",
      borderClass: "group-hover:border-green-500/50",
      glowClass: "group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]",
    },
    {
      id: "footer-disclaimer",
      title: dictionary.navigation.disclaimer,
      href: "/disclaimer",
      icon: <ShieldAlert className="h-5 w-5" />,
      colorClass: "from-orange-600/40 to-orange-900/40",
      borderClass: "group-hover:border-orange-500/50",
      glowClass: "group-hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]",
    },
    {
      id: "footer-contact",
      title: dictionary.navigation.contact,
      href: "/contact",
      icon: <Mail className="h-5 w-5" />,
      colorClass: "from-purple-600/40 to-purple-900/40",
      borderClass: "group-hover:border-purple-500/50",
      glowClass: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]",
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
      {/* Top Navigation Section - Links Cards */}
      <nav
        aria-label="Footer navigation"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 sm:pt-16 sm:pb-32"
      >
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {footerNavItems.map((item, index) => {
            const image = PlaceHolderImages.find((p) => p.id === item.id);
            const isTiltRight = index % 2 === 0; // 0,2 miring kanan; 1,3 miring kiri
            const tiltClass = isTiltRight ? "rotate-2" : "-rotate-2";
            
            return (
              <li key={item.id} className="list-none">
                <div className="transition-all duration-300 hover:-translate-y-1">
                    <SnipTooltip label={item.title} side="top" wrapperClassName="block w-full">
                      <Link
                        href={item.href}
                        className="block group relative"
                      >
                      <article className={cn(
                        "relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-white/10 bg-zinc-900/50 backdrop-blur-sm transition-all duration-300 ease-out group-hover:shadow-2xl",
                        "transform-gpu",
                        tiltClass,
                        item.borderClass,
                        item.glowClass
                      )}>
                        {image && (
                          <Image
                            src={image.imageUrl}
                            alt={image.description}
                            fill
                            className="object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-300"
                            sizes="(max-width: 768px) 50vw, 200px"
                          />
                        )}
                        {/* Color Tint Overlay */}
                        <div className={cn(
                          "absolute inset-0 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                          item.colorClass
                        )} />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col items-center justify-center gap-2">
                          <span className="text-accent text-6xl sm:text-8xl transition-transform duration-300 group-hover:scale-125 drop-shadow-lg">
                            {item.icon}
                          </span>
                          {/* Mobile Label - Hidden on larger screens */}
                          <span className="md:hidden text-xs font-medium text-white/80 text-center mt-1">
                            {item.title}
                          </span>
                        </div>
                      </article>
                    </Link>
                  </SnipTooltip>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sub-Footer Section */}
      <section
        aria-label="Footer details"
        className="relative w-full pt-16 pb-12 bg-gradient-to-br from-muted/40 via-background to-muted/20 border-t border-primary/5 transition-all duration-300 ease-in-out"
      >
        {/* Decorative Ambient Light Circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10 bg-primary -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10 bg-primary translate-x-1/2 translate-y-1/2" />
        </div>

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
            <h4 className="font-headline text-h3 font-bold text-foreground tracking-tight">
              {authorName}
            </h4>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto text-lg leading-relaxed font-medium animate-in fade-in duration-700">
              {dictionary.footer.authorBio}
            </p>

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
                <div className="bg-primary/90 backdrop-blur-sm rounded-full p-1.5 flex items-center gap-2 shadow-xl border border-white/5">
                  <LanguageSwitcher
                    translationsMap={translationsMap}
                    dictionary={dictionary}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="flex items-center gap-4">
                  <Link
                    href="/terms"
                    className="text-sm text-primary/40 hover:text-primary transition-colors duration-300 underline-offset-4 hover:underline"
                    aria-label={`Go to ${dictionary.navigation.terms}`}
                  >
                    {dictionary.navigation.terms}
                  </Link>
                  <span className="text-primary/20">·</span>
                  <Link
                    href="/privacy"
                    className="text-sm text-primary/40 hover:text-primary transition-colors duration-300 underline-offset-4 hover:underline"
                    aria-label={`Go to ${dictionary.navigation.privacy}`}
                  >
                    {dictionary.navigation.privacy}
                  </Link>
                </div>
                <small className="font-semibold tracking-wider text-primary/60 hover:text-primary transition-colors duration-300">
                  &copy; {new Date().getFullYear()} SnipGeek. All Rights
                  Reserved.
                </small>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </footer>
  );
}
