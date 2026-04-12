
import levenshtein from 'fast-levenshtein';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

// --- Type Definitions ---

export type SearchMode = 'fast' | 'accurate' | 'structural';

export interface SearchResult {
  page: number;
  snippet: string;
  hasKeyword?: boolean;
}

export interface SearchParams {
  name: string;
  pageNumber: number;
  pageText: string;
  pageTextItems: TextItem[];
}

const SIGNATURE_KEYWORDS = [
    'hormat saya', 'sincerely', 'regards', 'best regards', 'yours truly',
    'tertanda', 'signed',
    'mengetahui', 'approved by', 'acknowledged by',
    'menyetujui', 'agreed by',
    'direktur', 'director',
    'manajer', 'manager',
    'kepala', 'head of',
    'pemohon', 'applicant',
    'kuasa', 'attorney',
];

const EXCLUSION_KEYWORDS_STRUCTURAL = ['nama', 'loker', 'posisi', 'jabatan'];

// --- Helper Functions ---

const fuzzySearch = (haystack: string, needle: string, tolerance: number): { index: number; distance: number }[] => {
    const results = [];
    const needleLower = needle.toLowerCase();
    const haystackLower = haystack.toLowerCase();
    
    for (let i = 0; i <= haystack.length - needle.length; i++) {
        const sub = haystackLower.substring(i, i + needle.length);
        const distance = levenshtein.get(sub, needleLower);

        if (distance <= tolerance) {
            results.push({ index: i, distance });
            i += needle.length -1;
        }
    }
    return results;
}

const reconstructTextFromItems = (items: (TextItem | TextMarkedContent)[]): string => {
    if (!items || items.length === 0) return '';
    let text = '';
    const sortedItems = (items.filter(item => 'str' in item) as TextItem[]).sort((a, b) => {
        const yDiff = a.transform[5] - b.transform[5];
        if (Math.abs(yDiff) > 5) return -yDiff;
        return a.transform[4] - b.transform[4];
    });

    for (const item of sortedItems) {
        text += item.str;
    }
    return text;
};

// --- Search Strategy Implementations ---

/**
 * Finds all occurrences of a name with fuzzy matching. Most flexible, but may have false positives.
 */
function fastSearch({ name, pageNumber, pageText }: Omit<SearchParams, 'pageTextItems'>): SearchResult[] {
  const results: SearchResult[] = [];
  const nameLower = name.toLowerCase();
  const tolerance = Math.floor(nameLower.length / 5);
  const matches = fuzzySearch(pageText, nameLower, tolerance);

  for (const match of matches) {
      const snippetStart = Math.max(0, match.index - 40);
      const snippetEnd = Math.min(pageText.length, match.index + name.length + 40);
      const snippet = `...${pageText.substring(snippetStart, snippetEnd)}...`;
      results.push({ page: pageNumber, snippet, hasKeyword: true });
  }
  return results;
}

/**
 * Looks for names near signature-related keywords. Good balance of accuracy and scope.
 */
function accurateSearch({ name, pageNumber, pageText }: Omit<SearchParams, 'pageTextItems'>): SearchResult[] {
    const results: SearchResult[] = [];
    const nameLower = name.toLowerCase();
    const tolerance = Math.floor(nameLower.length / 5);
    const matches = fuzzySearch(pageText, nameLower, tolerance);

    for (const match of matches) {
        const contextWindow = 100;
        const contextStart = Math.max(0, match.index - contextWindow);
        const contextEnd = Math.min(pageText.length, match.index + name.length + contextWindow);
        const contextText = pageText.substring(contextStart, contextEnd).toLowerCase();

        const hasKeyword = SIGNATURE_KEYWORDS.some(keyword => contextText.includes(keyword));
        
        if (hasKeyword) {
            const snippetStart = Math.max(0, match.index - 40);
            const snippetEnd = Math.min(pageText.length, match.index + name.length + 40);
            const snippet = `...${pageText.substring(snippetStart, snippetEnd)}...`;
            results.push({ page: pageNumber, snippet, hasKeyword: true });
        }
    }
    return results;
}

/**
 * Only finds names that have a NIK/NIP number directly below them and are not part of a list/table. Very accurate.
 */
function structuralSearch({ name, pageNumber, pageTextItems }: Omit<SearchParams, 'pageText'>): SearchResult[] {
    const results: SearchResult[] = [];
    const nameLower = name.toLowerCase();

    // 1. Reconstruct page into lines with coordinate info
    const lines: { text: string; y: number; items: TextItem[] }[] = [];
    if (pageTextItems.length > 0) {
        let currentLineItems: TextItem[] = [];
        // Sort top-to-bottom, then left-to-right
        const sortedItems = [...pageTextItems].sort((a, b) => {
            const yDiff = b.transform[5] - a.transform[5];
            if (Math.abs(yDiff) > 5) return yDiff;
            return a.transform[4] - b.transform[4];
        });
        
        if (sortedItems.length > 0) {
           let lastY = sortedItems[0].transform[5];
            for (const item of sortedItems) {
                if (Math.abs(item.transform[5] - lastY) > 5 && currentLineItems.length > 0) {
                    lines.push({ text: currentLineItems.map(i => i.str).join(''), y: lastY, items: currentLineItems });
                    currentLineItems = [];
                }
                currentLineItems.push(item);
                lastY = item.transform[5];
            }
            if (currentLineItems.length > 0) {
                lines.push({ text: currentLineItems.map(i => i.str).join(''), y: lastY, items: currentLineItems });
            }
        }
    }
    
    // 2. Iterate through lines to find structural matches
    for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i];
        const lineTextLower = currentLine.text.toLowerCase();

        if (fuzzySearch(lineTextLower, nameLower, 1).length > 0) {

            // Exclusion Rule 1: Check for list prefixes
            if (/^\s*(\d+\.|\w+\.|•|-)\s/.test(currentLine.text)) {
                continue;
            }

            // Exclusion Rule 2: Check for table-like keywords on the same line
            const hasExclusionKeyword = EXCLUSION_KEYWORDS_STRUCTURAL.some(keyword =>
                lineTextLower.includes(`${keyword}`)
            );
            if (hasExclusionKeyword) {
                continue;
            }

            // Validation Rule: Check next 1-2 lines for NIK/NIP
            for (let offset = 1; offset <= 2 && i + offset < lines.length; offset++) {
                const nextLine = lines[i + offset];
                const nextLineTextLower = nextLine.text.toLowerCase();
                
                // Check vertical distance is reasonable
                if (Math.abs(currentLine.y - nextLine.y) > 50) break;

                if (/\b(nik|nip)\b/.test(nextLineTextLower)) {
                    const snippet = `...${currentLine.text}\n${nextLine.text}...`;
                    results.push({ page: pageNumber, snippet, hasKeyword: true });
                    break; 
                }
            }
        }
    }

    return results;
}


// --- Main Export ---

export const searchStrategies: Record<SearchMode, (params: SearchParams) => SearchResult[]> & { reconstructTextFromItems: typeof reconstructTextFromItems } = {
  fast: fastSearch,
  accurate: accurateSearch,
  structural: structuralSearch,
  reconstructTextFromItems: reconstructTextFromItems,
};
