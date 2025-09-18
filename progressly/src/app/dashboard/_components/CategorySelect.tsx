'use client';

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
import { CATEGORY_CONFIG } from "@/lib/category-config"; // Import config

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

  // Helper function to get category color
  const getCategoryColor = (category: Category) => {
    return defaultCategoryHexColors[category.name] || category.color;
  };

  // Helper function to get category icon
  const getCategoryIcon = (categoryName: string) => {
    const config =
      categoryName && categoryName in CATEGORY_CONFIG
        ? CATEGORY_CONFIG[categoryName as keyof typeof CATEGORY_CONFIG]
        : CATEGORY_CONFIG["Default"];
    return config.icon;
  };

  const handleValueChange = async (newValue: string) => {
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
        <div className="max-h-[240px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-accent1 scrollbar-track-secondary/50">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.name);
            return (
              <SelectItem
                key={category.id}
                value={category.id.toString()}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className="w-4 h-4"
                    style={{ color: getCategoryColor(category) }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            );
          })}

          {categories.length === 0 && (
            <>
              <SelectSeparator />
              {defaultActivityCategories.map((label: string) => {
                const Icon = getCategoryIcon(label);
                return (
                  <SelectItem key={label} value={`__default__:${label}`}>
                    <div className="flex items-center gap-2">
                      <Icon
                        className="w-4 h-4"
                        style={{ color: defaultCategoryHexColors[label] || "#808080" }}
                      />
                      {label}
                    </div>
                  </SelectItem>
                );
              })}
            </>
          )}
        </div>

        <SelectSeparator />

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