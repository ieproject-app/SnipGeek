/**
 * Centralized localStorage key constants for SnipGeek.
 *
 * Always use these constants instead of raw string literals when reading
 * from or writing to localStorage. This prevents typo-related bugs and
 * makes key names easy to find/update in one place.
 */
export const STORAGE_KEYS = {
  /** Persisted reading list items (array of ReadingListItem, JSON-serialized). */
  READING_LIST: "readingList",

  /**
   * Unix timestamp (ms) after which the manual theme override expires.
   * Only present when the user has manually chosen "light" or "dark".
   * Absent when the user is on "system" mode.
   */
  THEME_MANUAL_EXPIRE: "snipgeek-theme-manual-expire",

  /**
   * The active theme string stored by next-themes.
   * Values: "light" | "dark" | "system"
   */
  THEME: "theme",

  /**
   * The user-preferred locale cookie key used by Next.js middleware
   * to remember the chosen language across sessions.
   * Values: "en" | "id"
   */
  LOCALE: "NEXT_LOCALE",

  /**
   * Active tab in the Image Crop tool.
   * Values: "crop" | "rename"
   */
  IMAGE_CROP_TAB: "snipgeek-image-crop-tab",

  /**
   * Active article image type in the Batch Rename tab.
   * Values: "body" | "gallery" | "grid"
   */
  IMAGE_RENAME_TYPE: "snipgeek-image-rename-type",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
