import { useState, useEffect } from 'react';

interface ScanHistoryItem {
  hash: string;
  coffeeName: string;
  roasterName: string;
  scannedAt: string;
}

const STORAGE_KEY = 'funcup_scan_history';
const MAX_HISTORY = 50;

export function useScanHistory() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        console.error('Failed to parse scan history');
      }
    }
  }, []);

  const addToHistory = (hash: string, coffeeName: string, roasterName: string) => {
    setHistory(prev => {
      const exists = prev.some(item => item.hash === hash);
      if (exists) {
        const updated = prev.map(item => 
          item.hash === hash ? { ...item, scannedAt: new Date().toISOString() } : item
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      }
      
      const newHistory = [
        { hash, coffeeName, roasterName, scannedAt: new Date().toISOString() },
        ...prev,
      ].slice(0, MAX_HISTORY);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  };

  const removeFromHistory = (hash: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.hash !== hash);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
    isEmpty: history.length === 0,
  };
}