import { discoverInstances, connectCDP } from './agency_workspace/src/services/cdp';
import { captureSnapshot } from './agency_workspace/src/services/antigravity';

async function test() {
    const instances = await discoverInstances();
    const conn = await connectCDP(instances[0].url, instances[0].id, instances[0].title);
    const snap = await captureSnapshot(conn);
    console.log("Selector:", snap?.controlsMeta?.model?.selector);
}
test().catch(console.error);
