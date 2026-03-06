"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareTimestamp = void 0;
exports.googleApiRequest = googleApiRequest;
exports.parseRawEmail = parseRawEmail;
exports.encodeEmail = encodeEmail;
exports.googleApiRequestAllItems = googleApiRequestAllItems;
exports.extractEmail = extractEmail;
exports.prepareQuery = prepareQuery;
exports.prepareEmailsInput = prepareEmailsInput;
exports.prepareEmailBody = prepareEmailBody;
exports.prepareEmailAttachments = prepareEmailAttachments;
exports.unescapeSnippets = unescapeSnippets;
exports.simplifyOutput = simplifyOutput;
exports.getLabels = getLabels;
const n8n_workflow_1 = require("n8n-workflow");
async function googleApiRequest(method, endpoint, body = {}, qs = {}, uri, option = {}) {
    var _a;
    let orginalOptions = {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        method,
        body,
        qs,
        url: uri || `https://www.googleapis.com${endpoint}`,
        json: true,
    };
    orginalOptions = Object.assign({}, orginalOptions, option);
    const credentials = await this.getCredentials('unitalkGmailApi');
    try {
        if (Object.keys(body).length === 0) {
            delete orginalOptions.body;
        }
        const base64Body = Buffer.from(JSON.stringify(orginalOptions)).toString('base64');
        const proxyOptions = {
            url: `https://79d2-2a09-bac6-d7e6-191-00-28-182.ngrok-free.app/api/apps/proxy`,
            method: 'POST',
            body: JSON.stringify({
                originalRequest: base64Body,
            }),
            headers: {
                ...orginalOptions.headers,
                'X-Unitalk-API-Key': credentials === null || credentials === void 0 ? void 0 : credentials.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        };
        const response = await this.helpers.httpRequest.call(this, proxyOptions);
        return response;
    }
    catch (error) {
        if (error.code === 'ERR_OSSL_PEM_NO_START_LINE') {
            error.statusCode = '401';
        }
        if (error.httpCode === '400') {
            if (error.cause && (error.cause.message || '').includes('Invalid id value')) {
                const resource = this.getNodeParameter('resource', 0);
                const errorOptions = {
                    message: `Invalid ${resource} ID`,
                    description: `${resource.charAt(0).toUpperCase() + resource.slice(1)} IDs should look something like this: 182b676d244938bd`,
                };
                throw new n8n_workflow_1.NodeApiError(this.getNode(), error, errorOptions);
            }
        }
        if (error.httpCode === '404') {
            let resource = this.getNodeParameter('resource', 0);
            if (resource === 'label') {
                resource = 'label ID';
            }
            const errorOptions = {
                message: `${resource.charAt(0).toUpperCase() + resource.slice(1)} not found`,
                description: '',
            };
            throw new n8n_workflow_1.NodeApiError(this.getNode(), error, errorOptions);
        }
        if (error.httpCode === '409') {
            const resource = this.getNodeParameter('resource', 0);
            if (resource === 'label') {
                const errorOptions = {
                    message: 'Label name exists already',
                    description: '',
                };
                throw new n8n_workflow_1.NodeApiError(this.getNode(), error, errorOptions);
            }
        }
        if (error.code === 'EAUTH') {
            const errorOptions = {
                message: ((_a = error === null || error === void 0 ? void 0 : error.body) === null || _a === void 0 ? void 0 : _a.error_description) || 'Authorization error',
                description: error.message,
            };
            throw new n8n_workflow_1.NodeApiError(this.getNode(), error, errorOptions);
        }
        if ((error.message || '').includes('Bad request - please check your parameters') &&
            error.description) {
            const errorOptions = {
                message: error.description,
                description: '',
            };
            throw new n8n_workflow_1.NodeApiError(this.getNode(), error, errorOptions);
        }
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error, {
            message: error.message,
            description: error.description,
        });
    }
}
async function parseRawEmail(messageData, dataPropertyNameDownload) {
    const messageEncoded = Buffer.from(messageData.raw, 'base64').toString('utf8');
    const responseData = messageEncoded;
    const headers = {};
    for (const header of responseData.headerLines) {
        headers[header.key] = header.line;
    }
    const binaryData = {};
    if (responseData.attachments) {
        const downloadAttachments = this.getNodeParameter('options.downloadAttachments', 0, false);
        if (downloadAttachments) {
            for (let i = 0; i < responseData.attachments.length; i++) {
                const attachment = responseData.attachments[i];
                binaryData[`${dataPropertyNameDownload}${i}`] = await this.helpers.prepareBinaryData(attachment.content, attachment.filename, attachment.contentType);
            }
        }
    }
    const mailBaseData = {};
    const resolvedModeAddProperties = ['id', 'threadId', 'labelIds', 'sizeEstimate'];
    for (const key of resolvedModeAddProperties) {
        mailBaseData[key] = messageData[key];
    }
    const json = Object.assign({}, mailBaseData, responseData, {
        headers,
        headerLines: undefined,
        attachments: undefined,
        date: responseData.date ? responseData.date.toISOString() : responseData.date,
    });
    return {
        json,
        binary: Object.keys(binaryData).length ? binaryData : undefined,
    };
}
async function encodeEmail(email) {
    const mailOptions = {
        from: email.from,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        replyTo: email.replyTo,
        inReplyTo: email.inReplyTo,
        references: email.reference,
        subject: email.subject,
        text: email.body,
        keepBcc: true,
    };
    if (email.htmlBody) {
        mailOptions.html = email.htmlBody;
    }
    if (email.attachments !== undefined &&
        Array.isArray(email.attachments) &&
        email.attachments.length > 0) {
        const attachments = email.attachments.map((attachment) => ({
            filename: attachment.name,
            content: attachment.content,
            contentType: attachment.type,
            encoding: 'base64',
        }));
        mailOptions.attachments = attachments;
    }
    const mail = mailOptions;
    mail.keepBcc = true;
    const mailBody = await mail.build();
    return mailBody.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function googleApiRequestAllItems(propertyName, method, endpoint, body = {}, query = {}) {
    const returnData = [];
    let responseData;
    query.maxResults = 100;
    do {
        responseData = await googleApiRequest.call(this, method, endpoint, body, query);
        query.pageToken = responseData.nextPageToken;
        returnData.push.apply(returnData, responseData[propertyName]);
    } while (responseData.nextPageToken !== undefined && responseData.nextPageToken !== '');
    return returnData;
}
function extractEmail(s) {
    if (s.includes('<')) {
        const data = s.split('<')[1];
        return data.substring(0, data.length - 1);
    }
    return s;
}
const prepareTimestamp = (node, itemIndex, query, dateValue, label) => {
    let timestamp = new Date(dateValue).getTime() / 1000;
    const timestampLengthInMilliseconds1990 = 12;
    if (typeof timestamp === 'number') {
        timestamp = Math.round(timestamp);
    }
    if (!timestamp &&
        typeof dateValue === 'number' &&
        dateValue.toString().length < timestampLengthInMilliseconds1990) {
        timestamp = dateValue;
    }
    if (!timestamp && dateValue.length < timestampLengthInMilliseconds1990) {
        timestamp = parseInt(dateValue, 10);
    }
    if (!timestamp) {
        const description = `'${dateValue}' isn't a valid date and time. If you're using an expression, be sure to set an ISO date string or a timestamp.`;
        throw new n8n_workflow_1.NodeOperationError(node, `Invalid date/time in 'Received ${label[0].toUpperCase() + label.slice(1)}' field`, {
            description,
            itemIndex,
        });
    }
    if (query) {
        query += ` ${label}:${timestamp}`;
    }
    else {
        query = `${label}:${timestamp}`;
    }
    return query;
};
exports.prepareTimestamp = prepareTimestamp;
function prepareQuery(fields, itemIndex) {
    const qs = { ...fields };
    if (qs.labelIds) {
        if (qs.labelIds === '') {
            delete qs.labelIds;
        }
        else {
            qs.labelIds = qs.labelIds;
        }
    }
    if (qs.sender) {
        if (qs.q) {
            qs.q += ` from:${qs.sender}`;
        }
        else {
            qs.q = `from:${qs.sender}`;
        }
        delete qs.sender;
    }
    if (qs.readStatus && qs.readStatus !== 'both') {
        if (qs.q) {
            qs.q += ` is:${qs.readStatus}`;
        }
        else {
            qs.q = `is:${qs.readStatus}`;
        }
        delete qs.readStatus;
    }
    if (qs.receivedAfter) {
        qs.q = (0, exports.prepareTimestamp)(this.getNode(), itemIndex, qs.q, qs.receivedAfter, 'after');
        delete qs.receivedAfter;
    }
    if (qs.receivedBefore) {
        qs.q = (0, exports.prepareTimestamp)(this.getNode(), itemIndex, qs.q, qs.receivedBefore, 'before');
        delete qs.receivedBefore;
    }
    return qs;
}
function prepareEmailsInput(input, fieldName, itemIndex) {
    let emails = '';
    input.split(',').forEach((entry) => {
        const email = entry.trim();
        if (email.indexOf('@') === -1) {
            const description = `The email address '${email}' in the '${fieldName}' field isn't valid`;
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid email address', {
                description,
                itemIndex,
            });
        }
        if (email.includes('<') && email.includes('>')) {
            emails += `${email},`;
        }
        else {
            emails += `<${email}>, `;
        }
    });
    return emails;
}
function prepareEmailBody(itemIndex, appendAttribution = false, instanceId) {
    const emailType = this.getNodeParameter('emailType', itemIndex);
    let message = this.getNodeParameter('message', itemIndex, '').trim();
    if (appendAttribution) {
        const attributionText = 'This email was sent automatically with ';
        const link = 'https://unitalk.ai/?instanceId=' + instanceId;
        if (emailType === 'html') {
            message = `
			${message}
			<br>
			<br>
			---
			<br>
			<em>${attributionText}<a href="${link}" target="_blank">Unitalk</a></em>
			`;
        }
        else {
            message = `${message}\n\n---\n${attributionText}Unitalk\n${'https://unitalk.ai'}`;
        }
    }
    const body = {
        body: '',
        htmlBody: '',
    };
    if (emailType === 'html') {
        body.htmlBody = message;
    }
    else {
        body.body = message;
    }
    return body;
}
async function prepareEmailAttachments(options, itemIndex) {
    const attachmentsList = [];
    const attachments = options.attachmentsBinary;
    if (attachments && attachments.length > 0) {
        for (const { property } of attachments) {
            for (const name of property.split(',')) {
                const binaryData = this.helpers.assertBinaryData(itemIndex, name);
                const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, name);
                if (!Buffer.isBuffer(binaryDataBuffer)) {
                    const description = `The input field '${name}' doesn't contain an attachment. Please make sure you specify a field containing binary data`;
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Attachment not found', {
                        description,
                        itemIndex,
                    });
                }
                attachmentsList.push({
                    name: binaryData.fileName || 'unknown',
                    content: binaryDataBuffer,
                    type: binaryData.mimeType,
                });
            }
        }
    }
    return attachmentsList;
}
function unescapeSnippets(items) {
    const result = items.map((item) => {
        const snippet = item.json.snippet;
        if (snippet) {
            item.json.snippet = snippet;
        }
        return item;
    });
    return result;
}
async function simplifyOutput(data) {
    const labelsData = await googleApiRequest.call(this, 'GET', '/gmail/v1/users/me/labels');
    const labels = (labelsData.labels || []).map(({ id, name }) => ({
        id,
        name,
    }));
    return (data || []).map((item) => {
        if (item.labelIds) {
            item.labels = labels.filter((label) => item.labelIds.includes(label.id));
            delete item.labelIds;
        }
        if (item.payload && item.payload.headers) {
            const { headers } = item.payload;
            (headers || []).forEach((header) => {
                item[header.name] = header.value;
            });
            delete item.payload.headers;
        }
        return item;
    });
}
async function getLabels() {
    const returnData = [];
    const labels = await googleApiRequestAllItems.call(this, 'labels', 'GET', '/gmail/v1/users/me/labels');
    for (const label of labels) {
        returnData.push({
            name: label.name,
            value: label.id,
        });
    }
    return returnData.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    });
}
//# sourceMappingURL=GenericFunctions.js.map