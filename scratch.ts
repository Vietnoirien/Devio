import { discoverInstances, connectCDP } from './agency_workspace/src/services/cdp';
import { captureSnapshot } from './agency_workspace/src/services/antigravity';

async function main() {
    const instances = await discoverInstances();
    const target = instances.find(i => i.port === 9222) || instances[0];
    if (!target) {
        console.log("No instance found");
        return;
    }
    const connection = await connectCDP(target.url, target.id, target.title);
    const { Runtime } = connection;
    
    // Evaluate a script in the browser to get all aria-labels
    const evalResult = await Runtime.evaluate({
        expression: `
            Array.from(document.querySelectorAll('[aria-label]'))
                 .map(el => el.getAttribute('aria-label'))
                 .filter(Boolean)
                 .join('\\n');
        `,
        returnByValue: true
    });
    console.log(evalResult.result.value);
    
    // Also try to find elements with title containing 'Chat' or 'New'
    const titleResult = await Runtime.evaluate({
        expression: `
            Array.from(document.querySelectorAll('[title]'))
                 .map(el => el.getAttribute('title'))
                 .filter(Boolean)
                 .join('\\n');
        `,
        returnByValue: true
    });
    console.log("TITLES:");
    console.log(titleResult.result.value);
    
    process.exit(0);
}
main();
