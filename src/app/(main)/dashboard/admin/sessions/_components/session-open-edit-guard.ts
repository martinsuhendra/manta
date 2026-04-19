/**
 * After a dialog closes (e.g. delete confirm), a ghost click can hit the session card
 * underneath and reopen edit for the same session. Arm a short block for that id only.
 */
let blockedSessionId: string | null = null;
let blockUntilMs = 0;

export function armBlockOpenEditAfterSessionDialog(sessionId: string, durationMs = 800) {
  blockedSessionId = sessionId;
  blockUntilMs = Date.now() + durationMs;
}

export function shouldBlockOpenEditForSession(sessionId: string): boolean {
  if (blockedSessionId === null || Date.now() > blockUntilMs) {
    blockedSessionId = null;
    return false;
  }
  return blockedSessionId === sessionId;
}

/** Radix/shadcn layers that should swallow timetable background clicks (do not use in menu-driven `onEdit` paths). */
const OPEN_OVERLAY_LAYER_SELECTORS = [
  '[data-slot="dialog-content"][data-state="open"]',
  '[data-slot="dialog-overlay"][data-state="open"]',
  '[data-slot="alert-dialog-content"][data-state="open"]',
  '[data-slot="alert-dialog-overlay"][data-state="open"]',
  '[data-slot="sheet-content"][data-state="open"]',
  '[data-slot="sheet-overlay"][data-state="open"]',
  '[data-slot="dropdown-menu-content"][data-state="open"]',
  '[data-slot="popover-content"][data-state="open"]',
  '[data-slot="select-content"][data-state="open"]',
] as const;

const OPEN_OVERLAY_COMBINED_SELECTOR = OPEN_OVERLAY_LAYER_SELECTORS.join(", ");

export function isBlockingOverlayUiOpen(): boolean {
  if (typeof document === "undefined") return false;
  return document.querySelector(OPEN_OVERLAY_COMBINED_SELECTOR) != null;
}
