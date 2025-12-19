"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { parseISO, format, addDays, isToday } from 'date-fns';

interface EffectiveDateContextType {
  // Current psychological day (from backend or manual override)
  currentEffectiveDate: Date | null;
  
  // Set the effective date (used when backend provides it)
  setCurrentEffectiveDate: (date: Date) => void;
  
  // Manual "End My Day" - advances to next day
  endMyDay: () => void;
  
  // Check if day is locked (night sleep logged)
  isDayLocked: boolean;
  
  // Friendly message for locked day
  lockedDayMessage: string | null;
  
  // Format the current effective date for display
  formattedDate: string;
  
  // Check if we're in late night (after midnight)
  isLateNightSession: boolean;
}

const EffectiveDateContext = createContext<EffectiveDateContextType | undefined>(undefined);

const STORAGE_KEY = 'progressly_effective_date_session';
const LOCK_KEY = 'progressly_day_locked';

interface StoredSession {
  date: string;  // ISO date string
  endedAt: string;  // ISO datetime when manually ended
  isLocked: boolean;
}

export function EffectiveDateProvider({ children }: { children: ReactNode }) {
  const [currentEffectiveDate, setCurrentEffectiveDateState] = useState<Date | null>(null);
  const [isDayLocked, setIsDayLocked] = useState(false);
  const [lockedDayMessage, setLockedDayMessage] = useState<string | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const session: StoredSession = JSON.parse(stored);
        const storedDate = parseISO(session.date);
        const endedAt = new Date(session.endedAt);
        const hoursAgo = (Date.now() - endedAt.getTime()) / (1000 * 60 * 60);
        
        // Only use stored session if it's less than 48 hours old
        if (hoursAgo < 48) {
          setCurrentEffectiveDateState(storedDate);
          setIsDayLocked(session.isLocked || false);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save to localStorage when effective date changes
  useEffect(() => {
    if (currentEffectiveDate) {
      const session: StoredSession = {
        date: format(currentEffectiveDate, 'yyyy-MM-dd'),
        endedAt: new Date().toISOString(),
        isLocked: isDayLocked,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, [currentEffectiveDate, isDayLocked]);

  // Set effective date from backend
  const setCurrentEffectiveDate = useCallback((date: Date) => {
    setCurrentEffectiveDateState(date);
  }, []);

  // Manual "End My Day" - advances to next day and locks the previous
  const endMyDay = useCallback(() => {
    if (currentEffectiveDate) {
      const previousDate = format(currentEffectiveDate, 'MMMM d');
      const nextDay = addDays(currentEffectiveDate, 1);
      
      // Set friendly locked message for the previous day
      setLockedDayMessage(`☀️ Great job! Your ${previousDate} session has ended.`);
      setIsDayLocked(true);
      setCurrentEffectiveDateState(nextDay);
      
      // Clear the lock message after 5 seconds
      setTimeout(() => {
        setLockedDayMessage(null);
      }, 5000);
    }
  }, [currentEffectiveDate]);

  // Check if we're in a late night session (after midnight but same psychological day)
  const isLateNightSession = currentEffectiveDate 
    ? !isToday(currentEffectiveDate) && new Date().getHours() < 12
    : false;

  // Format the current effective date for display
  const formattedDate = currentEffectiveDate 
    ? format(currentEffectiveDate, 'EEEE, MMMM d')
    : '';

  return (
    <EffectiveDateContext.Provider
      value={{
        currentEffectiveDate,
        setCurrentEffectiveDate,
        endMyDay,
        isDayLocked,
        lockedDayMessage,
        formattedDate,
        isLateNightSession,
      }}
    >
      {children}
    </EffectiveDateContext.Provider>
  );
}

export function useEffectiveDate() {
  const context = useContext(EffectiveDateContext);
  if (context === undefined) {
    throw new Error('useEffectiveDate must be used within an EffectiveDateProvider');
  }
  return context;
}
