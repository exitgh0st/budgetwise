import { Injectable, Logger } from '@nestjs/common';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PendingAction {
  toolName: string;
  toolArgs: Record<string, unknown>;
  toolCallId: string;
  /** Human-readable description shown to the user */
  description: string;
  /** When the pending action expires */
  expiresAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmation keywords — if user says one of these, treat as confirmation
// ─────────────────────────────────────────────────────────────────────────────

const CONFIRM_PHRASES = new Set([
  'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'confirm', 'confirmed',
  'proceed', 'go ahead', 'do it', 'yes please', 'yes delete', 'delete it',
  'yes remove', 'remove it', 'absolutely', 'correct', 'affirmative',
]);

const CANCEL_PHRASES = new Set([
  'no', 'nope', 'nah', 'cancel', 'stop', 'abort', 'never mind', 'nevermind',
  'dont', "don't", 'skip', 'ignore', 'keep it', 'no thanks', 'no delete',
  'go back', 'undo',
]);

// TTL for pending actions (ms) — expire after 2 minutes of inactivity
const PENDING_TTL_MS = 2 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class PendingConfirmationService {
  private readonly logger = new Logger(PendingConfirmationService.name);

  /**
   * Map of userId → pending destructive action.
   * One pending action per user at a time.
   */
  private readonly pending = new Map<string, PendingAction>();

  // ───────────────────────────────────────────────────────────────────────────
  // Store a pending action awaiting user confirmation
  // ───────────────────────────────────────────────────────────────────────────

  set(userId: string, action: Omit<PendingAction, 'expiresAt'>): void {
    this.pending.set(userId, {
      ...action,
      expiresAt: new Date(Date.now() + PENDING_TTL_MS),
    });
    this.logger.log(`Pending action set for user ${userId}: ${action.toolName}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Retrieve (and validate) a pending action
  // ───────────────────────────────────────────────────────────────────────────

  get(userId: string): PendingAction | null {
    const action = this.pending.get(userId);
    if (!action) return null;

    // Auto-expire
    if (new Date() > action.expiresAt) {
      this.pending.delete(userId);
      this.logger.log(`Pending action expired for user ${userId}`);
      return null;
    }

    return action;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Clear a pending action (after execution or cancellation)
  // ───────────────────────────────────────────────────────────────────────────

  clear(userId: string): void {
    this.pending.delete(userId);
  }

  hasPending(userId: string): boolean {
    return this.get(userId) !== null;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Detect confirmation / cancellation intent from user message
  // ───────────────────────────────────────────────────────────────────────────

  detectIntent(message: string): 'confirm' | 'cancel' | 'unknown' {
    const normalized = message.toLowerCase().trim();

    // Check for cancel first (higher priority — safer default)
    for (const phrase of CANCEL_PHRASES) {
      if (normalized === phrase || normalized.startsWith(phrase + ' ') || normalized.endsWith(' ' + phrase)) {
        return 'cancel';
      }
    }

    for (const phrase of CONFIRM_PHRASES) {
      if (normalized === phrase || normalized.startsWith(phrase + ' ') || normalized.endsWith(' ' + phrase)) {
        return 'confirm';
      }
    }

    return 'unknown';
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Build the confirmation prompt shown to the user
  // ───────────────────────────────────────────────────────────────────────────

  buildConfirmationMessage(action: PendingAction): string {
    return (
      `⚠️ **Confirmation required**\n\n` +
      `You're about to **${action.description}**. This action cannot be undone.\n\n` +
      `Reply **yes** to confirm or **no** to cancel.`
    );
  }
}