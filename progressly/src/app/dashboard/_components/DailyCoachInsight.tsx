/**
 * DailyCoachInsight Component
 * Shows AI-generated daily insight on dashboard
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DailyCoachInsightProps {
  challengeId: string;
  userId: string;
  onOpenChat: () => void;
}

// Sample insights for demo (will be replaced with AI-generated)
const SAMPLE_INSIGHTS = [
  "You're 3 days into your strongest streak yet! Keep the momentum going by starting early today.",
  "Yesterday's 85% completion was solid. Focus on your morning study session to hit 100% today.",
  "Fridays tend to be tough for you. Consider front-loading your work this morning.",
  "Your consistency is at 92% - that's remarkable! One more week like this and you'll be unstoppable.",
  "You've recovered quickly from your last miss. That resilience is what separates successful people.",
];

export function DailyCoachInsight({ challengeId, userId, onOpenChat }: DailyCoachInsightProps) {
  const [insight, setInsight] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual AI call
    // For now, show a random sample insight
    const randomInsight = SAMPLE_INSIGHTS[Math.floor(Math.random() * SAMPLE_INSIGHTS.length)];
    
    setTimeout(() => {
      setInsight(randomInsight);
      setIsLoading(false);
    }, 500);
  }, [challengeId, userId]);

  const handleRefresh = () => {
    setIsLoading(true);
    const randomInsight = SAMPLE_INSIGHTS[Math.floor(Math.random() * SAMPLE_INSIGHTS.length)];
    setTimeout(() => {
      setInsight(randomInsight);
      setIsLoading(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-white/5 to-white/10 border-white/10 text-white">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-accent1/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-accent1" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-1">Coach Insight</p>
            <p className="text-sm text-gray-300">{insight}</p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-accent1 hover:text-accent1 hover:bg-white/5"
                onClick={onOpenChat}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Chat with Coach
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/5"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
