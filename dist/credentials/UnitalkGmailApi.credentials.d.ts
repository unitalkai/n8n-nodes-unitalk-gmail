import type { IconFile, ICredentialDataDecryptedObject, ICredentialTestRequest, ICredentialType, IHttpRequestOptions, INodeProperties, Themed } from 'n8n-workflow';
export declare class UnitalkGmailApi implements ICredentialType {
    name: string;
    displayName: string;
    icon: Themed<IconFile>;
    documentationUrl: string;
    properties: INodeProperties[];
    test: ICredentialTestRequest;
    authenticate(credentials: ICredentialDataDecryptedObject, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions>;
}
