import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { i18n } from '@/i18n-config';
import { cn } from '@/lib/utils';

const footerNavItems = [
  { id: 'footer-about', title: 'About', href: '/about' },
  { id: 'footer-notes', title: 'Notes', href: '/notes' },
  { id: 'footer-tools', title: 'Tools', href: '/tools' },
  { id: 'footer-archive', title: 'Archive', href: '/archive' },
];

export function Footer() {
    const authorName = "SnipGeek";
    const authorBio = "A passionate developer exploring the web and sharing findings along the way.";
    const authorAvatar = "/images/profile/profile.png"; // Placeholder for local profile picture

    return (
        <footer className="w-full bg-background pt-20 sm:pt-32">
            {/* Section 1: Visual Link Gallery */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {footerNavItems.map((item, index) => {
                        const image = PlaceHolderImages.find(p => p.id === item.id);
                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "transform transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-2",
                                    (index === 0 || index === 2) && "rotate-2",
                                    (index === 1 || index === 3) && "-rotate-2"
                                )}
                            >
                                <Link href={item.href} className="block group">
                                    <article className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
                                        {image && (
                                            <Image
                                                src={image.imageUrl}
                                                alt={item.title}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
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

            {/* Section 2: Author Profile */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={authorAvatar} alt={authorName} />
                    <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <h4 className="font-headline text-2xl font-bold text-primary">{authorName}</h4>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">{authorBio}</p>
            </div>

            {/* Section 3: Standard Footer */}
            <div className="mt-16 sm:mt-24 py-8 border-t">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} {authorName}. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
}
