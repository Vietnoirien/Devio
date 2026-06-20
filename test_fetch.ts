import { NativeBridge } from './agency_workspace/src/native-bridge';
import { discoverInstances } from './agency_workspace/src/services/cdp';
import { captureSnapshot } from './agency_workspace/src/services/antigravity';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function run() {
    const bridge = new NativeBridge();
    const instances = await discoverInstances();
    if (instances.length > 0) {
        await bridge.connectCDP(instances[0].port);
        const snapshot = await captureSnapshot((bridge as any).connection);
        const selector = snapshot?.controlsMeta?.model?.selector;
        
        if (selector) {
            await (bridge as any).connection.call("Runtime.evaluate", {
                expression: `
                    (() => {
                        let el = document.querySelector('${selector.replace(/'/g, "\\'")}');
                        if (!el) return false;
                        el.click();
                        return true;
                    })()
                `,
                returnByValue: true
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            const openSnapshot = await captureSnapshot((bridge as any).connection);
            const htmlToParse = openSnapshot?.controlsHtml || openSnapshot?.html || '';
            fs.writeFileSync('test_output.html', htmlToParse);
            const $ = cheerio.load(htmlToParse);
            
            const models: string[] = [];
            if (models.length === 0) {
                $('button.px-2.py-1.flex.w-full.items-center.justify-between').each((_, element) => {
                    const text = $(element).find('span.text-xs.font-medium span').text().trim();
                    if (text) {
                        models.push(text);
                    }
                });
            }
            console.log("Verified models:", models);
        }
    }
}
run().catch(console.error);
