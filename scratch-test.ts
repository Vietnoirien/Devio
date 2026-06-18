import { WorkspaceWriter } from './agency_workspace/src/workspace-writer';

const writer = new WorkspaceWriter(null as any);
const response = {
    text: `
<thought>
I need to do something
</thought>
{
  "id": "msg-456",
  "type": "REQUEST_CHANGE",
  "message": "Type '"test"' is not assignable",
  "devio_validation_key": "key456"
}
thumb_upthumb_downReview Changes
`,
    files: []
};

console.log(writer.extractMessage(response, 'key456'));
