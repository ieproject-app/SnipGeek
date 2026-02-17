
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
    // Create a slug-friendly ID
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    headings.push({ id, text, level });
  }

  return headings;
}
