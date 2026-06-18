const text = `{"id":"msg-v4-005","timestamp":"2026-06-18T18:22:00.000Z","from":"agency-qa","to":"agency-developer","phase":"REVIEW","type":"REQUEST_CHANGE","ref_doc":"05_qa_report.md","message":"[HIGH] QA-V4-001: The codebase fails strict TypeScript compilation. tsc --noEmit returns TS2322 errors in agency_workspace/src/orchestration-engine.test.ts lines 45 and 46 because Type '\\"test\\"' is not assignable to the expected message types. Please resolve these errors so the codebase compiles cleanly.","in_reply_to":"msg-v4-004","status":"OPEN","devio_validation_key":"57z5s3dj3upwz699smuoh"}`;
try {
  JSON.parse(text);
  console.log("Parsed!");
} catch (e) {
  console.log("Error:", e.message);
}
