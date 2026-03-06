"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitalkGmailApi = void 0;
class UnitalkGmailApi {
    constructor() {
        this.name = 'unitalkGmailApi';
        this.displayName = 'Unitalk Gmail API';
        this.icon = { light: 'file:unitalk.svg', dark: 'file:unitalk.dark.svg' };
        this.documentationUrl = 'https://unitalk.ai';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                required: true,
                default: '',
            },
            {
                displayName: 'Base URL',
                name: 'url',
                type: 'string',
                default: 'https://apps.unitalk.ai',
                description: 'Override the default base URL for the API',
            },
            {
                displayName: 'Add Custom Header',
                name: 'header',
                type: 'boolean',
                default: false,
            },
            {
                displayName: 'Header Name',
                name: 'headerName',
                type: 'string',
                displayOptions: {
                    show: {
                        header: [true],
                    },
                },
                default: '',
            },
            {
                displayName: 'Header Value',
                name: 'headerValue',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                displayOptions: {
                    show: {
                        header: [true],
                    },
                },
                default: '',
            },
        ];
        this.test = {
            request: {
                baseURL: '={{$credentials?.url}}',
                url: '/api/apps',
            },
        };
    }
    async authenticate(credentials, requestOptions) {
        var _a;
        (_a = requestOptions.headers) !== null && _a !== void 0 ? _a : (requestOptions.headers = {});
        requestOptions.headers['Authorization'] = `Bearer ${credentials.apiKey}`;
        if (credentials.header &&
            typeof credentials.headerName === 'string' &&
            credentials.headerName &&
            typeof credentials.headerValue === 'string') {
            requestOptions.headers[credentials.headerName] = credentials.headerValue;
        }
        return requestOptions;
    }
}
exports.UnitalkGmailApi = UnitalkGmailApi;
//# sourceMappingURL=UnitalkGmailApi.credentials.js.map