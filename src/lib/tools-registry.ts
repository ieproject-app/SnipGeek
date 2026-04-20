/**
 * Central registry of every tool page under `/tools/*`.
 * Used by the admin index-monitor dashboard to build the URL inventory.
 *
 * NOTE: Tools are React pages (not MDX), so they must be listed manually here.
 * When you ship a new tool under `src/app/[locale]/tools/<slug>/`, add its slug
 * to this list so the dashboard picks it up.
 */

export type ToolRegistryEntry = {
  /** URL slug under `/tools/<slug>` */
  slug: string;
  /** Display label for the dashboard */
  label: string;
  /** If true, the tool is gated behind login and not indexed by Google. */
  requiresAuth?: boolean;
  /** If true, the tool is not yet live in production. */
  devOnly?: boolean;
};

export const toolsRegistry: ToolRegistryEntry[] = [
  // Public tools — crawlable
  { slug: "bios-keys-boot-menu", label: "BIOS Keys & Boot Menu" },
  { slug: "spin-wheel", label: "Spin Wheel" },
  { slug: "image-crop", label: "Image Crop" },
  { slug: "random-name-picker", label: "Random Name Picker" },
  { slug: "laptop-service-estimator", label: "Laptop Service Estimator" },
  { slug: "prompt-generator", label: "Prompt Generator" },

  // Internal tools — gated, do NOT count toward index monitoring by default
  { slug: "employee-history", label: "Employee History", requiresAuth: true },
  { slug: "number-generator", label: "Number Generator", requiresAuth: true },
  {
    slug: "signatories-index",
    label: "Signatories Index",
    requiresAuth: true,
    devOnly: true,
  },
  {
    slug: "compress-pdf",
    label: "Compress PDF",
    requiresAuth: true,
    devOnly: true,
  },
  {
    slug: "address-label-generator",
    label: "Address Label Generator",
    requiresAuth: true,
    devOnly: true,
  },
];
