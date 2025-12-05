/**
 * Design System Configuration
 * Central design tokens for colors, typography, spacing, etc.
 */

// Color Palette - Based on brand guidelines
export const colors = {
  // Primary Colors
  primary: '#1a2f5a', // Primary colour (Dark Navy Blue)
  
  // Secondary Colors
  boarder: '#e5e5e5', // Boarder colour (Light Gray)
  cards: '#ffffff', // Cards colour (White)
  
  // Accent Colors
  cardsBoarder: '#e0e0e0', // cards Boarder colour (Light Border Gray)
  icon: '#0C1536', // Icon colour (Cyan/Turquoise)
  
 

  heading: '#000000', // Heading Text (Black)
  body: '#4a5568', // Body copy Text (Dark Gray)
} as const;

// Typography Scale using Inter font family
export const typography = {
  fontFamily: {
    primary: 'Inter, system-ui, -apple-system, sans-serif',
  },
  
  // Desktop Typography
  desktop: {
    heading1: {
      semi: {
        fontSize: '48px', // 3rem
        lineHeight: '1.2',
        fontWeight: 600,
        letterSpacing: '-2%',
        spacing: '-2%',
      },
      regular: {
        fontSize: '32px', // 2xl
        lineHeight: '1.3',
        fontWeight: 400,
      },
    },
    heading2: {
      semi: {
        fontSize: '40px', // 2.5rem
        lineHeight: '1.2',
        fontWeight: 600,
      },
      regular: {
        fontSize: '28px', // xl
        lineHeight: '1.4',
        fontWeight: 400,
      },
    },
    heading3: {
      semi: {
        fontSize: '32px', // 2rem
        lineHeight: '1.25',
        fontWeight: 600,
      },
      regular: {
        fontSize: '24px', // l
        lineHeight: '1.5',
        fontWeight: 400,
      },
    },
    heading4: {
      semi: {
        fontSize: '24px', // 1.5rem
        lineHeight: '1.3',
        fontWeight: 600,
      },
      regular: {
        fontSize: '20px', // m
        lineHeight: '1.5',
        fontWeight: 400,
      },
    },
    heading5: {
      semi: {
        fontSize: '20px', // 1.25rem
        lineHeight: '1.4',
        fontWeight: 600,
      },
      regular: {
        fontSize: '18px', // s
        lineHeight: '1.5',
        fontWeight: 400,
      },
    },
    text: {
      semi: {
        fontSize: '16px', // 1rem
        lineHeight: '1.5',
        fontWeight: 600,
      },
      regular: {
        fontSize: '16px',
        lineHeight: '1.5',
        fontWeight: 400,
      },
    },
    body: {
      semi: {
        fontSize: '14px', // 0.875rem
        lineHeight: '1.5',
        fontWeight: 600,
      },
      regular: {
        fontSize: '14px',
        lineHeight: '1.5',
        fontWeight: 400,
      },
    },
    small: {
      semi: {
        fontSize: '12px', // 0.75rem
        lineHeight: '1.5',
        fontWeight: 600,
      },
      regular: {
        fontSize: '12px',
        lineHeight: '1.5',
        fontWeight: 400,
      },
    },
    caption: {
      font: {
        fontSize: '10px', // 0.625rem
        lineHeight: '1.4',
        fontWeight: 400,
      },
    },
    title: {
      semi: {
        fontSize: '18px',
        lineHeight: '1.4',
        fontWeight: 600,
      },
      regular: {
        fontSize: '18px',
        lineHeight: '1.4',
        fontWeight: 400,
      },
    },
  },
} as const;

// Tailwind CSS class mappings for easy use
export const textStyles = {
  // Headings
  h1: 'text-5xl font-semibold leading-tight tracking-tight',
  h1Regular: 'text-3xl font-normal leading-snug',
  h2: 'text-4xl font-semibold leading-tight',
  h2Regular: 'text-2xl font-normal leading-normal',
  h3: 'text-3xl font-semibold leading-tight',
  h3Regular: 'text-2xl font-normal leading-normal',
  h4: 'text-2xl font-semibold leading-snug',
  h4Regular: 'text-xl font-normal leading-normal',
  h5: 'text-xl font-semibold leading-normal',
  h5Regular: 'text-lg font-normal leading-normal',
  
  // Body text
  text: 'text-base font-semibold leading-normal',
  textRegular: 'text-base font-normal leading-normal',
  body: 'text-sm font-semibold leading-normal',
  bodyRegular: 'text-sm font-normal leading-normal',
  small: 'text-xs font-semibold leading-normal',
  smallRegular: 'text-xs font-normal leading-normal',
  caption: 'text-[10px] font-normal leading-snug',
  title: 'text-lg font-semibold leading-normal',
  titleRegular: 'text-lg font-normal leading-normal',
} as const;

// Color class mappings
export const colorStyles = {
  primary: 'bg-[#1a2f5a] text-white',
  primaryText: 'text-[#1a2f5a]',
  primaryHover: 'hover:bg-[#152444]',
  boarder: 'border-[#e5e5e5]',
  card: 'bg-white',
  cardBorder: 'border-[#e0e0e0]',
  icon: 'text-[#00d9d9]',
  iconBg: 'bg-[#00d9d9]',
  heading: 'text-black',
  body: 'text-[#4a5568]',
} as const;

// Spacing scale
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

// Border radius
export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
} as const;

// Export all design tokens
export const designSystem = {
  colors,
  typography,
  textStyles,
  colorStyles,
  spacing,
  borderRadius,
  shadows,
} as const;

export default designSystem;
