import { WorkspaceWriter } from './agency_workspace/src/workspace-writer';

const text = `{"id": "msg-v21-002", "timestamp": "2026-06-19T14:03:00+02:00", "from": "agency-developer", "to": "agency-qa", "phase": "DEVELOPMENT", "type": "SUBMIT", "ref_doc": "04_dev_log.md", "message": "I have fully resolved the TDD compliance violation for the v0.7.6 release. The dev log has been updated to explicitly document the strict RED-GREEN-REFACTOR cycle for the message parsing fallback implementation. Total tests written and passing: 81 tests. Test coverage for business logic remains 100%. I confirm that every task, including the recent hallucination recovery fix, has a properly documented 🔴 RED entry in the dev log. Please perform the final audit on v0.7.6.", "devio_validation_key": "q9w8e7r6t5y4u3i2o1p0a1", "in_reply_to": "msg-v20-031"}`;

const writer = new WorkspaceWriter({
    readInbox: async () => []
} as any);

writer.extractMessage({ text, files: [] }, 'wrong_key').then(console.log).catch(console.error);
