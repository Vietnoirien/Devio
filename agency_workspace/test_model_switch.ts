import { NativeBridge } from './src/native-bridge';
import { captureSnapshot } from './src/services/antigravity';

async function test() {
    const bridge = new NativeBridge();
    await bridge.connectCDP(9222);
    
    console.log("Connected to CDP.");
    
    let snap: any = await bridge.captureSnapshot();
    console.log("Current model button text:", snap.controlsMeta?.model?.text);
    console.log("ControlsMeta:", JSON.stringify(snap.controlsMeta, null, 2));
    
    // const models = await bridge.getAvailableModels();
    // console.log("Available models:", models);
    
    const targetModel1 = "Gemini 3.5 Flash (High)";
    console.log(`Switching to ${targetModel1}...`);
    
    await bridge.switchModel(targetModel1);
    
    console.log("Waiting 2 seconds...");
    await new Promise(r => setTimeout(r, 2000));
    
    snap = await bridge.captureSnapshot();
    console.log("New model button text:", snap.controlsMeta?.model?.text);

    const targetModel2 = "Gemini 3.1 Pro (High)";
    console.log(`Switching to ${targetModel2}...`);
    
    await bridge.switchModel(targetModel2);
    
    console.log("Waiting 2 seconds...");
    await new Promise(r => setTimeout(r, 2000));
    
    snap = await bridge.captureSnapshot();
    console.log("Final model button text:", snap.controlsMeta?.model?.text);
}

test().catch(console.error);
