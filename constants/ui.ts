/**
 * Shared UI Constants
 * Centralized design tokens for consistent sizing, spacing, and styling
 */

// Layout sizes
export const LAYOUT = {
    // Header
    HEADER_HEIGHT: 48,
    HEADER_HEIGHT_CLASS: 'h-12',

    // Sidebar
    SIDEBAR_COLLAPSED: 56,
    SIDEBAR_EXPANDED: 200,
    SIDEBAR_COLLAPSED_CLASS: 'w-14',
    SIDEBAR_EXPANDED_CLASS: 'w-[200px]',

    // Chat Panel
    CHAT_MIN_WIDTH: 320,
    CHAT_MAX_WIDTH: 560,
    CHAT_DEFAULT_WIDTH: 380,

    // Agent Ops Panel
    AGENT_OPS_WIDTH: 300,

    // Window Manager
    WINDOW_MIN_WIDTH: 320,
    WINDOW_MIN_HEIGHT: 240,
    WINDOW_TITLEBAR_HEIGHT: 36,

    // Taskbar / Dock
    DOCK_HEIGHT: 48,
    MOBILE_NAV_HEIGHT: 64,

    // Status Bar
    STATUSBAR_HEIGHT: 24,
} as const;

// Spacing scale (in pixels, use with Tailwind arbitrary values)
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
} as const;

// Border radius
export const RADIUS = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full',
} as const;

// Z-index layers
export const Z_INDEX = {
    base: 0,
    dropdown: 10,
    sidebar: 20,
    windows: 30,
    dock: 40,
    modal: 50,
    notification: 60,
    tooltip: 70,
    overlay: 80,
    header: 90,
    max: 100,
} as const;

// Common component classes
export const COMPONENTS = {
    // Buttons
    buttonBase: 'inline-flex items-center justify-center font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
    buttonPrimary: 'bg-aussie-500 text-black hover:bg-aussie-400 shadow-lg shadow-aussie-500/25',
    buttonSecondary: 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20',
    buttonGhost: 'text-gray-400 hover:text-white hover:bg-white/5',
    buttonDanger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',

    // Button sizes
    buttonSm: 'h-7 px-2.5 text-xs gap-1.5 rounded-lg',
    buttonMd: 'h-8 px-3 text-xs gap-2 rounded-lg',
    buttonLg: 'h-10 px-4 text-sm gap-2 rounded-xl',
    buttonIcon: 'w-8 h-8 rounded-lg',
    buttonIconSm: 'w-7 h-7 rounded-lg',

    // Inputs
    inputBase: 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:border-aussie-500/40 focus:ring-1 focus:ring-aussie-500/20 transition-all outline-none',
    inputSm: 'h-7 px-2.5 text-xs rounded-lg',
    inputMd: 'h-8 px-3 text-sm rounded-lg',
    inputLg: 'h-10 px-4 text-sm rounded-xl',

    // Cards / Panels
    card: 'bg-[#0d1117] border border-white/10 rounded-xl shadow-xl',
    cardHover: 'hover:border-white/20 hover:shadow-2xl',
    panel: 'bg-[#0b1018] border-l border-white/10',

    // Labels / Badges
    badge: 'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md',
    badgePrimary: 'bg-aussie-500/15 text-aussie-400 border border-aussie-500/25',
    badgeSecondary: 'bg-white/5 text-gray-400 border border-white/10',
    badgeSuccess: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    badgeWarning: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    badgeDanger: 'bg-red-500/15 text-red-400 border border-red-500/25',

    // Section headers
    sectionLabel: 'text-[10px] font-bold uppercase tracking-wider text-gray-500',

    // Dividers
    dividerH: 'h-px bg-white/5',
    dividerV: 'w-px bg-white/10',
} as const;

// Icon sizes (Lucide)
export const ICON_SIZE = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
} as const;

// Animation classes
export const ANIMATIONS = {
    fadeIn: 'animate-in fade-in duration-200',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
    slideDown: 'animate-in slide-in-from-top-4 duration-200',
    scaleIn: 'animate-in zoom-in-95 duration-200',
    pulse: 'animate-pulse',
    spin: 'animate-spin',
} as const;

// Gradient presets
export const GRADIENTS = {
    primary: 'bg-gradient-to-br from-aussie-500 to-emerald-500',
    panel: 'bg-gradient-to-b from-[#0d1117] to-[#0a0e14]',
    header: 'bg-gradient-to-r from-[#161b22] to-[#1a2029]',
    glow: 'shadow-lg shadow-aussie-500/25',
} as const;

// Combine classes helper
export const cn = (...classes: (string | undefined | false)[]) =>
    classes.filter(Boolean).join(' ');
