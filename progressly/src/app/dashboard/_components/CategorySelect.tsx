import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// The list of categories as specified in the plan
export const activityCategories = [
  "Work",
  "Study",
  "Health & Fitness",
  "Family & Social",
  "Sleep",
  "Personal Time",
  "Faith/Discipline",
  "Other",
];

interface CategorySelectProps {
  name: string;
}

export default function CategorySelect({ name }: CategorySelectProps) {
  return (
    <Select name={name}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {activityCategories.map((category) => (
          <SelectItem key={category} value={category}>
            {category}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
