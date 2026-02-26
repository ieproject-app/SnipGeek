import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { i18n } from '@/i18n-config';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/lib/get-dictionary';
import { LanguageSwitcher } from './language-switcher';
import type { TranslationsMap } from '@/lib/posts';
import { Facebook, Youtube, Instagram, User2, StickyNote, LayoutGrid, Mail } from 'lucide-react';
import { TikTokLogo } from '@/components/icons/tiktok-logo';

export function Footer({ dictionary, translationsMap }: { dictionary: Dictionary, translationsMap: TranslationsMap }) {
    const footerNavItems = [
      { id: 'footer-about', title: dictionary.navigation.about, href: '/about', icon: <User2 className="h-5 w-5" /> },
      { id: 'footer-notes', title: dictionary.navigation.notes, href: '/notes', icon: <StickyNote className="h-5 w-5" /> },
      { id: 'footer-tools', title: dictionary.navigation.tools, href: '/tools', icon: <LayoutGrid className="h-5 w-5" /> },
      { id: 'footer-contact', title: dictionary.navigation.contact, href: '/contact', icon: <Mail className="h-5 w-5" /> },
    ];

    const authorName = "Iwan Efendi";
    const authorAvatar = "/images/profile/profile.png";

    const socialLinks = [
        { icon: <Facebook className="h-5 w-5" />, href: "https://www.facebook.com/iwan.efendi.777", label: "Facebook" },
        { icon: <Youtube className="h-5 w-5" />, href: "https://www.youtube.com/@iwantools", label: "YouTube" },
        { icon: <Instagram className="h-5 w-5" />, href: "https://www.instagram.com/iwnefnd/", label: "Instagram" },
        { icon: <TikTokLogo className="h-5 w-5" />, href: "https://www.tiktok.com/@iwantools", label: "TikTok" },
    ];

    return (
        <footer className="relative w-full mt-32">
            {/* Top Navigation Section - Links Cards */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {footerNavItems.map((item, index) => {
                        const image = PlaceHolderImages.find(p => p.id === item.id);
                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "transform transition-all duration-300 ease-in-out hover:-translate-y-2 will-change-transform",
                                    (index === 0 || index === 2) && "rotate-2",
                                    (index === 1 || index === 3) && "-rotate-2"
                                )}
                            >
                                <Link href={item.href} className="block group">
                                    <article className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-lg transition-shadow group-hover:shadow-2xl">
                                        {image && (
                                            <Image
                                                src={image.imageUrl}
                                                alt={image.description}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 50vw, 200px"
                                                data-ai-hint={image.imageHint}
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                        <div className="absolute bottom-0 left-0 p-4 text-white">
                                            <h3 className="font-headline text-lg font-bold flex items-center gap-2">
                                                {item.icon}
                                                <span>{item.title}</span>
                                            </h3>
                                        </div>
                                    </article>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Wave Divider */}
            <div className="relative w-full overflow-hidden leading-none -mb-1">
                <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 sm:h-20 fill-muted/30">
                    <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
                </svg>
            </div>

            {/* Sub-Footer Section */}
            <div className="relative w-full pt-0 pb-12 bg-gradient-to-br from-muted/40 via-background to-muted/20 overflow-hidden transition-all duration-300 ease-in-out">
                {/* Decorative Ambient Light Circles */}
                <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10 bg-primary -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10 bg-primary translate-x-1/2 translate-y-1/2 pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 -mt-24">
                        {/* Premium Avatar with Halo Effect */}
                        <div className="relative inline-block rounded-full ring-2 ring-primary/20 ring-offset-4 ring-offset-background shadow-2xl mb-6 transition-all duration-300 ease-in-out group hover:ring-primary/40">
                            <Avatar className="w-24 h-24 mx-auto border-4 border-background bg-background transition-transform duration-500 group-hover:scale-105">
                                <AvatarImage src={authorAvatar} alt={authorName} />
                                <AvatarFallback className="bg-muted text-primary">{authorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                        </div>
                        
                        <h4 className="font-headline text-3xl font-bold text-foreground tracking-tight">{authorName}</h4>
                        <p className="mt-4 text-muted-foreground max-w-md mx-auto text-lg leading-relaxed font-medium opacity-0 animate-in fade-in duration-700 fill-mode-forwards">
                            {dictionary.footer.authorBio}
                        </p>
                        
                        {/* Social Links with Tooltips and Brand-Specific Glow */}
                        <div className="flex items-center justify-center gap-4 mt-8">
                            {socialLinks.map((social) => {
                                const brandStyles: Record<string, string> = {
                                    "Facebook": "hover:shadow-[0_0_20px_rgba(59,89,152,0.5)] hover:bg-[#3b5998]",
                                    "YouTube": "hover:shadow-[0_0_20px_rgba(255,0,0,0.5)] hover:bg-[#ff0000]",
                                    "Instagram": "hover:shadow-[0_0_20px_rgba(225,48,108,0.5)] hover:bg-[#e1306c]",
                                    "TikTok": "hover:shadow-[0_0_20px_rgba(0,242,234,0.5)] hover:bg-[#00f2ea] hover:text-black",
                                };
                                const brandStyle = brandStyles[social.label] || "hover:bg-accent hover:text-primary";

                                return (
                                    <a 
                                        key={social.label} 
                                        href={social.href} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={cn(
                                            "group relative p-3 rounded-full bg-primary/90 text-primary-foreground shadow-md transition-all duration-300 ease-in-out",
                                            "hover:-translate-y-1 hover:scale-115",
                                            brandStyle
                                        )}
                                        aria-label={social.label}
                                    >
                                        {/* Tooltip Label */}
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:-translate-y-3 transition-all duration-300 pointer-events-none whitespace-nowrap z-20">
                                            {social.label}
                                        </span>
                                        {social.icon}
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col justify-center items-center gap-6 text-sm text-muted-foreground/60 border-t pt-12">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/90 backdrop-blur-sm rounded-full p-1.5 flex items-center gap-2 shadow-xl border border-white/5">
                                <LanguageSwitcher translationsMap={translationsMap} dictionary={dictionary} />
                            </div>
                        </div>
                        <p className="font-medium tracking-wide">&copy; {new Date().getFullYear()} SnipGeek. All Rights Reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}