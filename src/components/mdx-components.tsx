import type { MDXComponents } from 'next-mdx-remote/rsc/types'
import Image from 'next/image'
import Link from 'next/link'

// This component handles how `<img>` tags are rendered via MDX.
const CustomImage = (props: any) => (
    <div className="my-8">
        <Image
            className="rounded-lg shadow-md"
            sizes="100vw"
            style={{ width: '100%', height: 'auto' }}
            {...props}
        />
    </div>
);

// We define all the custom components outside of the main object
// to avoid the weird parser issues from the build tool.
const MdxH1 = ({ children }: { children?: React.ReactNode }) => <h1 className="font-headline mt-12 mb-6 text-4xl font-bold tracking-tighter text-primary">{children}</h1>;
const MdxH2 = ({ children }: { children?: React.ReactNode }) => <h2 className="font-headline mt-10 mb-5 border-b pb-2 text-3xl font-bold tracking-tighter text-primary">{children}</h2>;
const MdxH3 = ({ children }: { children?: React.ReactNode }) => <h3 className="font-headline mt-8 mb-4 text-2xl font-bold tracking-tighter text-primary">{children}</h3>;
const MdxH4 = ({ children }: { children?: React.ReactNode }) => <h4 className="font-headline mt-6 mb-3 text-xl font-bold tracking-tighter text-primary">{children}</h4>;
const MdxP = ({ children }: { children?: React.ReactNode }) => <p className="leading-7 my-6">{children}</p>;
const MdxA = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  if (props.href) {
    // Handle internal and external links differently if needed
    return <Link href={props.href} className="font-medium text-accent-foreground underline hover:no-underline">{props.children}</Link>;
  }
  return <a {...props} />;
};
const MdxUl = ({ children }: { children?: React.ReactNode }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>;
const MdxOl = ({ children }: { children?: React.ReactNode }) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>;
const MdxLi = ({ children }: { children?: React.ReactNode }) => <li>{children}</li>;
const MdxBlockquote = ({ children }: { children?: React.ReactNode }) => <blockquote className="mt-6 border-l-2 border-primary/20 pl-6 italic text-muted-foreground">{children}</blockquote>;
const MdxPre = (props: React.HTMLAttributes<HTMLPreElement>) => <pre className="font-code bg-muted text-card-foreground p-4 rounded-lg overflow-x-auto my-6" {...props} />;


export const mdxComponents: MDXComponents = {
    h1: MdxH1,
    h2: MdxH2,
    h3: MdxH3,
    h4: MdxH4,
    p: MdxP,
    a: MdxA,
    ul: MdxUl,
    ol: MdxOl,
    li: MdxLi,
    blockquote: MdxBlockquote,
    pre: MdxPre,
    img: CustomImage,
}
