import type { MDXComponents } from 'next-mdx-remote/rsc/types'
import Image from 'next/image'
import Link from 'next/link'

export const mdxComponents: MDXComponents = {
    h1: ({ children }) => <h1 className="font-headline mt-12 mb-6 text-4xl font-bold tracking-tighter text-primary">{children}</h1>,
    h2: ({ children }) => <h2 className="font-headline mt-10 mb-5 border-b pb-2 text-3xl font-bold tracking-tighter text-primary">{children}</h2>,
    h3: ({ children }) => <h3 className="font-headline mt-8 mb-4 text-2xl font-bold tracking-tighter text-primary">{children}</h3>,
    h4: ({ children }) => <h4 className="font-headline mt-6 mb-3 text-xl font-bold tracking-tighter text-primary">{children}</h4>,
    p: ({ children }) => <p className="leading-7 my-6">{children}</p>,
    a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      if (props.href) {
        return <Link href={props.href} className="font-medium text-accent-foreground underline hover:no-underline">{props.children}</Link>;
      }
      return <a {...props} />;
    },
    ul: ({ children }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>,
    ol: ({ children }) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}ol>,
    li: ({ children }) => <li>{children}</li>,
    blockquote: ({ children }) => <blockquote className="mt-6 border-l-2 border-primary/20 pl-6 italic text-muted-foreground">{children}</blockquote>,
    pre: (props) => (
      <pre className="font-code my-6 rounded-lg overflow-x-auto" {...props} />
    ),
    code: (props: any) => {
      // Check if this is a code block processed by rehype-pretty-code
      const isCodeBlock = props.className?.includes('language-');
      
      // If it's a code block, let the plugin's styles apply without interference.
      if (isCodeBlock) {
        return <code {...props} />;
      }
      
      // Otherwise, it's an inline code snippet, so apply our custom styling.
      return <code className="font-code relative rounded bg-muted px-[0.4rem] py-[0.2rem] font-mono text-sm font-semibold" {...props} />;
    },
    Image: (props: any) => (
        <div className="my-8">
            <Image
                className="rounded-lg shadow-md"
                sizes="100vw"
                style={{ width: '100%', height: 'auto' }}
                {...props}
            />
        </div>
    ),
}
