/**
 * Hook to fetch and use application settings
 */

import { useState, useEffect, useCallback } from "react";
import { getSettings, getAppName, getAppLogo, type Settings } from "@/services/settings.service";

// Custom event names for settings updates
const SETTINGS_UPDATED_EVENT = "settings:updated";
const APP_NAME_UPDATED_EVENT = "appName:updated";
const APP_LOGO_UPDATED_EVENT = "appLogo:updated";

// Helper function to dispatch settings update events
export const dispatchSettingsUpdate = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT));
    window.dispatchEvent(new CustomEvent(APP_NAME_UPDATED_EVENT));
    window.dispatchEvent(new CustomEvent(APP_LOGO_UPDATED_EVENT));
  }
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch settings"));
      // Set default values on error
      setSettings({ appName: "ShirtStore" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Listen for settings update events
    const handleUpdate = () => {
      fetchSettings();
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);
    };
  }, [fetchSettings]);

  return { settings, loading, error, refetch: fetchSettings };
};

export const useAppName = () => {
  const [appName, setAppName] = useState<string>("ShirtStore");
  const [loading, setLoading] = useState(true);

  const fetchAppName = useCallback(async () => {
    try {
      setLoading(true);
      const name = await getAppName();
      setAppName(name);
    } catch (error) {
      console.error("Failed to fetch app name:", error);
      setAppName("ShirtStore");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppName();

    // Listen for app name update events
    const handleUpdate = () => {
      fetchAppName();
    };

    window.addEventListener(APP_NAME_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(APP_NAME_UPDATED_EVENT, handleUpdate);
    };
  }, [fetchAppName]);

  return { appName, loading, refetch: fetchAppName };
};

export const useAppLogo = () => {
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppLogo = useCallback(async () => {
    try {
      setLoading(true);
      const logo = await getAppLogo();
      console.log("useAppLogo: Fetched logo:", logo);
      setAppLogo(logo);
    } catch (error) {
      console.error("Failed to fetch app logo:", error);
      setAppLogo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppLogo();

    // Listen for app logo update events
    const handleUpdate = () => {
      fetchAppLogo();
    };

    window.addEventListener(APP_LOGO_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(APP_LOGO_UPDATED_EVENT, handleUpdate);
    };
  }, [fetchAppLogo]);

  return { appLogo, loading, refetch: fetchAppLogo };
};

