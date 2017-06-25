/// <reference types="node" />
import * as restIntf from 'rest-api-interfaces';
import * as $dr from 'rest-driver';
import * as events from 'events';
import * as oauth2 from 'oauth2';
import * as authorized$ from './authorized$';
import * as mc from './MessageClient';
export { $Driver } from 'rest-driver';
export { Access as OAuth2Access, ITokenRefresher as IOAuth2TokenRefresher } from 'oauth2';
export { ConnectOptions as ApiInstanceConnectOptions, RESTReturn, HTTPHeaders, HTTPMethod, ContentInfo } from 'rest-api-interfaces';
export { IMessage, IMsgHeaders, EventType as MessageEventType, MessageCallback, IMessageClient, ISubscription, SubscriptionJSON } from './MessageClient';
export interface IMessageClientOptions {
    reconnetIntervalMS?: number;
}
export interface IAuthorized$M {
    (pathname: string, options?: IMessageClientOptions, headers?: {
        [field: string]: string;
    }): mc.IMessageClient;
}
export interface IAuthorizedApiRoute {
    readonly RootApi: AuthorizedRestApi;
    readonly BaseUrl: string;
    mount: (mountPath: string) => IAuthorizedApiRoute;
    $J: authorized$.I$J;
    $F: authorized$.I$F;
    $H: authorized$.I$H;
    $B: authorized$.I$B;
    $U: authorized$.I$U;
    createFormData: () => $dr.IFormData;
}
export interface IAuthorizedApi extends IAuthorizedApiRoute {
    $E: authorized$.I$E;
    $M: IAuthorized$M;
}
export declare class AuthorizedRestApi extends events.EventEmitter implements IAuthorizedApi {
    $driver: $dr.$Driver;
    access: oauth2.Access;
    tokenRefresher: oauth2.ITokenRefresher;
    constructor($driver: $dr.$Driver, access?: oauth2.Access, tokenRefresher?: oauth2.ITokenRefresher);
    static connectOptionsToAccess(connectOptions: restIntf.ConnectOptions): oauth2.Access;
    readonly refresh_token: string;
    readonly instance_url: string;
    getUrl(pathname: string): string;
    getHeaders(additionalHeaders?: {
        [field: string]: string;
    }): any;
    readonly rejectUnauthorized: boolean;
    getCallOptions(additionalHeaders?: {
        [field: string]: string;
    }): restIntf.ApiCallOptions;
    readonly RootApi: AuthorizedRestApi;
    readonly BaseUrl: string;
    mount(mountPath: string): IAuthorizedApiRoute;
    private executeWorkflow($caller, pathname, additionalHeaders?);
    $J(method: restIntf.HTTPMethod, pathname: string, data: any, headers?: $dr.HTTPHeaders): Promise<restIntf.RESTReturn>;
    $F(method: restIntf.HTTPMethod, pathname: string, formData: $dr.IFormData, headers?: $dr.HTTPHeaders): Promise<restIntf.RESTReturn>;
    $H(pathname: string, qs?: any, headers?: $dr.HTTPHeaders): Promise<restIntf.RESTReturn>;
    $B(pathname: string, qs?: any, headers?: $dr.HTTPHeaders): Promise<restIntf.RESTReturn>;
    $U(method: restIntf.HTTPMethod, pathname: string, contentInfo: restIntf.ContentInfo, blob: $dr.IReadableBlob, headers?: $dr.HTTPHeaders): Promise<restIntf.RESTReturn>;
    $E(pathname: string, headers?: $dr.HTTPHeaders): Promise<$dr.I$EReturn>;
    $M(pathname: string, options?: IMessageClientOptions, headers?: $dr.HTTPHeaders): mc.IMessageClient;
    createFormData(): $dr.IFormData;
}
