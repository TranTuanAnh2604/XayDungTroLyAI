/** Top app bar content row (`h-16` in web design). */
export const TOP_APP_BAR_HEIGHT = 64;

export const TOP_APP_BAR_Z_INDEX = 50;
export const BOTTOM_NAV_Z_INDEX = 50;

/** iOS-style material blur tuning */
export const IOS_GLASS_IOS_INTENSITY = 100;
export const IOS_GLASS_ANDROID_INTENSITY = 72;
export const IOS_GLASS_FILL_OPACITY = 0.04;

/** Main content gap below top bar / above bottom (`px-4` rhythm) */
export const SCROLL_CONTENT_GAP = 16;

/** Vertical gap between sections — web `space-y-8` */
export const SCROLL_SECTION_GAP = 32;

/** Centered column — web `max-w-2xl` on mobile */
export const SCREEN_CONTENT_MAX_WIDTH = 448;

/** Web `pb-32` — extra scroll end padding beyond floating nav */
export const SCROLL_BOTTOM_EXTRA = 40;

export const BOTTOM_NAV_MIN_INSET = 24;
/** Floating blur bar (padding + icon + label + active scale) */
export const BOTTOM_NAV_BAR_HEIGHT = 70;

/** Bar height only — pair with `getBottomNavReservedHeight` */
export const MAIN_BOTTOM_NAV_HEIGHT = BOTTOM_NAV_BAR_HEIGHT;

/** Chat composer (input row + quick-action chips) */
export const CHAT_COMPOSER_HEIGHT = 152;

export const CHAT_COMPOSER_BOTTOM_GAP = 4;

export function getTopAppBarHeight(insets: { top: number }): number {
  return insets.top + TOP_APP_BAR_HEIGHT;
}

export function getBottomNavReservedHeight(insets: { bottom: number }): number {
  return Math.max(insets.bottom, BOTTOM_NAV_MIN_INSET) + BOTTOM_NAV_BAR_HEIGHT;
}
