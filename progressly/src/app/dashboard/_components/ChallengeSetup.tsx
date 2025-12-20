/**
 * ChallengeSetup Component
 * Multi-step wizard for creating a new challenge
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus, Trash2, Check } from 'lucide-react';
import type { Commitment, CreateChallengeInput, Category } from '@/lib/types';

// Simple unique ID generator
const generateId = () => crypto.randomUUID?.() || `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

interface ChallengeSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (input: CreateChallengeInput) => Promise<void>;
  categories: Category[];
}

type Step = 1 | 2 | 3 | 4;

const DURATION_OPTIONS = [
  { value: 30, label: '30 Days - Starter Challenge' },
  { value: 66, label: '66 Days - Habit Formation' },
  { value: 100, label: '100 Days - Full Transformation' },
];

export function ChallengeSetup({ isOpen, onClose, onComplete, categories }: ChallengeSetupProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Basic info
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState(100);
  
  // Step 2: Commitments
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [showAddCommitment, setShowAddCommitment] = useState(false);
  
  // Step 3: Psychology
  const [identityStatement, setIdentityStatement] = useState('');
  const [whyStatement, setWhyStatement] = useState('');
  const [obstaclePrediction, setObstaclePrediction] = useState('');
  const [successThreshold, setSuccessThreshold] = useState(70);

  // New commitment form state
  const [newCommitment, setNewCommitment] = useState<Partial<Commitment>>({
    frequency: 'daily',
    unit: 'hours',
    target: 1
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleAddCommitment = () => {
    if (!newCommitment.habit || !newCommitment.category) return;
    
    const commitment: Commitment = {
      id: generateId(),
      habit: newCommitment.habit!,
      target: newCommitment.unit === null ? 'complete' : (newCommitment.target || 1),
      unit: newCommitment.unit || null,
      frequency: newCommitment.frequency || 'daily',
      daysOfWeek: newCommitment.daysOfWeek,
      category: newCommitment.category!
    };
    
    setCommitments([...commitments, commitment]);
    setNewCommitment({ frequency: 'daily', unit: 'hours', target: 1 });
    setShowAddCommitment(false);
  };

  const handleRemoveCommitment = (id: string) => {
    setCommitments(commitments.filter(c => c.id !== id));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const input: CreateChallengeInput = {
        name,
        start_date: startDate,
        duration_days: durationDays,
        commitments,
        identity_statement: identityStatement || undefined,
        why_statement: whyStatement || undefined,
        obstacle_prediction: obstaclePrediction || undefined,
        success_threshold: successThreshold
      };
      
      await onComplete(input);
      onClose();
    } catch (error) {
      console.error('Error creating challenge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return name.length >= 3 && startDate !== '';
      case 2:
        return commitments.length > 0;
      case 3:
        return true; // Optional fields
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold font-serif text-textDark">
            Create New Challenge
          </DialogTitle>
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200
                    ${currentStep >= step 
                      ? 'bg-accent text-accent-foreground shadow-sm' 
                      : 'bg-white text-muted-foreground border border-input'}`}
                >
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 4 && (
                  <div className={`w-8 h-0.5 rounded-full mx-1 ${currentStep > step ? 'bg-accent' : 'bg-muted-foreground/20'}`} />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-textDark/80">Let's set up your challenge</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-textDark font-medium">Challenge Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., 100 Days of Deep Work"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white border-input focus:ring-accent focus:border-accent"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-textDark font-medium">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-textDark font-medium">Duration</Label>
                <Select 
                  value={durationDays.toString()} 
                  onValueChange={(v) => setDurationDays(parseInt(v))}
                >
                  <SelectTrigger className="bg-white border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-[200]">
                    {DURATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Commitments */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-textDark/80">Your Daily Commitments</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddCommitment(true)}
                  className="border-accent text-accent-foreground hover:bg-accent/10"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Commitment
                </Button>
              </div>
              
              {commitments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-input rounded-lg bg-white/50">
                  <p>No commitments yet.</p>
                  <p className="text-sm">Add at least one commitment to continue.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commitments.map((commitment) => (
                    <div 
                      key={commitment.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-input shadow-sm"
                    >
                      <div>
                        <p className="font-medium text-textDark">{commitment.habit}</p>
                        <p className="text-sm text-textLight">
                          {commitment.target === 'complete' 
                            ? 'Complete daily' 
                            : `${commitment.target} ${commitment.unit}/day`}
                          {' • '}{commitment.category}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCommitment(commitment.id)}
                        className="text-textLight hover:text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Commitment Form */}
              {showAddCommitment && (
                <div className="border rounded-lg p-4 space-y-4 bg-white shadow-sm">
                  <h4 className="font-medium text-textDark">New Commitment</h4>
                  
                  <div className="space-y-2">
                    <Label className="text-textDark font-medium">Habit Name</Label>
                    <Input
                      placeholder="e.g., Study, Exercise, Meditate"
                      value={newCommitment.habit || ''}
                      onChange={(e) => setNewCommitment({...newCommitment, habit: e.target.value})}
                      className="bg-secondary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-textDark font-medium">Category</Label>
                    <Select
                      value={newCommitment.category || ''}
                      onValueChange={(v) => setNewCommitment({...newCommitment, category: v})}
                    >
                      <SelectTrigger className="bg-secondary">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-[200]">
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-textDark font-medium">Target Type</Label>
                    <Select
                      value={newCommitment.unit || 'complete'}
                      onValueChange={(v) => setNewCommitment({
                        ...newCommitment, 
                        unit: v === 'complete' ? null : v as 'hours' | 'minutes'
                      })}
                    >
                      <SelectTrigger className="bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-[200]">
                        <SelectItem value="hours">Hours per day</SelectItem>
                        <SelectItem value="minutes">Minutes per day</SelectItem>
                        <SelectItem value="complete">Just complete (yes/no)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newCommitment.unit && (
                    <div className="space-y-2">
                      <Label className="text-textDark font-medium">Target Amount</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newCommitment.target || ''}
                        onChange={(e) => setNewCommitment({
                          ...newCommitment, 
                          target: parseInt(e.target.value) || 1
                        })}
                        className="bg-secondary"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddCommitment(false)}
                      className="hover:bg-secondary"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddCommitment}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Add Commitment
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Psychology */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-textDark/80">Strengthen Your Mindset</h3>
              <p className="text-sm text-textLight">
                These optional fields help reinforce your commitment and prepare for challenges.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="identity" className="text-textDark font-medium">Identity Statement</Label>
                <Textarea
                  id="identity"
                  placeholder="I am someone who..."
                  value={identityStatement}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIdentityStatement(e.target.value)}
                  className="h-20 bg-white"
                />
                <p className="text-xs text-textLight">
                  Example: "I am someone who shows up every day, even when it's hard."
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="why" className="text-textDark font-medium">Why Statement</Label>
                <Textarea
                  id="why"
                  placeholder="I'm doing this because..."
                  value={whyStatement}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setWhyStatement(e.target.value)}
                  className="h-20 bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="obstacles" className="text-textDark font-medium">Predicted Obstacles</Label>
                <Textarea
                  id="obstacles"
                  placeholder="What might get in my way..."
                  value={obstaclePrediction}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObstaclePrediction(e.target.value)}
                  className="h-20 bg-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-textDark font-medium">Success Threshold: {successThreshold}%</Label>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={successThreshold}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSuccessThreshold(parseInt(e.target.value))}
                  className="w-full accent-accent"
                />
                <p className="text-xs text-textLight">
                  Consider the challenge successful if you hit this consistency rate.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-textDark/80">Review Your Challenge</h3>
              
              <div className="bg-white border rounded-lg p-5 space-y-4 shadow-sm">
                <div>
                  <p className="text-sm text-textLight font-medium">Challenge Name</p>
                  <p className="font-serif text-xl font-bold text-textDark">{name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-textLight font-medium">Duration</p>
                  <p className="font-medium text-textDark">
                    {durationDays} days starting {new Date(startDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-textLight font-medium">
                    {commitments.length} Commitment{commitments.length !== 1 ? 's' : ''}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {commitments.map(c => (
                      <li key={c.id} className="text-sm flex items-center gap-2 p-2 bg-secondary rounded-md">
                        <Check className="w-4 h-4 text-accent2" />
                        <span className="font-medium">{c.habit}</span>
                        <span className="text-textLight text-xs">
                          {c.target === 'complete' ? 'Complete daily' : `${c.target} ${c.unit}/day`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {identityStatement && (
                  <div className="pt-2 border-t mt-2">
                    <p className="text-sm text-textLight font-medium">Identity</p>
                    <p className="text-sm italic text-textDark/80">"{identityStatement}"</p>
                  </div>
                )}
              </div>
              
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🚀</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-textDark">
                    Ready to start your transformation?
                  </p>
                  <p className="text-xs text-textDark/70 mt-0.5">
                    Click "Start Challenge" to begin tracking your progress immediately.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={currentStep === 1 ? onClose : handleBack}
            className="text-textLight hover:text-textDark hover:bg-secondary"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          {currentStep < 4 ? (
            <Button 
              onClick={handleNext} 
              disabled={!canProceed()}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90 w-full ml-4"
            >
              {isSubmitting ? 'Creating...' : 'Start Challenge 🎯'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
