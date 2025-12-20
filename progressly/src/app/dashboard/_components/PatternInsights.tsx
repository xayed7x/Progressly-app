/**
 * PatternInsights Component
 * Displays detected behavioral patterns with recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Target, 
  TrendingUp, 
  Zap,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BehaviorPattern, PatternType } from '@/lib/types';
import * as patternService from '@/lib/services/patternService';

interface PatternInsightsProps {
  challengeId: string;
}

export function PatternInsights({ challengeId }: PatternInsightsProps) {
  const [patterns, setPatterns] = useState<BehaviorPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPatterns = async () => {
    try {
      const data = await patternService.getPatterns(challengeId);
      setPatterns(data);
    } catch (error) {
      console.error('Error loading patterns:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPatterns();
  }, [challengeId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Trigger pattern detection and then reload
    await loadPatterns();
  };

  const getIcon = (type: PatternType) => {
    switch (type) {
      case 'weak_day': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'strong_time': return <Target className="w-5 h-5 text-green-500" />;
      case 'recovery_speed': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'failure_trigger': return <Zap className="w-5 h-5 text-red-500" />;
      default: return <Lightbulb className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getMessage = (pattern: BehaviorPattern): string => {
    const { pattern_type, pattern_data } = pattern;
    
    switch (pattern_type) {
      case 'weak_day': {
        const data = pattern_data as { day: string; avg_completion: number; sample_size: number };
        return `You're ${Math.round(100 - data.avg_completion)}% less productive on ${data.day}s (${data.sample_size} weeks analyzed)`;
      }
      case 'strong_time': {
        const data = pattern_data as { time_block: string; avg_duration: number };
        return `Your peak productivity is during ${data.time_block} with average ${Math.round(data.avg_duration)} min sessions`;
      }
      case 'recovery_speed': {
        const data = pattern_data as { avg_days_to_recover: number };
        return `When you miss a day, you typically recover within ${data.avg_days_to_recover.toFixed(1)} days. Your resilience is ${data.avg_days_to_recover < 2 ? 'excellent' : 'good'}!`;
      }
      case 'failure_trigger': {
        const data = pattern_data as { occurrence_count: number; value: string };
        return `${data.occurrence_count} of your low days happened on ${data.value}. This might be a trigger.`;
      }
      default:
        return 'Pattern detected';
    }
  };

  const getRecommendation = (pattern: BehaviorPattern): string => {
    const { pattern_type, pattern_data } = pattern;
    
    switch (pattern_type) {
      case 'weak_day': {
        const data = pattern_data as { day: string };
        return `Strategy: Front-load your work earlier in the week, or schedule lighter goals for ${data.day}s.`;
      }
      case 'strong_time': {
        const data = pattern_data as { time_block: string };
        return `Recommendation: Schedule your most important work during ${data.time_block}.`;
      }
      case 'recovery_speed': {
        const data = pattern_data as { avg_days_to_recover: number };
        return data.avg_days_to_recover < 2 
          ? 'Keep it up! Your ability to bounce back quickly is a key success factor.'
          : 'Focus on getting back on track within 24 hours after a miss.';
      }
      case 'failure_trigger':
        return 'Consider what typically happens on this day and plan accordingly.';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (patterns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Not enough data for insights yet.</p>
            <p className="text-xs mt-1">Keep logging for 2+ weeks to see patterns.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Your Patterns & Insights
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {patterns.map((pattern) => (
          <div 
            key={pattern.id}
            className="p-3 rounded-lg bg-muted/50 space-y-2"
          >
            <div className="flex items-start gap-3">
              {getIcon(pattern.pattern_type)}
              <div className="flex-1">
                <p className="text-sm font-medium">{getMessage(pattern)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getRecommendation(pattern)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-8">
              <div className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                {pattern.confidence_score}% confidence
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
