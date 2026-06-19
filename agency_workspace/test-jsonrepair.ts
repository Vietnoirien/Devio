import { jsonrepair } from 'jsonrepair';

const brokenJson = `{"message": "The client said "hello" to me and it was "cool"", "status": "OPEN"}`;

try {
    const repaired = jsonrepair(brokenJson);
    console.log("Repaired:", repaired);
    const parsed = JSON.parse(repaired);
    console.log("Parsed message:", parsed.message);
} catch (e) {
    console.error("Failed:", e);
}
