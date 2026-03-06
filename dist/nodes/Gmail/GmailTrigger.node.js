"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailTrigger = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("./GenericFunctions");
class GmailTrigger {
    constructor() {
        this.description = {
            displayName: 'Gmail Trigger',
            name: 'gmailTrigger',
            icon: 'file:gmail.svg',
            group: ['trigger'],
            version: [1, 1.1, 1.2, 1.3],
            description: 'Fetches emails from Gmail and starts the workflow on specified polling intervals.',
            subtitle: '={{"Gmail Trigger"}}',
            defaults: {
                name: 'Gmail Trigger',
            },
            polling: true,
            inputs: [],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            hints: [
                {
                    type: 'info',
                    message: 'Multiple items will be returned if multiple messages are received within the polling interval. Make sure your workflow can handle multiple items.',
                    whenToDisplay: 'beforeExecution',
                    location: 'outputPane',
                },
            ],
            properties: [
                {
                    displayName: 'Authentication',
                    name: 'authentication',
                    type: 'options',
                    options: [
                        {
                            name: 'OAuth2 (recommended)',
                            value: 'oAuth2',
                        },
                        {
                            name: 'Service Account',
                            value: 'serviceAccount',
                        },
                    ],
                    default: 'oAuth2',
                },
                {
                    displayName: 'Event',
                    name: 'event',
                    type: 'options',
                    default: 'messageReceived',
                    options: [
                        {
                            name: 'Message Received',
                            value: 'messageReceived',
                        },
                    ],
                },
                {
                    displayName: 'Simplify',
                    name: 'simple',
                    type: 'boolean',
                    default: true,
                    description: 'Whether to return a simplified version of the response instead of the raw data',
                },
                {
                    displayName: 'Filters',
                    name: 'filters',
                    type: 'collection',
                    placeholder: 'Add Filter',
                    default: {},
                    options: [
                        {
                            displayName: 'Include Spam and Trash',
                            name: 'includeSpamTrash',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to include messages from SPAM and TRASH in the results',
                        },
                        {
                            displayName: 'Include Drafts',
                            name: 'includeDrafts',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to include email drafts in the results',
                        },
                        {
                            displayName: 'Label Names or IDs',
                            name: 'labelIds',
                            type: 'multiOptions',
                            typeOptions: {
                                loadOptionsMethod: 'getLabels',
                            },
                            default: [],
                            description: 'Only return messages with labels that match all of the specified label IDs. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
                        },
                        {
                            displayName: 'Search',
                            name: 'q',
                            type: 'string',
                            default: '',
                            placeholder: 'has:attachment',
                            hint: 'Use the same format as in the Gmail search box. <a href="https://support.google.com/mail/answer/7190?hl=en">More info</a>.',
                            description: 'Only return messages matching the specified query',
                        },
                        {
                            displayName: 'Read Status',
                            name: 'readStatus',
                            type: 'options',
                            default: 'unread',
                            hint: 'Filter emails by whether they have been read or not',
                            options: [
                                {
                                    name: 'Unread and read emails',
                                    value: 'both',
                                },
                                {
                                    name: 'Unread emails only',
                                    value: 'unread',
                                },
                                {
                                    name: 'Read emails only',
                                    value: 'read',
                                },
                            ],
                        },
                        {
                            displayName: 'Sender',
                            name: 'sender',
                            type: 'string',
                            default: '',
                            description: 'Sender name or email to filter by',
                            hint: 'Enter an email or part of a sender name',
                        },
                    ],
                },
                {
                    displayName: 'Options',
                    name: 'options',
                    type: 'collection',
                    placeholder: 'Add option',
                    default: {},
                    displayOptions: {
                        hide: {
                            simple: [true],
                        },
                    },
                    options: [
                        {
                            displayName: 'Attachment Prefix',
                            name: 'dataPropertyAttachmentsPrefixName',
                            type: 'string',
                            default: 'attachment_',
                            description: "Prefix for name of the binary property to which to write the attachment. An index starting with 0 will be added. So if name is 'attachment_' the first attachment is saved to 'attachment_0'.",
                        },
                        {
                            displayName: 'Download Attachments',
                            name: 'downloadAttachments',
                            type: 'boolean',
                            default: false,
                            description: "Whether the email's attachments will be downloaded",
                        },
                    ],
                },
            ],
            usableAsTool: true,
        };
        this.methods = {
            loadOptions: {
                async getLabels() {
                    const returnData = [];
                    const labels = (await GenericFunctions_1.googleApiRequestAllItems.call(this, 'labels', 'GET', '/gmail/v1/users/me/labels'));
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
                },
            },
        };
    }
    async poll() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const workflowStaticData = this.getWorkflowStaticData('node');
        const node = this.getNode();
        let nodeStaticData = (workflowStaticData !== null && workflowStaticData !== void 0 ? workflowStaticData : {});
        if (node.typeVersion > 1) {
            const nodeName = node.name;
            const dictionary = workflowStaticData;
            if (!(nodeName in workflowStaticData)) {
                dictionary[nodeName] = {};
            }
            nodeStaticData = dictionary[nodeName];
        }
        const now = Math.floor(new Date().getTime() / 1000);
        if (this.getMode() !== 'manual') {
            (_a = nodeStaticData.lastTimeChecked) !== null && _a !== void 0 ? _a : (nodeStaticData.lastTimeChecked = now);
        }
        const startDate = (_b = nodeStaticData.lastTimeChecked) !== null && _b !== void 0 ? _b : now;
        const options = this.getNodeParameter('options', {});
        const filters = this.getNodeParameter('filters', {});
        let responseData = [];
        const allFetchedMessages = [];
        try {
            const qs = {};
            const allFilters = { ...filters, receivedAfter: startDate };
            if (this.getMode() === 'manual') {
                qs.maxResults = 1;
                delete allFilters.receivedAfter;
            }
            Object.assign(qs, GenericFunctions_1.prepareQuery.call(this, allFilters, 0), options);
            const messagesResponse = await GenericFunctions_1.googleApiRequest.call(this, 'GET', '/gmail/v1/users/me/messages', {}, qs);
            const messages = (_c = messagesResponse.messages) !== null && _c !== void 0 ? _c : [];
            if (!messages.length) {
                return null;
            }
            const simple = this.getNodeParameter('simple');
            if (simple) {
                qs.format = 'metadata';
                qs.metadataHeaders = ['From', 'To', 'Cc', 'Bcc', 'Subject'];
            }
            else {
                qs.format = 'raw';
            }
            let includeDrafts = false;
            if (node.typeVersion > 1.1) {
                includeDrafts = (_d = filters.includeDrafts) !== null && _d !== void 0 ? _d : false;
            }
            else {
                includeDrafts = (_e = filters.includeDrafts) !== null && _e !== void 0 ? _e : true;
            }
            delete qs.includeDrafts;
            for (const message of messages) {
                const fullMessage = (await GenericFunctions_1.googleApiRequest.call(this, 'GET', `/gmail/v1/users/me/messages/${message.id}`, {}, qs));
                allFetchedMessages.push(fullMessage);
                if (!includeDrafts) {
                    if ((_f = fullMessage.labelIds) === null || _f === void 0 ? void 0 : _f.includes('DRAFT')) {
                        continue;
                    }
                }
                if (node.typeVersion > 1.2 &&
                    ((_g = fullMessage.labelIds) === null || _g === void 0 ? void 0 : _g.includes('SENT')) &&
                    !((_h = fullMessage.labelIds) === null || _h === void 0 ? void 0 : _h.includes('INBOX'))) {
                    continue;
                }
                if (!simple) {
                    const dataPropertyNameDownload = options.dataPropertyAttachmentsPrefixName || 'attachment_';
                    const parsed = await GenericFunctions_1.parseRawEmail.call(this, fullMessage, dataPropertyNameDownload);
                    responseData.push(parsed);
                }
                else {
                    responseData.push({ json: fullMessage });
                }
            }
            if (simple) {
                responseData = this.helpers.returnJsonArray(await GenericFunctions_1.simplifyOutput.call(this, responseData.map((item) => item.json)));
            }
        }
        catch (error) {
            if (this.getMode() === 'manual' || !nodeStaticData.lastTimeChecked) {
                throw error;
            }
            const workflow = this.getWorkflow();
            this.logger.error(`There was a problem in '${node.name}' node in workflow '${workflow.id}': '${error.description}'`, {
                node: node.name,
                workflowId: workflow.id,
                error,
            });
        }
        if (!allFetchedMessages.length) {
            return null;
        }
        const emailsWithInvalidDate = new Set();
        const getEmailDateAsSeconds = (email) => {
            var _a;
            let date;
            if (email.internalDate) {
                date = +email.internalDate / 1000;
            }
            else if (email.date) {
                date = Math.floor(new Date(email.date).getTime() / 1000);
            }
            else if ((_a = email.headers) === null || _a === void 0 ? void 0 : _a.date) {
                date = Math.floor(new Date(email.headers.date).getTime() / 1000);
            }
            if (!date || isNaN(date)) {
                emailsWithInvalidDate.add(email.id);
                return +startDate;
            }
            return date;
        };
        const lastEmailDate = allFetchedMessages.reduce((lastDate, message) => {
            const emailDate = getEmailDateAsSeconds(message);
            return emailDate > lastDate ? emailDate : lastDate;
        }, 0);
        const nextPollPossibleDuplicates = allFetchedMessages.reduce((duplicates, message) => {
            const emailDate = getEmailDateAsSeconds(message);
            return emailDate <= lastEmailDate ? duplicates.concat(message.id) : duplicates;
        }, Array.from(emailsWithInvalidDate));
        const possibleDuplicates = new Set((_j = nodeStaticData.possibleDuplicates) !== null && _j !== void 0 ? _j : []);
        if (possibleDuplicates.size > 0) {
            responseData = responseData.filter(({ json }) => {
                if (!json || typeof json.id !== 'string')
                    return false;
                return !possibleDuplicates.has(json.id);
            });
        }
        nodeStaticData.possibleDuplicates = nextPollPossibleDuplicates;
        nodeStaticData.lastTimeChecked = lastEmailDate !== null && lastEmailDate !== void 0 ? lastEmailDate : +startDate;
        if (Array.isArray(responseData) && responseData.length) {
            return [responseData];
        }
        return null;
    }
}
exports.GmailTrigger = GmailTrigger;
//# sourceMappingURL=GmailTrigger.node.js.map