"use client";

import * as React from "react";

let globalPointerGuardTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Call when a dialog closes **without** going through `onOpenChange` (e.g. after a mutation’s `onSuccess`).
 * Prevents the next pointer event from activating controls under where the dialog was (ghost click).
 */
export function suppressPointerAfterDialogClose(durationMs = 220) {
  if (typeof document === "undefined") return;
  if (globalPointerGuardTimeout) {
    clearTimeout(globalPointerGuardTimeout);
  }
  document.body.style.setProperty("pointer-events", "none");
  globalPointerGuardTimeout = setTimeout(() => {
    document.body.style.removeProperty("pointer-events");
    globalPointerGuardTimeout = null;
  }, durationMs);
}

/**
 * Wraps dialog `onOpenChange` so the pointer event that closes the modal cannot
 * activate controls underneath (ghost click). Briefly sets `body { pointer-events: none }`.
 */
export function useDialogClosePointerGuard(onOpenChange: (open: boolean) => void): (open: boolean) => void {
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      document.body.style.removeProperty("pointer-events");
    };
  }, []);

  return React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        document.body.style.setProperty("pointer-events", "none");
        timeoutRef.current = setTimeout(() => {
          document.body.style.removeProperty("pointer-events");
          timeoutRef.current = null;
        }, 200);
      } else if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        document.body.style.removeProperty("pointer-events");
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );
}
