"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { Category } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import CreateCategoryDialog from "./CreateCategoryDialog";
import { useState } from "react";
import { defaultActivityCategories, defaultCategoryHexColors } from "@/lib/constants";
import { createCategory } from "../category-actions";

interface CategorySelectProps {
  name: string;
  categories: Category[];
  defaultValue?: string;
}

export default function CategorySelect({
  name,
  categories,
  defaultValue,
}: CategorySelectProps) {
  const [value, setValue] = useState<string | undefined>(defaultValue);
  const handleValueChange = async (newValue: string) => {
    // If user picked a recommended default (not yet in DB), create it on-the-fly
    const prefix = "__default__:";
    if (newValue.startsWith(prefix)) {
      const presetName = newValue.substring(prefix.length);
      const formData = new FormData();
      formData.set("name", presetName);
      formData.set("color", defaultCategoryHexColors[presetName] || "#808080");
      const result = await createCategory(formData);
      if (result.success && result.data) {
        setValue(String(result.data.id));
        return;
      }
      // fallback: keep select unchanged if creation failed
      return;
    }
    setValue(newValue);
  };

  return (
    <Select name={name} value={value} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full bg-white">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {/* Map over the categories passed from the server */}
        {categories.map((category) => (
          <SelectItem
            key={category.id}
            // CRITICAL: The value sent to the form is now the category ID
            value={category.id.toString()}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </div>
          </SelectItem>
        ))}

        {/* Fallback: recommended defaults if user has no categories yet */}
        {categories.length === 0 && (
          <>
            <SelectSeparator />
            {defaultActivityCategories.map((label: string) => (
              <SelectItem key={label} value={`__default__:${label}`}>
                {label}
              </SelectItem>
            ))}
          </>
        )}

        <SelectSeparator />

        {/* The "Create New Category" button, wrapped in our dialog component */}
        <CreateCategoryDialog
          onCreated={(cat) => {
            setValue(String(cat.id));
          }}
        >
          <div className="flex items-center gap-2 p-2 cursor-pointer text-sm text-textDark hover:bg-secondary/80 rounded-sm">
            <PlusCircle size={16} />
            <span>Create New Category</span>
          </div>
        </CreateCategoryDialog>
      </SelectContent>
    </Select>
  );
}
