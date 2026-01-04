/**
 * Settings service for fetching application settings
 */

import { apiFetch } from "@/lib/utils/api";

export interface Settings {
  appName?: string;
  appLogo?: string;
  appIcon?: string;
  heroText?: string;
  heroDescription?: string;
  headingLines?: string;
  requireAccount?: string;
  allowGuestCheckout?: string;
  dashboardStats?: string;
  [key: string]: string | undefined;
}

/**
 * Fetch all settings (requires admin authentication)
 */
export const getSettings = async (): Promise<Settings> => {
  const response = await apiFetch("/admin/settings");
  return response.data.settings || {};
};

/**
 * Fetch a single setting by key (requires admin authentication)
 */
export const getSetting = async (key: string): Promise<string | null> => {
  try {
    const response = await apiFetch(`/admin/settings/${key}`);
    return response.data.setting?.value || null;
  } catch (error) {
    console.error(`Failed to fetch setting ${key}:`, error);
    return null;
  }
};

/**
 * Get app name with fallback to default (uses public endpoint)
 */
export const getAppName = async (): Promise<string> => {
  try {
    const response = await apiFetch("/settings/app-name", { showError: false });
    return response.data.appName || "ShirtStore";
  } catch (error) {
    console.error("Failed to fetch app name:", error);
    return "ShirtStore";
  }
};

/**
 * Get app logo URL (uses public endpoint)
 */
export const getAppLogo = async (): Promise<string | null> => {
  try {
    const response = await apiFetch("/settings/app-logo", { showError: false });
    return response.data.appLogo || null;
  } catch (error) {
    console.error("Failed to fetch app logo:", error);
    return null;
  }
};

/**
 * Get allow guest checkout setting (uses public endpoint)
 */
export const getAllowGuestCheckout = async (): Promise<boolean> => {
  try {
    const response = await apiFetch("/settings/allow-guest-checkout", { showError: false });
    return response.data.allowGuestCheckout === true;
  } catch (error) {
    console.error("Failed to fetch allow guest checkout setting:", error);
    // Default to false if there's an error (require account by default)
    return false;
  }
};

/**
 * Get hero text (uses public endpoint)
 */
export const getHeroText = async (): Promise<string | null> => {
  try {
    const response = await apiFetch("/settings/hero-text", { showError: false });
    return response.data.heroText || null;
  } catch (error) {
    console.error("Failed to fetch hero text:", error);
    return null;
  }
};

/**
 * Get hero description (uses public endpoint)
 */
export const getHeroDescription = async (): Promise<string | null> => {
  try {
    const response = await apiFetch("/settings/hero-description", { showError: false });
    return response.data.heroDescription || null;
  } catch (error) {
    console.error("Failed to fetch hero description:", error);
    return null;
  }
};

/**
 * Get heading lines (uses public endpoint)
 */
export const getHeadingLines = async (): Promise<string | null> => {
  try {
    const response = await apiFetch("/settings/heading-lines", { showError: false });
    return response.data.headingLines || null;
  } catch (error) {
    console.error("Failed to fetch heading lines:", error);
    return null;
  }
};

