/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          border: 'hsl(var(--sidebar-border))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
        display: ['Source Serif 4', 'serif'],
      },
      fontSize: {
        '2xs': '0.65rem',
      },
      boxShadow: {
        // --- Ombres utilitaires standard ---
        'sm':  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md':  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg':  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl':  '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        // --- Ombres officielles du Design System (DO NOT REMOVE) ---
        // Usage : composants Card, surface légère, élévation minimale
        'card':     '0 1px 3px rgba(11,45,77,0.04), 0 1px 2px rgba(11,45,77,0.03)',
        // Usage : dropdowns, menus, sélecteurs — surface suspendue
        'dropdown': '0 4px 12px rgba(11,45,77,0.08), 0 2px 6px rgba(11,45,77,0.06)',
        // Usage : popovers, tooltips riches, overlays légers
        'popover':  '0 10px 25px rgba(11,45,77,0.10), 0 4px 10px rgba(11,45,77,0.06)',
        // Usage : modals, drawers, SlideOver — élévation maximale
        'modal':    '0 24px 48px rgba(11,45,77,0.14), 0 8px 16px rgba(11,45,77,0.08)',
      },
      // --- Constante de Layout (DO NOT CHANGE — source unique de vérité) ---
      // Tous les layouts (DashboardLayout, ContentLayout, MasterDetailLayout)
      // doivent utiliser cette valeur. Ne jamais hardcoder une autre largeur.
      maxWidth: {
        'layout': '100%', // Rendu 100% fluide pour exploiter tout l'écran
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
}
