import { AgencyMessage } from '../workspace-manager';

/**
 * Formats internal uppercase phase names into human-readable titles.
 */
export function formatPhaseName(phase: string): string {
  switch (phase) {
    case 'BRIEF':
      return 'Briefing';
    case 'RESEARCH':
      return 'Research';
    case 'PROPOSAL':
      return 'Proposal';
    case 'ARCHITECTURE':
      return 'Architecture';
    case 'DEVELOPMENT':
      return 'Development';
    case 'REVIEW':
      return 'Review & Audit';
    case 'DELIVERY':
      return 'Delivery';
    case 'DONE':
      return 'Completed';
    default:
      return phase;
  }
}

/**
 * Checks if the specified phase has any unresolved blocking messages.
 */
export function isPhaseBlocked(messages: AgencyMessage[], currentPhase: string): boolean {
  if (currentPhase === 'DONE') return false;
  return messages.some((msg) => msg.phase === currentPhase && msg.status === 'OPEN');
}

/**
 * Slices the chronological list of messages to get the last N entries.
 */
export function getLatestMessages(messages: AgencyMessage[], count: number): AgencyMessage[] {
  return messages.slice(-count);
}

export function createAgencyMessage(
  from: string,
  to: string,
  phase: string,
  type: "SUBMIT" | "REQUEST_CHANGE" | "REVISION" | "APPROVE" | "ESCALATE" | "INFO",
  ref_doc: string,
  message: string,
  status: "OPEN" | "RESOLVED"
): AgencyMessage {
  const trimmedRefDoc = ref_doc.trim();
  return {
    id: 'msg-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 11),
    timestamp: new Date().toISOString(),
    from,
    to,
    phase,
    type,
    ref_doc: trimmedRefDoc === '' ? null : trimmedRefDoc,
    message: message.trim(),
    in_reply_to: null,
    status
  };
}
