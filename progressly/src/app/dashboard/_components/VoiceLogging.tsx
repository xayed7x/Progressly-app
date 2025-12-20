/**
 * VoiceLogging Component
 * Log activities by speaking
 */

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Mic, MicOff, Check, X, AlertCircle } from 'lucide-react';
import type { Category } from '@/lib/types';

interface VoiceLoggingProps {
  categories: Category[];
  onActivitiesLogged: () => void;
}

interface ParsedActivity {
  activity_name: string;
  category: string;
  start_time: string;
  end_time: string;
}

export function VoiceLogging({ categories, onActivitiesLogged }: VoiceLoggingProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedActivities, setParsedActivities] = useState<ParsedActivity[]>([]);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<'en-US' | 'bn-BD'>('en-US');
  const [isSupported, setIsSupported] = useState(true);

  const handleStartListening = async () => {
    setError('');
    setTranscript('');
    setParsedActivities([]);

    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
      return;
    }

    setIsListening(true);

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        
        // Parse the transcript (mock for now)
        parseTranscript(text);
      };

      recognition.onerror = (event: any) => {
        setError(`Error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setError('Failed to start voice recognition');
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    setIsListening(false);
    // Would need to store recognition instance to properly stop
  };

  const parseTranscript = (text: string) => {
    // Simple parsing logic (would use AI in production)
    const lowerText = text.toLowerCase();
    const activities: ParsedActivity[] = [];

    // Look for patterns like "studied from 9 to 12" or "I went running"
    if (lowerText.includes('stud') || lowerText.includes('study')) {
      activities.push({
        activity_name: 'Study',
        category: 'Study',
        start_time: '09:00',
        end_time: '12:00'
      });
    } else if (lowerText.includes('run') || lowerText.includes('exercise') || lowerText.includes('workout')) {
      activities.push({
        activity_name: 'Exercise',
        category: 'Exercise',
        start_time: '06:00',
        end_time: '07:00'
      });
    } else if (lowerText.includes('work')) {
      activities.push({
        activity_name: 'Work',
        category: 'Work',
        start_time: '09:00',
        end_time: '17:00'
      });
    } else {
      // Generic activity
      activities.push({
        activity_name: text.slice(0, 30),
        category: 'Personal',
        start_time: '09:00',
        end_time: '10:00'
      });
    }

    setParsedActivities(activities);
  };

  const handleEditActivity = (index: number, field: keyof ParsedActivity, value: string) => {
    setParsedActivities(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleConfirm = async () => {
    // TODO: Create activities via API
    console.log('Would create activities:', parsedActivities);
    onActivitiesLogged();
    
    // Reset
    setTranscript('');
    setParsedActivities([]);
  };

  const handleCancel = () => {
    setTranscript('');
    setParsedActivities([]);
    setError('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Mic className="w-4 h-4" />
          Voice Logging
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language Selector */}
        <div className="flex gap-2">
          <Button
            variant={language === 'en-US' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('en-US')}
          >
            English
          </Button>
          <Button
            variant={language === 'bn-BD' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('bn-BD')}
          >
            বাংলা
          </Button>
        </div>

        {/* Voice Input Button */}
        <div className="flex flex-col items-center gap-3 py-4">
          <button
            onClick={isListening ? handleStopListening : handleStartListening}
            disabled={!isSupported}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl
              transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
              ${isListening 
                ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' 
                : 'bg-primary hover:bg-primary/90 shadow-lg'
              }
            `}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <p className="text-sm text-muted-foreground">
            {isListening ? 'Listening... Speak now' : 'Tap to start voice logging'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">You said:</p>
            <p className="font-medium">"{transcript}"</p>
          </div>
        )}

        {/* Parsed Activities */}
        {parsedActivities.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Confirm activities:</p>
            
            {parsedActivities.map((activity, idx) => (
              <div key={idx} className="p-3 border rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Activity</label>
                    <Input
                      value={activity.activity_name}
                      onChange={(e) => handleEditActivity(idx, 'activity_name', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Category</label>
                    <Select
                      value={activity.category}
                      onValueChange={(v) => handleEditActivity(idx, 'category', v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Start</label>
                    <Input
                      type="time"
                      value={activity.start_time}
                      onChange={(e) => handleEditActivity(idx, 'start_time', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">End</label>
                    <Input
                      type="time"
                      value={activity.end_time}
                      onChange={(e) => handleEditActivity(idx, 'end_time', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <Button onClick={handleConfirm} className="flex-1">
                <Check className="w-4 h-4 mr-1" />
                Confirm & Save
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
