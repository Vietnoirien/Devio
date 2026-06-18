const str = `{
  "id": "msg-456",
  "type": "REQUEST_CHANGE",
  "message": "Type '"test"' is not assignable",
  "devio_validation_key": "key456"
}`;
const repaired = str.replace(/"message"\s*:\s*"(.*?)"\s*,\s*"(in_reply_to|status|devio_validation_key|timestamp|from|to|phase|type|ref_doc|id)"\s*:/gs, (match, p1, p2) => {
    const escaped = p1.replace(/(?<!\\)"/g, '\\"');
    return `"message": "${escaped}",\n  "${p2}":`;
});
console.log(repaired);
console.log(JSON.parse(repaired));
