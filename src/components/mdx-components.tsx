import type { MDXComponents } from 'next-mdx-remote/rsc/types'
import Image from 'next/image'
import Link from 'next/link'

// This component handles how `<code>` tags are rendered.
const CustomCode = (props: any) => {
  const isCodeBlock = props.className?.includes('language-');

  if (isCodeBlock) {
    // For code blocks, rehype-pretty-code has already done the syntax highlighting.
    // It passes the necessary props to `code`. We just render it.
    // The parent <pre> tag is handled by CustomPre.
    return <code {...props} />;
  }

  // For inline code, we apply our own simple styling.
  return <code className="font-code relative rounded bg-muted px-[0.4rem] py-[0.2rem] font-mono text-sm font-semibold" {...props} />;
}

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

// This component handles the outer container for code blocks.
const CustomPre = (props: any) => {
  // rehype-pretty-code injects its own <pre> with styles.
  // We pass the props through and only add margin for layout.
  // This lets the theme from rehype-pretty-code control the background, padding, and font.
  return <pre className="my-6" {...props} />;
}

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
    pre: CustomPre,
    code: CustomCode,
    Image: CustomImage,
}
