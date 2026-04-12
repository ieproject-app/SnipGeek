export type SeparatorType = "newline" | "comma" | "semicolon";

export const getSeparatorPattern = (sep: SeparatorType): RegExp => {
  switch (sep) {
    case "comma": return /\s*,\s*/;
    case "semicolon": return /\s*;\s*/;
    case "newline":
    default:
      return /\s*\n\s*/;
  }
};

export const cryptoRandom = (): number => {
  try {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / 4294967296;
  } catch {
    return Math.random();
  }
};

export const sample = (arr: string[], k: number): string[] => {
  const a = [...arr];
  let i = arr.length;
  let n = Math.min(k, i);
  const result = new Array(n);
  while (n--) {
    const j = Math.floor(cryptoRandom() * i);
    result[n] = a[j];
    a.splice(j, 1);
    i--;
  }
  return result;
};

export interface SavedList {
  name: string;
  names: string[];
  timestamp: number;
}

export interface HistoryEntry {
  winners: string[];
  timestamp: number;
  totalNames: number;
}
