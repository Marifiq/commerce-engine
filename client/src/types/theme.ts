/**
 * Theme-related types and interfaces
 */

export interface ThemeColors {
  primary?: string;
  secondary?: string;
  background?: string;
  text?: string;
  border?: string;
  [key: string]: string | undefined;
}

export interface ThemeFonts {
  heading?: string;
  body?: string;
  [key: string]: string | undefined;
}

export interface ThemeLayout {
  sidebarPosition?: string;
  headerStyle?: string;
  [key: string]: any;
}

export interface Theme {
  id: number;
  name: string;
  colors?: ThemeColors | null;
  fonts?: ThemeFonts | null;
  layout?: ThemeLayout | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

