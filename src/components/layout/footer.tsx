import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { i18n } from '@/i18n-config';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from './theme-switcher';
import type { Dictionary } from '@/lib/get-dictionary';
import { LanguageSwitcher } from './language-switcher';
import type { TranslationsMap } from '@/lib/posts';
import { Facebook, Youtube, Instagram } from 'lucide-react';
import { TikTokLogo } from '@/components/icons/tiktok-logo';
import { GooeyFooterBackground } from './gooey-footer-background';

export function Footer({ dictionary, translationsMap }: { dictionary: Dictionary, translationsMap: TranslationsMap }) {
    const footerNavItems = [
      { id: 'footer-about', title: dictionary.navigation.about, href: '/about' },
      { id: 'footer-notes', title: dictionary.navigation.notes, href: '/notes' },
      { id: 'footer-tools', title: dictionary.navigation.tools, href: '/tools' },
      { id: 'footer-contact', title: dictionary.navigation.contact, href: '/contact' },
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
        <footer className="relative w-full mt-32 overflow-visible">
            {/* Top Navigation Section - Stays transparent */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
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
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 50vw, 200px"
                                                data-ai-hint={image.imageHint}
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                        <div className="absolute bottom-0 left-0 p-4 text-white">
                                            <h3 className="font-headline text-lg font-bold">
                                                {item.title}
                                            </h3>
                                        </div>
                                    </article>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sub-Footer Section - The solid liquid base containing Profile */}
            <div className="relative w-full bg-primary text-primary-foreground pt-12 pb-12">
                {/* Gooey Liquid Effect sits right on top of this block */}
                <GooeyFooterBackground />

                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Profile Section - Positioned to cross the boundary */}
                    <div className="text-center mb-16 -mt-24">
                        <Avatar className="w-24 h-24 mx-auto mb-6 border-4 border-primary-foreground/10 shadow-2xl">
                            <AvatarImage src={authorAvatar} alt={authorName} />
                            <AvatarFallback className="bg-muted text-primary">{authorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <h4 className="font-headline text-3xl font-bold text-primary-foreground tracking-tight">{authorName}</h4>
                        <p className="mt-4 text-primary-foreground/70 max-w-md mx-auto text-lg leading-relaxed font-medium">
                            {dictionary.footer.authorBio}
                        </p>
                        
                        <div className="flex items-center justify-center gap-4 mt-8">
                            {socialLinks.map((social) => (
                                <a 
                                    key={social.label} 
                                    href={social.href} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-3 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 hover:scale-110 transition-all duration-300 shadow-sm"
                                    aria-label={social.label}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Footer Bottom: Switchers and Copyright */}
                    <div className="flex flex-col justify-center items-center gap-6 text-sm text-primary-foreground/40 border-t border-primary-foreground/10 pt-12">
                        <div className="flex items-center gap-4">
                            <LanguageSwitcher translationsMap={translationsMap} />
                            <ThemeSwitcher />
                        </div>
                        <p className="font-medium tracking-wide">&copy; {new Date().getFullYear()} SnipGeek. All Rights Reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
