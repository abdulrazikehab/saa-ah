import { useState, useEffect, useCallback } from 'react';

export interface TabUpdate {
  id: string;
  type: 'added' | 'updated';
  message: string;
  timestamp: Date;
  data?: any;
}

export interface TabUpdatesState {
  [tabPath: string]: {
    updates: TabUpdate[];
    lastWatched: Date | null;
  };
}

const STORAGE_KEY = 'tab_updates_watched';

export function useTabUpdates() {
  const [updates, setUpdates] = useState<TabUpdatesState>({});
  const [watchedState, setWatchedState] = useState<Record<string, Date>>({});

  // Load watched state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setWatchedState(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load watched state:', error);
    }
  }, []);

  // Save watched state to localStorage
  const saveWatchedState = useCallback((state: Record<string, Date>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setWatchedState(state);
    } catch (error) {
      console.error('Failed to save watched state:', error);
    }
  }, []);

  // Add an update to a tab
  const addUpdate = useCallback((tabPath: string, update: Omit<TabUpdate, 'id' | 'timestamp'>) => {
    setUpdates((prev) => {
      const tabUpdates = prev[tabPath] || { updates: [], lastWatched: null };
      const newUpdate: TabUpdate = {
        ...update,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      };
      return {
        ...prev,
        [tabPath]: {
          updates: [newUpdate, ...tabUpdates.updates],
          lastWatched: tabUpdates.lastWatched,
        },
      };
    });
  }, []);

  // Mark tab as watched (user has seen the updates)
  const markAsWatched = useCallback((tabPath: string) => {
    const now = new Date();
    setUpdates((prev) => {
      const tabUpdates = prev[tabPath];
      if (!tabUpdates) return prev;
      return {
        ...prev,
        [tabPath]: {
          ...tabUpdates,
          lastWatched: now,
        },
      };
    });
    setWatchedState((prev) => {
      const newState = { ...prev, [tabPath]: now };
      saveWatchedState(newState);
      return newState;
    });
  }, [saveWatchedState]);

  // Check if tab has unread updates
  const hasUnreadUpdates = useCallback((tabPath: string): boolean => {
    const tabUpdates = updates[tabPath];
    if (!tabUpdates || tabUpdates.updates.length === 0) return false;

    const lastWatched = watchedState[tabPath] 
      ? new Date(watchedState[tabPath]) 
      : tabUpdates.lastWatched;

    if (!lastWatched) return true;

    // Check if there are any updates after the last watched time
    return tabUpdates.updates.some(
      (update) => update.timestamp > lastWatched
    );
  }, [updates, watchedState]);

  // Get unread updates for a tab
  const getUnreadUpdates = useCallback((tabPath: string): TabUpdate[] => {
    const tabUpdates = updates[tabPath];
    if (!tabUpdates || tabUpdates.updates.length === 0) return [];

    const lastWatched = watchedState[tabPath] 
      ? new Date(watchedState[tabPath]) 
      : tabUpdates.lastWatched;

    if (!lastWatched) return tabUpdates.updates;

    return tabUpdates.updates.filter(
      (update) => update.timestamp > lastWatched
    );
  }, [updates, watchedState]);

  // Clear updates for a tab
  const clearUpdates = useCallback((tabPath: string) => {
    setUpdates((prev) => {
      const newState = { ...prev };
      delete newState[tabPath];
      return newState;
    });
  }, []);

  return {
    updates,
    addUpdate,
    markAsWatched,
    hasUnreadUpdates,
    getUnreadUpdates,
    clearUpdates,
  };
}

