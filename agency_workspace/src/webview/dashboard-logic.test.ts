import { describe, it, expect } from 'vitest';
import { formatPhaseName, isPhaseBlocked, getLatestMessages, createAgencyMessage } from './dashboard-logic';
import { AgencyMessage } from '../workspace-manager';

describe('Dashboard Logic', () => {
  describe('formatPhaseName', () => {
    it('should format phase names into readable titles', () => {
      expect(formatPhaseName('BRIEF')).toBe('Briefing');
      expect(formatPhaseName('RESEARCH')).toBe('Research');
      expect(formatPhaseName('PROPOSAL')).toBe('Proposal');
      expect(formatPhaseName('ARCHITECTURE')).toBe('Architecture');
      expect(formatPhaseName('DEVELOPMENT')).toBe('Development');
      expect(formatPhaseName('REVIEW')).toBe('Review & Audit');
      expect(formatPhaseName('DELIVERY')).toBe('Delivery');
      expect(formatPhaseName('DONE')).toBe('Completed');
    });
  });

  describe('isPhaseBlocked', () => {
    const sampleMessages: AgencyMessage[] = [
      {
        id: 'msg-001',
        timestamp: '2026-06-17T18:50:00Z',
        from: 'agency-ceo',
        to: 'agency-architect',
        phase: 'PROPOSAL',
        type: 'SUBMIT',
        ref_doc: null,
        message: 'Proposal is ready',
        in_reply_to: null,
        status: 'RESOLVED'
      },
      {
        id: 'msg-002',
        timestamp: '2026-06-17T19:00:00Z',
        from: 'agency-qa',
        to: 'agency-developer',
        phase: 'DEVELOPMENT',
        type: 'REQUEST_CHANGE',
        ref_doc: 'src/extension.ts',
        message: 'Fix bug',
        in_reply_to: null,
        status: 'OPEN'
      }
    ];

    it('should identify a phase as blocked if it has an OPEN message', () => {
      expect(isPhaseBlocked(sampleMessages, 'DEVELOPMENT')).toBe(true);
    });

    it('should identify a phase as not blocked if all messages in that phase are RESOLVED', () => {
      expect(isPhaseBlocked(sampleMessages, 'PROPOSAL')).toBe(false);
    });

    it('should return false if there are no messages for the phase', () => {
      expect(isPhaseBlocked(sampleMessages, 'ARCHITECTURE')).toBe(false);
    });
  });

  describe('getLatestMessages', () => {
    const sampleMessages: AgencyMessage[] = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-00${i + 1}`,
      timestamp: `2026-06-17T19:0${i}:00Z`,
      from: 'agency-ceo',
      to: 'agency-architect',
      phase: 'BRIEF',
      type: 'INFO',
      ref_doc: null,
      message: `Message ${i + 1}`,
      in_reply_to: null,
      status: 'RESOLVED'
    }));

    it('should return the correct number of latest messages', () => {
      const latest = getLatestMessages(sampleMessages, 3);
      expect(latest.length).toBe(3);
      expect(latest[0].id).toBe('msg-008');
      expect(latest[2].id).toBe('msg-0010');
    });

    it('should return all messages if total count is less than requested limit', () => {
      const latest = getLatestMessages(sampleMessages, 20);
      expect(latest.length).toBe(10);
    });
  });

  describe('createAgencyMessage', () => {
    it('should create a valid AgencyMessage with a generated ID and timestamp', () => {
      const msg = createAgencyMessage(
        'client',
        'agency-ceo',
        'DEVELOPMENT',
        'INFO',
        'test.md',
        'Hello from the client',
        'RESOLVED'
      );
      
      expect(msg.id).toMatch(/^msg-[\w\d]+-[\w\d]+$/);
      expect(new Date(msg.timestamp).toISOString()).toBe(msg.timestamp);
      expect(msg.from).toBe('client');
      expect(msg.to).toBe('agency-ceo');
      expect(msg.phase).toBe('DEVELOPMENT');
      expect(msg.type).toBe('INFO');
      expect(msg.ref_doc).toBe('test.md');
      expect(msg.message).toBe('Hello from the client');
      expect(msg.in_reply_to).toBeNull();
      expect(msg.status).toBe('RESOLVED');
    });

    it('should trim string inputs and handle empty strings for ref_doc', () => {
      const msg = createAgencyMessage(
        'client',
        'agency-ceo',
        'DEVELOPMENT',
        'INFO',
        '   ',
        '  padded message  ',
        'OPEN'
      );
      
      expect(msg.ref_doc).toBeNull();
      expect(msg.message).toBe('padded message');
    });
  });
});
