'use client';

import { useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
// import { EditTargetModal } from './EditTargetModal'; // Commented out as goals section is disabled
import { Category } from '@/lib/types'; // Import Category from shared types

// Define DailyTarget locally since it's not in shared types
type DailyTarget = {
  id: number;
  user_id: string;
  category_name: string;
  target_hours: number;
};

type TargetListProps = {
  targets: DailyTarget[];
  onDelete: (targetId: number) => Promise<void>;
  mutateTargets: () => void; // Add mutateTargets
  categories: Category[]; // Add categories
};

export function TargetList({ targets, onDelete, mutateTargets, categories }: TargetListProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<DailyTarget | null>(null);

  const formatHoursToReadable = (hours: number): string => {
    if (hours === 0) return "0 minutes";
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    let result = "";
    if (h > 0) {
      result += `${h} hour${h > 1 ? "s" : ""}`;
    }
    if (m > 0) {
      if (result.length > 0) result += " ";
      result += `${m} minute${m > 1 ? "s" : ""}`;
    }
    return result.trim() || "0 minutes";
  };

  const handleOpenEditModal = (target: DailyTarget) => {
    setSelectedTarget(target);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTarget(null);
  };

  if (targets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No daily targets set yet.</p>
        <p className="text-sm mt-2">Add your first target above to get started!</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[180px]">Category</TableHead>
      <TableHead>Target Hours</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {targets.map((target) => (
      <TableRow key={target.id}>
        <TableCell className="font-medium">{target.category_name}</TableCell>
        <TableCell>{formatHoursToReadable(target.target_hours)}</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end space-x-2"> {/* Added div for spacing */}
            <Button
              size="icon"
              onClick={() => handleOpenEditModal(target)}
              className="bg-primary text-secondary hover:bg-primary/80"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit target</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(target.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500 hover:text-red-400" /> {/* Styled Trash2 */}
                  <span className="sr-only">Delete target</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Daily Target?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the daily target for{' '}
                    <strong>{target.category_name}</strong>? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(target.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
      {selectedTarget && (
        // <EditTargetModal
        //   isOpen={isEditModalOpen}
        //   onClose={handleCloseEditModal}
        //   target={selectedTarget}
        //   onSuccess={() => {
        //     mutateTargets(); 
        //     handleCloseEditModal();
        //   }}
        //   categories={categories}
        // />
        null // Render nothing when EditTargetModal is commented out
      )}
    </div>
  );
}
