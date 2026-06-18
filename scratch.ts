import { discoverInstances, connectCDP } from './agency_workspace/src/services/cdp';

async function main() {
    const instances = await discoverInstances();
    const target = instances.find(i => i.port === 9222) || instances[0];
    if (!target) {
        console.log("No instance found");
        return;
    }
    const connection = await connectCDP(target.url, target.id, target.title);
    
    console.log("Checking button state...");
    const stateResult = await connection.call("Runtime.evaluate", {
        expression: `
            (() => {
                let el = document.querySelector('[data-tooltip-id="new-conversation-tooltip"]');
                if (!el) return "Not found";
                return {
                    className: el.className,
                    disabled: el.hasAttribute('disabled') || el.className.includes('cursor-not-allowed')
                };
            })()
        `,
        returnByValue: true
    });
    console.log("Button State:", stateResult.result.value);

    console.log("Attempting to click via HTMLElement click()...");
    const clickResult = await connection.call("Runtime.evaluate", {
        expression: `
            (() => {
                let el = document.querySelector('[data-tooltip-id="new-conversation-tooltip"]');
                if (!el) return false;
                
                let e = el; // HTMLElement cast
                e.click();
                return true;
            })()
        `,
        returnByValue: true
    });
    console.log("Click executed:", clickResult.result.value);

    // Wait 2 seconds
    await new Promise(r => setTimeout(r, 2000));
    
    // Dump the DOM HTML to see what's inside
    const htmlResult = await connection.call("Runtime.evaluate", {
        expression: `
            (() => {
                let msgs = document.querySelectorAll('.message, [data-testid*="message" i], article');
                let count = msgs.length;
                let text = msgs.length > 0 ? msgs[0].textContent : '';
                return { count, text };
            })()
        `,
        returnByValue: true
    });
    console.log("Empty chat state:", htmlResult.result.value);
    
    process.exit(0);
}
main();
