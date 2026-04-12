/**
 * Design System Utility Hooks and Helper Functions
 * Use these in your components to apply consistent design tokens
 */

import { designSystem } from "@/config/design-system";

/**
 * Get text style classes by type
 * @example
 * <h1 className={getTextStyle('h1')}>Heading</h1>
 */
export const getTextStyle = (
  style: keyof typeof designSystem.textStyles,
): string => {
  return designSystem.textStyles[style];
};

/**
 * Get color style classes
 * @example
 * <div className={getColorStyle('primary')}>Content</div>
 */
export const getColorStyle = (
  color: keyof typeof designSystem.colorStyles,
): string => {
  return designSystem.colorStyles[color];
};

/**
 * Combine multiple design system classes
 * @example
 * <div className={cn(getTextStyle('h1'), getColorStyle('primary'))}>
 */
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Example usage in components:
 *
 * import { getTextStyle, getColorStyle, cn } from '@/lib/design-system-utils';
 *
 * function MyComponent() {
 *   return (
 *     <div className={getColorStyle('card')}>
 *       <h1 className={cn(getTextStyle('h1'), getColorStyle('heading'))}>
 *         Welcome
 *       </h1>
 *       <p className={cn(getTextStyle('bodyRegular'), getColorStyle('body'))}>
 *         This is body text
 *       </p>
 *     </div>
 *   );
 * }
 */

/**
 * Tailwind class shortcuts for design system
 */
export const ds = {
  // Typography
  h1: "text-ds-h1 text-ds-heading font-inter",
  h1Regular: "text-ds-h1-regular text-ds-heading font-inter",
  h2: "text-ds-h2 text-ds-heading font-inter",
  h2Regular: "text-ds-h2-regular text-ds-heading font-inter",
  h3: "text-ds-h3 text-ds-heading font-inter",
  h3Regular: "text-ds-h3-regular text-ds-heading font-inter",
  h4: "text-ds-h4 text-ds-heading font-inter",
  h4Regular: "text-ds-h4-regular text-ds-heading font-inter",
  h5: "text-ds-h5 text-ds-heading font-inter",
  h5Regular: "text-ds-h5-regular text-ds-heading font-inter",
  text: "text-ds-text font-inter",
  textRegular: "text-ds-text-regular font-inter",
  body: "text-ds-body text-ds-body font-inter",
  bodyRegular: "text-ds-body-regular text-ds-body font-inter",
  small: "text-ds-small font-inter",
  smallRegular: "text-ds-small-regular font-inter",
  caption: "text-ds-caption text-ds-body font-inter",

  // Colors
  bgPrimary: "bg-ds-primary text-white",
  textPrimary: "text-ds-primary",
  bgCard: "bg-ds-card",
  borderCard: "border border-ds-card-border",
  textHeading: "text-ds-heading",
  textBody: "text-ds-body",

  // Buttons
  btnPrimary:
    "bg-ds-primary hover:bg-blue-900 text-white px-6 py-3 rounded-md font-semibold transition-colors",
  btnSecondary:
    "bg-ds-card hover:bg-gray-300 text-ds-heading px-6 py-3 rounded-md font-semibold transition-colors",
  btnOutline:
    "border-2 border-ds-primary text-ds-primary hover:bg-ds-primary hover:text-white px-6 py-3 rounded-md font-semibold transition-colors",

  // Cards
  card: "bg-ds-card border border-ds-card-border rounded-xl shadow-md",
  cardHover:
    "bg-ds-card border border-ds-card-border rounded-xl shadow-md hover:shadow-xl transition-shadow",

  // Input
  input:
    "w-full px-4 py-3 border border-ds-card-border rounded-md focus:outline-none focus:ring-2 focus:ring-ds-primary",
} as const;

export default ds;
