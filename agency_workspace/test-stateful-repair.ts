export function repairMalformedJson(jsonString: string): string {
    // A simple state machine to escape unescaped double quotes inside the "message" field.
    // It looks for "message": " and then iterates until it finds ", or "}
    
    const messageKeyStr = '"message"';
    let output = '';
    
    let i = 0;
    while (i < jsonString.length) {
        const messageKeyIdx = jsonString.indexOf(messageKeyStr, i);
        if (messageKeyIdx === -1) {
            output += jsonString.substring(i);
            break;
        }
        
        // Find the colon after "message"
        let colonIdx = jsonString.indexOf(':', messageKeyIdx + messageKeyStr.length);
        if (colonIdx === -1) {
            output += jsonString.substring(i);
            break;
        }
        
        // Find the opening quote of the value
        let openQuoteIdx = jsonString.indexOf('"', colonIdx + 1);
        if (openQuoteIdx === -1) {
            output += jsonString.substring(i);
            break;
        }
        
        output += jsonString.substring(i, openQuoteIdx + 1);
        
        // Now we are inside the message string value
        let j = openQuoteIdx + 1;
        let valueStr = '';
        while (j < jsonString.length) {
            if (jsonString[j] === '"') {
                // Is this quote the end of the string?
                // It's the end if the next non-whitespace characters are `,` or `}`
                let isEnd = false;
                let k = j + 1;
                while (k < jsonString.length && /\s/.test(jsonString[k])) {
                    k++;
                }
                if (k < jsonString.length && (jsonString[k] === ',' || jsonString[k] === '}')) {
                    isEnd = true;
                }
                
                if (isEnd) {
                    // It's the closing quote
                    output += valueStr + '"';
                    i = j + 1;
                    break;
                } else {
                    // It's an internal quote, needs escaping
                    // Check if it's already escaped
                    if (valueStr.endsWith('\\')) {
                        valueStr += '"';
                    } else {
                        valueStr += '\\"';
                    }
                }
            } else if (jsonString[j] === '\n') {
                valueStr += '\\n';
            } else if (jsonString[j] === '\r') {
                valueStr += '\\r';
            } else {
                valueStr += jsonString[j];
            }
            j++;
        }
        
        if (j >= jsonString.length) {
            // Reached EOF without finding closing quote, just append
            output += valueStr;
            i = j;
        }
    }
    
    return output;
}

const test1 = `{"message": "The client said "hello" to me and it was "cool"", "status": "OPEN"}`;
const test2 = `{"id": "msg-1", "message": "Line 1\nLine 2", "type": "INFO"}`;

console.log("Test 1:");
console.log(repairMalformedJson(test1));

console.log("Test 2:");
console.log(repairMalformedJson(test2));

