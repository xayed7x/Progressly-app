'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
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

type Category = {
  id: number;
  name: string;
  user_id: string;
};

type AddTargetFormProps = {
  categories: Category[];
  onSubmit: (categoryName: string, targetValue: number, targetUnit: 'hours' | 'minutes') => Promise<void>;
  isSubmitting: boolean;
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

export function AddTargetForm({ categories, onSubmit, isSubmitting }: AddTargetFormProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_name: '',
      target_value: 1,
      target_unit: 'hours',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values.category_name, values.target_value!, values.target_unit);
    form.reset();
    setSearchValue('');
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Category ComboBox */}
        <FormField
          control={form.control}
          name="category_name"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Category</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      role="combobox"
                      aria-expanded={open}
                      className={cn(
                        'w-full justify-start bg-white text-black hover:bg-white/90',
                        !field.value && 'text-black'
                      )}
                    >
                      <div className="flex items-center">
                        <Search className="mr-2 h-4 w-4 shrink-0" />
                        {field.value
                          ? categories?.find((category) => category.name.toLowerCase() === field.value)?.name
                          : "Select or create a category..."}
                      </div>
                      <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="z-50 w-full p-0 border border-black" style={{ backgroundColor: '#D8CBB3' }} align="start">
                  <Command>
                    <CommandInput
                      placeholder="Select or create a category..."
                      value={searchValue}
                      onValueChange={setSearchValue}
                      className="text-black placeholder-black [&_svg]:text-black"
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
                            className="border-b border-black"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                'opacity-0'
                              )}
                            />
                            <span className="font-medium text-black">
                              Create &quot;{searchValue}&quot;
                            </span>
                          </CommandItem>
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
              <FormDescription>
                Select an existing category or type to create a new one.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Duration Input */}
        <FormField
          control={form.control}
          name="target_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Duration</FormLabel>
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
                          className="grid grid-cols-2 gap-x-1 !border-input border-black"
                        >
                          <ToggleGroupItem value="hours" aria-label="Toggle hours"
                            className={cn(
                              unitField.value !== 'hours' && '!border-input border-accent'
                            )}
                          >
                            Hours
                          </ToggleGroupItem>
                          <ToggleGroupItem value="minutes" aria-label="Toggle minutes"
                            className={cn(
                              unitField.value !== 'minutes' && '!border-input border-accent'
                            )}
                          >
                            <span className="hidden sm:inline">Minutes</span>
                            <span className="inline sm:hidden">Min</span>
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription>
                How much time per day do you want to spend on this category?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full bg-accent text-black hover:bg-accent/90">
          {isSubmitting ? 'Adding Target...' : 'Add Target'}
        </Button>
      </form>
    </Form>
  );
}
