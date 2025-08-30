"use client"; // This must be a client component to use hooks

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createGoal } from "../actions"; // Import our new server action

export default function GoalInput() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null); // Clear previous errors

    startTransition(async () => {
      const result = await createGoal(formData);
      if (!result.success) {
        setError(result.error || "An unknown error occurred.");
      } else {
        // Success! Clear the form.
        formRef.current?.reset();
      }
    });
  };

  return (
    <form action={handleSubmit} ref={formRef}>
      <Card className="bg-secondary text-textDark w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            What is your main focus today?
          </CardTitle>
          {error && (
            <CardDescription className="text-error pt-2">
              Error: {error}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            name="goal" // The name attribute is crucial for FormData
            placeholder="e.g., Finalize the Q3 financial report"
            className="bg-white"
            required
          />
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-accent1 text-primary hover:bg-accent1/90"
            disabled={isPending} // Disable button while submitting
          >
            {isPending ? "Saving..." : "Save Goal"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
