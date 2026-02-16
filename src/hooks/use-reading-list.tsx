'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type ReadingListItem = {
  slug: string;
  title: string;
  description: string;
  href: string;
  type: 'blog' | 'note';
};

interface ReadingListContextType {
  items: ReadingListItem[];
  addItem: (item: ReadingListItem) => void;
  removeItem: (slug: string) => void;
  isItemSaved: (slug: string) => boolean;
}

const ReadingListContext = createContext<ReadingListContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'readingList';

export function ReadingListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ReadingListItem[]>([]);

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error('Failed to parse reading list from localStorage', error);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save reading list to localStorage', error);
    }
  }, [items]);

  const addItem = useCallback((item: ReadingListItem) => {
    setItems((prevItems) => {
      if (prevItems.some(i => i.slug === item.slug)) {
        return prevItems;
      }
      return [item, ...prevItems];
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.slug !== slug));
  }, []);

  const isItemSaved = useCallback((slug: string) => {
    return items.some((item) => item.slug === slug);
  }, [items]);

  return (
    <ReadingListContext.Provider value={{ items, addItem, removeItem, isItemSaved }}>
      {children}
    </ReadingListContext.Provider>
  );
}

export function useReadingList() {
  const context = useContext(ReadingListContext);
  if (context === undefined) {
    throw new Error('useReadingList must be used within a ReadingListProvider');
  }
  return context;
}
