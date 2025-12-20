/**
 * useChallenges Hook
 * Provides challenge data and operations for components
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { Challenge, CreateChallengeInput, DailyChallengeMetrics } from '@/lib/types';
import * as challengeService from '@/lib/services/challengeService';
import * as metricsService from '@/lib/services/metricsService';

interface UseChallengesReturn {
  // Data
  activeChallenge: Challenge | null;
  todayMetrics: DailyChallengeMetrics | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createChallenge: (input: CreateChallengeInput) => Promise<Challenge>;
  refetch: () => Promise<void>;
  
  // Computed
  currentDayNumber: number | null;
  isOnTrack: boolean;
}

export function useChallenges(userId: string | null): UseChallengesReturn {
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [todayMetrics, setTodayMetrics] = useState<DailyChallengeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Fetch active challenge
  const fetchActiveChallenge = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const challenge = await challengeService.getActiveChallenge(userId);
      setActiveChallenge(challenge);

      if (challenge) {
        // Fetch today's metrics
        const metrics = await metricsService.getDailyMetrics(challenge.id, today);
        setTodayMetrics(metrics);
      }
    } catch (err) {
      console.error('Error fetching challenge:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch challenge');
    } finally {
      setIsLoading(false);
    }
  }, [userId, today]);

  // Initial fetch
  useEffect(() => {
    fetchActiveChallenge();
  }, [fetchActiveChallenge]);

  // Create a new challenge
  const createChallenge = useCallback(async (input: CreateChallengeInput): Promise<Challenge> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const challenge = await challengeService.createChallenge(userId, input);
    setActiveChallenge(challenge);
    
    // Fetch initial metrics
    const metrics = await metricsService.getDailyMetrics(challenge.id, today);
    setTodayMetrics(metrics);

    return challenge;
  }, [userId, today]);

  // Computed: current day number
  const currentDayNumber = activeChallenge 
    ? challengeService.calculateDayNumber(activeChallenge.start_date, today)
    : null;

  // Computed: is on track (70%+ cumulative consistency)
  const isOnTrack = todayMetrics 
    ? todayMetrics.cumulative_consistency_rate >= 70 
    : true;

  return {
    activeChallenge,
    todayMetrics,
    isLoading,
    error,
    createChallenge,
    refetch: fetchActiveChallenge,
    currentDayNumber,
    isOnTrack
  };
}

/**
 * Hook for fetching all challenge metrics
 */
export function useChallengeMetrics(challengeId: string | null) {
  const [metrics, setMetrics] = useState<DailyChallengeMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!challengeId) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await metricsService.getAllMetrics(challengeId);
        setMetrics(data);
      } catch (err) {
        console.error('Error fetching metrics:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [challengeId]);

  return { metrics, isLoading };
}
