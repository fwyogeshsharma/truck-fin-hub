/**
 * Chart Colors Utility
 * Provides functions to get theme colors for charts
 */

/**
 * Get the current computed HSL color from CSS variable
 */
export function getThemeColor(variableName: string): string {
  const root = document.documentElement;
  const hsl = getComputedStyle(root).getPropertyValue(`--${variableName}`).trim();
  return `hsl(${hsl})`;
}

/**
 * Get chart colors based on current theme
 */
export function getChartColors() {
  return {
    primary: getThemeColor('primary'),
    primaryLight: getThemeColor('primary-light'),
    primaryDark: getThemeColor('primary-dark'),
    secondary: getThemeColor('secondary'),
    secondaryLight: getThemeColor('secondary-light'),
    accent: getThemeColor('accent'),
    accentLight: getThemeColor('accent-light'),
    muted: getThemeColor('muted'),
    destructive: getThemeColor('destructive'),
    foreground: getThemeColor('foreground'),
    background: getThemeColor('background'),
  };
}

/**
 * Get an array of diverse chart colors for pie/bar charts
 */
export function getChartColorPalette(): string[] {
  const colors = getChartColors();
  return [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.primaryLight,
    colors.secondaryLight,
    colors.accentLight,
    colors.primaryDark,
    getThemeColor('destructive'),
  ];
}

/**
 * Get gradient stops for area charts
 */
export function getGradientColors(colorVar: string) {
  const color = getThemeColor(colorVar);
  return {
    solid: color,
    stop5: color,
    stop95: color.replace(')', ' / 0)'), // Add transparency
  };
}
