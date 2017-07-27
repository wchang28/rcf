import * as restIntf from 'rest-api-interfaces';
import * as $dr from 'rest-driver';
import * as oauth2 from 'oauth2';
import * as authorized$ from './authorized$';
import * as mc from './MessageClient';
export { $Driver } from 'rest-driver';
export { Access as OAuth2Access } from 'oauth2';
export { Access } from 'oauth2';
export { ConnectOptions as ApiInstanceConnectOptions, RESTReturn, HTTPHeaders, HTTPResourceCrudMethod, HTTPMethod, ContentInfo, ReadableContent } from 'rest-api-interfaces';
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
    mount(mountPath: string): IAuthorizedApiRoute;
    $J: authorized$.I$J;
    $F: authorized$.I$F;
    $H: authorized$.I$H;
    $B: authorized$.I$B;
    $U: authorized$.I$U;
    createFormData(): $dr.IFormData;
}
export interface IAuthorizedApi extends IAuthorizedApiRoute {
    readonly $driver: $dr.$Driver;
    access?: oauth2.Access;
    readonly instance_url: string;
    readonly rejectUnauthorized: boolean;
    $M: IAuthorized$M;
}
export declare class AuthorizedRestApi implements IAuthorizedApi {
    $driver: $dr.$Driver;
    access: oauth2.Access;
    constructor($driver: $dr.$Driver, access?: oauth2.Access, notUsed?: any);
    static connectOptionsToAccess(connectOptions: restIntf.ConnectOptions): oauth2.Access;
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
    $J(method: restIntf.HTTPMethod, pathname: string, data: any, headers?: $dr.HTTPHeaders): Promise<restIntf.RESTReturn>;
    $F(method: restIntf.HTTPMethod, pathname: string, formData: $dr.IFormData, headers?: $dr.HTTPHeaders): Promise<restIntf.RESTReturn>;
    $H(pathname: string, qs?: any, headers?: $dr.HTTPHeaders): Promise<restIntf.RESTReturn>;
    $B(pathname: string, qs?: any, headers?: $dr.HTTPHeaders): Promise<restIntf.RESTReturn>;
    $U(method: restIntf.HTTPMethod, pathname: string, readableContent: restIntf.ReadableContent<$dr.IReadableBlob>, headers?: $dr.HTTPHeaders): Promise<restIntf.RESTReturn>;
    $E(pathname: string, headers?: $dr.HTTPHeaders): Promise<$dr.I$EReturn>;
    $M(pathname: string, options?: IMessageClientOptions, headers?: $dr.HTTPHeaders): mc.IMessageClient;
    createFormData(): $dr.IFormData;
}
