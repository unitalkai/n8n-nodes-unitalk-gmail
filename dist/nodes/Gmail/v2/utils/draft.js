"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addThreadHeadersToEmail = addThreadHeadersToEmail;
const GenericFunctions_1 = require("../../GenericFunctions");
function setEmailReplyHeaders(email, messageId) {
    if (messageId) {
        email.inReplyTo = messageId;
        email.references = messageId;
    }
}
function setThreadHeaders(email, thread) {
    var _a;
    if (thread === null || thread === void 0 ? void 0 : thread.messages) {
        const lastMessage = thread.messages.length - 1;
        const messageId = (_a = thread.messages[lastMessage].payload.headers.find((header) => header.name.toLowerCase().includes('message') && header.name.toLowerCase().includes('id'))) === null || _a === void 0 ? void 0 : _a.value;
        setEmailReplyHeaders(email, messageId);
    }
}
async function addThreadHeadersToEmail(email, threadId) {
    const thread = await GenericFunctions_1.googleApiRequest.call(this, 'GET', `/gmail/v1/users/me/threads/${threadId}`, {}, { format: 'metadata', metadataHeaders: ['Message-ID'] });
    setThreadHeaders(email, thread);
}
//# sourceMappingURL=draft.js.map