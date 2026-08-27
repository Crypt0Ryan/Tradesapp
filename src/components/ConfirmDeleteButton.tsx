import type { ComponentProps } from 'react';
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
import { Button } from '@/components/ui/button';

/**
 * Every delete in this app is permanent (no backend, no undo) - this gates
 * the trash-can buttons behind a real "are you sure?" instead of deleting
 * on a single tap, since a mis-tap is otherwise unrecoverable data loss.
 */
export function ConfirmDeleteButton({
  onConfirm,
  title,
  description,
  ...buttonProps
}: {
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
} & ComponentProps<typeof Button>) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" {...buttonProps} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm()}
            className="bg-destructive! text-destructive-foreground! hover:bg-destructive/90!"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
