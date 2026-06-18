import { WorkspaceManager } from './agency_workspace/src/workspace-manager';

async function test() {
  const wm = new WorkspaceManager('/home/viet/git-perso/MaxApp/Devio');
  await wm.deleteMessage('msg-v6-006');
}

test().catch(console.error);
