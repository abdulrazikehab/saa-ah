import React, { createContext, useContext, ReactNode } from 'react';
import { useTabUpdates, TabUpdate } from '@/hooks/useTabUpdates';

interface TabUpdatesContextType {
  addUpdate: (tabPath: string, update: Omit<TabUpdate, 'id' | 'timestamp'>) => void;
  markAsWatched: (tabPath: string) => void;
  hasUnreadUpdates: (tabPath: string) => boolean;
  getUnreadUpdates: (tabPath: string) => TabUpdate[];
  clearUpdates: (tabPath: string) => void;
}

const TabUpdatesContext = createContext<TabUpdatesContextType | undefined>(undefined);

export function TabUpdatesProvider({ children }: { children: ReactNode }) {
  const tabUpdates = useTabUpdates();

  return (
    <TabUpdatesContext.Provider value={tabUpdates}>
      {children}
    </TabUpdatesContext.Provider>
  );
}

export function useTabUpdatesContext() {
  const context = useContext(TabUpdatesContext);
  if (context === undefined) {
    throw new Error('useTabUpdatesContext must be used within a TabUpdatesProvider');
  }
  return context;
}

