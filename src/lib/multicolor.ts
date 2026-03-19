type MulticolorTheme = {
  gradient: string;
  accentBar: string;
  hoverRing: string;
  hoverShadow: string;
  hoverTitle: string;
  overlayGradient: string;
  readingButtonTone: string;
};

const MULTICOLOR_THEMES: MulticolorTheme[] = [
  {
    gradient: "from-[#1e78c5] via-[#288ed8] to-[#49a9e8]",
    accentBar: "bg-sky-400",
    hoverRing: "hover:ring-sky-500/30",
    hoverShadow: "hover:shadow-[0_16px_36px_-20px_rgba(14,116,211,0.72)]",
    hoverTitle: "group-hover:text-sky-600 dark:group-hover:text-sky-300",
    overlayGradient: "from-sky-950/45 via-sky-900/20 to-transparent",
    readingButtonTone: "text-sky-500 dark:text-sky-300",
  },
  {
    gradient: "from-[#0d8570] via-[#14967d] to-[#28b696]",
    accentBar: "bg-emerald-400",
    hoverRing: "hover:ring-emerald-500/30",
    hoverShadow: "hover:shadow-[0_16px_36px_-20px_rgba(5,150,105,0.72)]",
    hoverTitle: "group-hover:text-emerald-600 dark:group-hover:text-emerald-300",
    overlayGradient: "from-emerald-950/45 via-emerald-900/20 to-transparent",
    readingButtonTone: "text-emerald-500 dark:text-emerald-300",
  },
  {
    gradient: "from-[#b75a13] via-[#cf6b18] to-[#e58a2c]",
    accentBar: "bg-orange-400",
    hoverRing: "hover:ring-orange-500/30",
    hoverShadow: "hover:shadow-[0_16px_36px_-20px_rgba(234,88,12,0.7)]",
    hoverTitle: "group-hover:text-orange-600 dark:group-hover:text-orange-300",
    overlayGradient: "from-orange-950/45 via-orange-900/20 to-transparent",
    readingButtonTone: "text-orange-500 dark:text-orange-300",
  },
  {
    gradient: "from-[#7f325a] via-[#96406b] to-[#b05b83]",
    accentBar: "bg-rose-400",
    hoverRing: "hover:ring-rose-500/30",
    hoverShadow: "hover:shadow-[0_16px_36px_-20px_rgba(225,29,72,0.72)]",
    hoverTitle: "group-hover:text-rose-600 dark:group-hover:text-rose-300",
    overlayGradient: "from-rose-950/45 via-rose-900/20 to-transparent",
    readingButtonTone: "text-rose-500 dark:text-rose-300",
  },
  {
    gradient: "from-[#4251b7] via-[#5064d2] to-[#6d80ec]",
    accentBar: "bg-indigo-400",
    hoverRing: "hover:ring-indigo-500/30",
    hoverShadow: "hover:shadow-[0_16px_36px_-20px_rgba(79,70,229,0.72)]",
    hoverTitle: "group-hover:text-indigo-600 dark:group-hover:text-indigo-300",
    overlayGradient: "from-indigo-950/45 via-indigo-900/20 to-transparent",
    readingButtonTone: "text-indigo-500 dark:text-indigo-300",
  },
  {
    gradient: "from-[#1a6d7a] via-[#247f8f] to-[#39a0b4]",
    accentBar: "bg-cyan-400",
    hoverRing: "hover:ring-cyan-500/30",
    hoverShadow: "hover:shadow-[0_16px_36px_-20px_rgba(6,182,212,0.72)]",
    hoverTitle: "group-hover:text-cyan-600 dark:group-hover:text-cyan-300",
    overlayGradient: "from-cyan-950/45 via-cyan-900/20 to-transparent",
    readingButtonTone: "text-cyan-500 dark:text-cyan-300",
  },
  {
    gradient: "from-[#4e6f17] via-[#618a1d] to-[#7aaa2a]",
    accentBar: "bg-lime-400",
    hoverRing: "hover:ring-lime-500/30",
    hoverShadow: "hover:shadow-[0_16px_36px_-20px_rgba(132,204,22,0.72)]",
    hoverTitle: "group-hover:text-lime-600 dark:group-hover:text-lime-300",
    overlayGradient: "from-lime-950/45 via-lime-900/20 to-transparent",
    readingButtonTone: "text-lime-500 dark:text-lime-300",
  },
  {
    gradient: "from-[#6e3a8c] via-[#8350a3] to-[#9a6bba]",
    accentBar: "bg-fuchsia-400",
    hoverRing: "hover:ring-fuchsia-500/30",
    hoverShadow: "hover:shadow-[0_16px_36px_-20px_rgba(217,70,239,0.72)]",
    hoverTitle: "group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-300",
    overlayGradient: "from-fuchsia-950/45 via-fuchsia-900/20 to-transparent",
    readingButtonTone: "text-fuchsia-500 dark:text-fuchsia-300",
  },
];

function hashSeed(input: string): number {
  if (!input) return 0;

  let hash = 0;
  const normalized = input.toLowerCase();
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash) % MULTICOLOR_THEMES.length;
}

export function getMulticolorSeed(...parts: Array<string | null | undefined>): string {
  return parts
    .filter(Boolean)
    .map((part) => String(part).trim().toLowerCase())
    .join("|");
}

export function getMulticolorTheme(seed: string): MulticolorTheme {
  return MULTICOLOR_THEMES[hashSeed(seed)] || MULTICOLOR_THEMES[0];
}
