'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Category, DailyTarget } from '@/lib/types'; // Import Category and DailyTarget from shared types
import { updateDailyTarget } from '../actions';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';

class CustomAPIError extends Error {
  info: any;
  status: number;

  constructor(message: string, info: any, status: number) {
    super(message);
    this.name = 'CustomAPIError';
    this.info = info;
    this.status = status;
  }
}

type EditTargetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  target: DailyTarget;
  onSuccess: () => void;
  categories: Category[]; // Pass categories for the ComboBox
};

const formSchema = z.object({
  category_name: z.string().min(1, 'Category name is required').max(50, 'Category name is too long'),
  target_value: z.number()
    .min(1, 'Target must be at least 1 unit')
    .max(1440, 'Target cannot exceed 24 hours (1440 minutes)')
    .optional()
    .default(1),
  target_unit: z.enum(['hours', 'minutes']),
});

type FormValues = {
  category_name: string;
  target_value?: number;
  target_unit: 'hours' | 'minutes';
};

export function EditTargetModal({
  isOpen,
  onClose,
  target,
  onSuccess,
  categories,
}: EditTargetModalProps) {
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_name: target.category_name,
      target_value: target.target_hours,
      target_unit: 'hours', // Default to hours for existing targets
    },
  });

  // Pre-populate form when target changes
  useEffect(() => {
    if (target) {
      // Convert target_hours back to target_value and target_unit
      let initialTargetValue = target.target_hours;
      let initialTargetUnit: 'hours' | 'minutes' = 'hours';

      // If target_hours is a whole number and > 1, assume hours. Otherwise, check if it's a fraction.
      // This is a heuristic, a more robust solution might store unit in DB.
      if (target.target_hours < 1 && target.target_hours * 60 >= 1) { // e.g., 0.5 hours = 30 minutes
        initialTargetValue = target.target_hours * 60;
        initialTargetUnit = 'minutes';
      } else if (target.target_hours > 24) { // If it's somehow > 24 hours, assume minutes were intended
        initialTargetValue = target.target_hours;
        initialTargetUnit = 'minutes';
      }

      form.reset({
        category_name: target.category_name,
        target_value: initialTargetValue,
        target_unit: initialTargetUnit,
      });
    }
  }, [target, form]);



  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Convert targetValue and targetUnit to target_hours
      let finalTargetHours: number;
      if (values.target_unit === 'minutes') {
        finalTargetHours = (values.target_value ?? 1) / 60;
      } else {
        finalTargetHours = values.target_value ?? 1;
      }

      const result = await updateDailyTarget(target.id, values.category_name, finalTargetHours);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update target');
      }

      toast({
        title: 'Success',
        description: 'Daily target updated successfully!',
      });
      onSuccess(); // Trigger re-fetch (if needed) and close modal
    } catch (error) {
      console.error('Error updating target:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update target',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter categories based on search
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Check if search value matches any existing category
  const isNewCategory = searchValue && !categories.some(
    (cat) => cat.name.toLowerCase() === searchValue.toLowerCase()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" style={{ backgroundColor: '#D8CBB3' }}>
        <DialogHeader>
          <DialogTitle>Edit Daily Target</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Category ComboBox */}
            <FormField
              control={form.control}
              name="category_name"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-black">Category</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          role="combobox"
                          aria-expanded={open}
                          className={cn(
                            'w-full justify-between bg-accent text-black hover:bg-accent/90',
                            !field.value && 'text-black'
                          )}
                        >
                          {field.value || 'Select or create a category...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="z-50 w-full p-0" style={{ backgroundColor: '#D8CBB3' }} align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search or create category..."
                          value={searchValue}
                          onValueChange={setSearchValue}
                          className="text-black placeholder-black"
                        />
                        <CommandList className="overflow-y-auto max-h-[200px] scrollbar-thin scrollbar-thumb-accent1 scrollbar-track-secondary/50">
                          <CommandEmpty>
                            {searchValue ? (
                              <div className="py-6 text-center text-sm">
                                <p className="text-black mb-2">
                                  No category found.
                                </p>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    field.onChange(searchValue);
                                    setOpen(false);
                                  }}
                                >
                                  Create &quot;{searchValue}&quot;
                                </Button>
                              </div>
                            ) : (
                              <span className="text-black">'Start typing to create a category...'</span>
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {isNewCategory && searchValue && (
                              <CommandItem
                                value={searchValue}
                                onSelect={() => {
                                  field.onChange(searchValue);
                                  setOpen(false);
                                }}
                                className="border-b"
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    'opacity-0'
                                  )}
                                />
                                                            <span className="font-medium text-black">
                                                              Create &quot;{searchValue}&quot;
                                                            </span>                              </CommandItem>
                            )}
                            {filteredCategories.map((category) => (
                              <CommandItem
                                key={category.id}
                                value={category.name}
                                onSelect={() => {
                                  field.onChange(category.name);
                                  setSearchValue(category.name);
                                  setOpen(false);
                                }}
                                className="text-black"
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value === category.name
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {category.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-black">
                    Select an existing category or type to create a new one.
                  </FormDescription>
                  <FormMessage className="text-black" />
                </FormItem>
              )}
            />

            {/* Target Duration Input */}
            <FormField
              control={form.control}
              name="target_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-black">Target Duration</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input
                        type="number"
                        step={form.watch('target_unit') === 'hours' ? '0.1' : '1'}
                        min={form.watch('target_unit') === 'hours' ? '0.1' : '1'}
                        max={form.watch('target_unit') === 'hours' ? '24' : '1440'}
                        placeholder={form.watch('target_unit') === 'hours' ? 'e.g., 2.5' : 'e.g., 90'}
                        className="text-black focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                        {...field}
                      />
                    </FormControl>
                    <FormField
                      control={form.control}
                      name="target_unit"
                      render={({ field: unitField }) => (
                        <FormItem>
                          <FormControl>
                            <ToggleGroup
                              type="single"
                              variant="outline"
                              value={unitField.value}
                              onValueChange={unitField.onChange}
                              className="flex gap-x-1"
                            >
                              <ToggleGroupItem value="hours" aria-label="Toggle hours"
                                className={cn(
                                  unitField.value !== 'hours' && '!border-input border-accent',
                                  'flex-grow'
                                )}
                              >
                                Hours
                              </ToggleGroupItem>
                              <ToggleGroupItem value="minutes" aria-label="Toggle minutes"
                                className={cn(
                                  unitField.value !== 'minutes' && '!border-input border-accent',
                                  'flex-grow'
                                )}
                              >
                                Minutes
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormDescription className="text-black">
                    How much time per day do you want to spend on this category?
                  </FormDescription>
                  <FormMessage className="text-black" />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full bg-accent text-black hover:bg-accent/90">
              {isSubmitting ? 'Updating Target...' : 'Update Target'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
