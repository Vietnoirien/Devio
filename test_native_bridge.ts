import { NativeBridge } from './agency_workspace/src/native-bridge';
async function test() {
    const bridge = new NativeBridge();
    await bridge.connectCDP(9222);
    const models = await bridge.getAvailableModels();
    console.log("Models:", models);
}
test().catch(console.error);
