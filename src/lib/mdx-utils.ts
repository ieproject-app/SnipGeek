
/**
 * Shared heading slug function — used by both extractHeadings (server) and
 * MdxH2/H3 components (client) so DOM ids and TOC anchor hrefs always match.
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function stripMdxSyntax(content: string): string {
  return content
    .replace(/^---[\s\S]*?---\n?/m, '')           // frontmatter
    .replace(/^import\s.+$/gm, '')                 // import statements
    .replace(/^export\s.+$/gm, '')                 // export statements
    .replace(/```[\s\S]*?```/g, '')                // fenced code blocks
    .replace(/<[A-Z][A-Za-z]*[^>]*>[\s\S]*?<\/[A-Z][A-Za-z]*>/g, '') // JSX components
    .replace(/<[A-Z][A-Za-z]*[^>]*\/>/g, '')        // self-closing JSX
    .replace(/<[^>]+>/g, '')                       // remaining HTML/JSX tags
    .replace(/!\[.*?\]\(.*?\)/g, '')               // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')       // links → keep text
    .replace(/`[^`]+`/g, '')                       // inline code
    .replace(/^#{1,6}\s+/gm, '')                   // heading markers
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')       // bold/italic
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')         // underscore bold/italic
    .replace(/^>\s+/gm, '')                        // blockquotes
    .replace(/^[-*_]{3,}\s*$/gm, '')               // horizontal rules
    .replace(/\s+/g, ' ')
    .trim();
}

export type Heading = {
  id: string;
  text: string;
  level: number;
};

export function extractHeadings(content: string): Heading[] {
  // Regex to find H2 and H3 headings
  // Matches: ## Heading Text or ### Heading Text
  const headingRegex = /^(#{2,3})\s+(.*)$/gm;
  const headings: Heading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    // Create a slug-friendly ID that handles unicode (e.g. Indonesian chars)
    const id = slugifyHeading(text);

    headings.push({ id, text, level });
  }

  return headings;
}
