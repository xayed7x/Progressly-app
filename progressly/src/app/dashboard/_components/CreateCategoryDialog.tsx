"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory } from "../category-actions";
import SubmitButton from "./SubmitButton";

// This component will wrap a "trigger" element (like a button)
// and display a modal when that trigger is clicked.
export default function CreateCategoryDialog({
  children,
  onCreated,
  open,
  onOpenChange,
  initialName,
}: {
  children: React.ReactNode;
  onCreated?: (created: { id: number; name: string; color: string }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialName?: string;
}) {
  const [isOpenUncontrolled, setIsOpenUncontrolled] = useState(false);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : isOpenUncontrolled;
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // This effect will clear the form when the dialog is closed
  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
      setError(null);
    }
  }, [isOpen]);

  const handleFormAction = async (formData: FormData) => {
    const result = await createCategory(formData);
    if (result.success) {
      if (result.data && onCreated) {
        onCreated(result.data);
      }
      if (isControlled) {
        onOpenChange?.(false);
      } else {
        setIsOpenUncontrolled(false); // Close the dialog on success
      }
    } else {
      setError(result.error || "An unknown error occurred.");
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (isControlled) {
          onOpenChange?.(next);
        } else {
          setIsOpenUncontrolled(next);
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent 
        className="sm:max-w-[425px] bg-secondary"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-textDark">
            Create New Category
          </DialogTitle>
          <DialogDescription>
            Give your new category a name and a color.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-textDark">
              Category Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Deep Work"
              className="bg-white"
              defaultValue={initialName}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color" className="text-textDark">
              Color
            </Label>
            <Input
              id="color"
              name="color"
              type="color" // Uses the browser's native color picker
              defaultValue="#808080" // Default to a neutral gray
              className="w-full h-10 p-1"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
                        <SubmitButton pendingText="Creating...">Create Category</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
