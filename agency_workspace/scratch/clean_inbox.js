const fs = require('fs');
const readline = require('readline');
const path = require('path');

const inboxPath = path.join(__dirname, '../inbox.jsonl');
const backupPath = path.join(__dirname, '../inbox.jsonl.bak');

if (!fs.existsSync(inboxPath)) {
    console.error("inbox.jsonl not found.");
    process.exit(1);
}

fs.copyFileSync(inboxPath, backupPath);

const tmpPath = path.join(__dirname, '../inbox_cleaned.jsonl');
const writeStream = fs.createWriteStream(tmpPath);

const rl = readline.createInterface({
    input: fs.createReadStream(inboxPath),
    crlfDelay: Infinity
});

let lineCount = 0;
let keptCount = 0;
let badCount = 0;

rl.on('line', (line) => {
    lineCount++;
    try {
        // Try parsing JSON to ensure it's valid
        const parsed = JSON.parse(line);
        
        // Check for excessively large strings or object values
        let isBad = false;
        if (line.length > 50000) { 
            // Arbitrary large threshold to catch the 2MB line
            isBad = true;
        } else {
            // Also check for weird unicode replacement characters  (U+FFFD)
            if (line.includes('\uFFFD')) {
                isBad = true;
            }
        }

        if (isBad) {
            badCount++;
            return;
        }

        // It's good, write it
        writeStream.write(line + '\n');
        keptCount++;
    } catch (e) {
        badCount++;
    }
});

rl.on('close', () => {
    writeStream.end();
    // replace original
    fs.renameSync(tmpPath, inboxPath);
    console.log(`Processed ${lineCount} lines. Kept: ${keptCount}. Removed: ${badCount}. File fixed successfully.`);
});
