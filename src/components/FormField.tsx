import { cloneElement, useId, type ReactElement } from 'react';
import { Label } from '@/components/ui/label';

/** A visible label (and optional hint) properly linked to its input, so tapping the label focuses it and screen readers announce it. */
export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactElement<{ id?: string; 'aria-describedby'?: string }>;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {cloneElement(children, { id, ...(hint && { 'aria-describedby': hintId }) })}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
