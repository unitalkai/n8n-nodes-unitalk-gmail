import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeBaseDescription, INodeTypeDescription } from 'n8n-workflow';
import { getGmailAliases, getLabels, getThreadMessages } from './v2/loadOptions';
export declare class UnitalkGmail implements INodeType {
    description: INodeTypeDescription;
    constructor(baseDescription: INodeTypeBaseDescription);
    methods: {
        loadOptions: {
            getLabels: typeof getLabels;
            getThreadMessages: typeof getThreadMessages;
            getGmailAliases: typeof getGmailAliases;
        };
    };
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
