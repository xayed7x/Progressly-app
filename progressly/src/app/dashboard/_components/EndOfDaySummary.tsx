/**
 * EndOfDaySummary Component
 * Modal for reviewing and completing the day
 */

'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Check, 
  Clock, 
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  Zap,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull
} from 'lucide-react';
import type { 
  Challenge, 
  ActivityReadWithCategory, 
  MoodType, 
  CommitmentProgress 
} from '@/lib/types';
import * as metricsService from '@/lib/services/metricsService';

interface EndOfDaySummaryProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  activities: ActivityReadWithCategory[];
  commitmentProgress: Record<string, CommitmentProgress>;
  onComplete: () => void;
}

interface TimeGap {
  id: string;
  start: string;
  end: string;
  duration_minutes: number;
  filled: boolean;
  category?: string;
}

const MOODS: { value: MoodType; label: string; icon: React.ReactNode }[] = [
  { value: 'great', label: 'Great', icon: <Smile className="w-6 h-6 text-green-500" /> },
  { value: 'good', label: 'Good', icon: <Smile className="w-6 h-6 text-lime-500" /> },
  { value: 'okay', label: 'Okay', icon: <Meh className="w-6 h-6 text-yellow-500" /> },
  { value: 'bad', label: 'Bad', icon: <Frown className="w-6 h-6 text-orange-500" /> },
  { value: 'terrible', label: 'Terrible', icon: <Frown className="w-6 h-6 text-red-500" /> },
];

const QUICK_FILL_OPTIONS = ['Personal', 'Break', 'Eating', 'Family', 'Leisure', 'Other'];

export function EndOfDaySummary({
  isOpen,
  onClose,
  challenge,
  activities,
  commitmentProgress,
  onComplete
}: EndOfDaySummaryProps) {
  const [mood, setMood] = useState<MoodType | null>(null);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [notes, setNotes] = useState('');
  const [timeGaps, setTimeGaps] = useState<TimeGap[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const dayNumber = useMemo(() => {
    const start = new Date(challenge.start_date);
    const current = new Date(today);
    return Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [challenge.start_date, today]);

  // Detect time gaps
  useMemo(() => {
    const gaps = metricsService.detectMissingTimeBlocks(activities);
    setTimeGaps(gaps.map((g, i) => ({ 
      ...g, 
      id: `gap-${i}`,
      filled: false 
    })));
  }, [activities]);

  const totalLogged = useMemo(() => {
    return activities.reduce((sum, a) => {
      const [h1, m1] = a.start_time.split(':').map(Number);
      const [h2, m2] = a.end_time.split(':').map(Number);
      return sum + ((h2 * 60 + m2) - (h1 * 60 + m1));
    }, 0);
  }, [activities]);

  const handleQuickFill = (gapId: string, category: string) => {
    setTimeGaps(prev => prev.map(g => 
      g.id === gapId ? { ...g, filled: true, category } : g
    ));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Update daily metrics with mood, energy, notes
      await metricsService.updateDailyContext(challenge.id, today, {
        mood: mood || undefined,
        energy_level: energyLevel,
        notes: notes || undefined
      });

      // TODO: Create activities for filled gaps
      for (const gap of timeGaps.filter(g => g.filled && g.category)) {
        console.log('Would create activity for gap:', gap);
      }

      // Recalculate metrics
      await metricsService.calculateDailyMetrics(
        challenge.id,
        today,
        challenge,
        activities
      );

      onComplete();
      onClose();
    } catch (error) {
      console.error('Error completing day:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            End of Day Review — Day {dayNumber}/{challenge.duration_days}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Today's Summary */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Today's Activities ({formatDuration(totalLogged)} logged)
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {activities.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No activities logged today
                </p>
              ) : (
                activities.map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{activity.activity_name}</span>
                    <span className="text-muted-foreground">
                      {activity.start_time.slice(0, 5)} - {activity.end_time.slice(0, 5)}
                    </span>
                    <span className="px-2 py-0.5 bg-muted rounded text-xs">
                      {activity.category?.name || 'Uncategorized'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Missing Time Gaps */}
          {timeGaps.filter(g => !g.filled).length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                Missing Time ({timeGaps.filter(g => !g.filled).length} gaps)
              </h3>
              <div className="space-y-3">
                {timeGaps.filter(g => !g.filled).map((gap) => (
                  <Card key={gap.id} className="border-orange-200">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">
                          {gap.start.slice(0, 5)} - {gap.end.slice(0, 5)} ({formatDuration(gap.duration_minutes)})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {QUICK_FILL_OPTIONS.map(category => (
                          <Button
                            key={category}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => handleQuickFill(gap.id, category)}
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Commitment Status */}
          <div>
            <h3 className="font-medium mb-3">Today's Goal Status</h3>
            <div className="space-y-2">
              {challenge.commitments.map((commitment) => {
                const progress = commitmentProgress[commitment.id];
                const isComplete = progress?.status === 'complete';
                
                return (
                  <div key={commitment.id} className="flex items-center justify-between text-sm">
                    <span>{commitment.habit}</span>
                    <span className={`flex items-center gap-1 ${isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                      {commitment.target === 'complete' 
                        ? (isComplete ? '✓ Complete' : '○ Not done')
                        : `${progress?.actual || 0}/${commitment.target} ${commitment.unit}`
                      }
                      {isComplete ? <Check className="w-4 h-4" /> : null}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mood Selector */}
          <div>
            <h3 className="font-medium mb-3">How was today?</h3>
            <div className="flex gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`
                    flex flex-col items-center p-3 rounded-lg border-2 transition-all
                    ${mood === m.value 
                      ? 'border-primary bg-primary/10' 
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                    }
                  `}
                >
                  {m.icon}
                  <span className="text-xs mt-1">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level */}
          <div>
            <h3 className="font-medium mb-3">Energy Level: {energyLevel}/5</h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setEnergyLevel(level)}
                  className={`
                    flex-1 h-8 rounded transition-all
                    ${energyLevel >= level 
                      ? 'bg-yellow-400' 
                      : 'bg-muted hover:bg-muted-foreground/20'
                    }
                  `}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="font-medium mb-2">Notes (optional)</h3>
            <Textarea
              placeholder="Any reflections on today..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-24"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Continue Later
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Saving...' : 'Save & Complete Day'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
