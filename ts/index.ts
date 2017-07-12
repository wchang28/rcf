import * as restIntf from 'rest-api-interfaces';
import * as eventSource from 'eventsource-typings';
import * as $dr from 'rest-driver';
import * as events from 'events';
import * as _ from 'lodash';
import * as oauth2 from 'oauth2';
import * as authorized$ from './authorized$';
import * as mc from './MessageClient';

// make sure the environment has the Promise object in the global space
require("es6-promise").polyfill();

export {$Driver} from 'rest-driver';
export {Access as OAuth2Access, ITokenRefresher as IOAuth2TokenRefresher} from 'oauth2';
export {ConnectOptions as ApiInstanceConnectOptions, RESTReturn, HTTPHeaders, HTTPMethod, ContentInfo} from 'rest-api-interfaces';
export {IMessage, IMsgHeaders, EventType as MessageEventType, MessageCallback, IMessageClient, ISubscription, SubscriptionJSON} from './MessageClient';

export interface IMessageClientOptions {
    reconnetIntervalMS?: number // msg client reconnect interval in millisecond
}

// already authorized and instance-independent interface that returns a message client
export interface IAuthorized$M {
    (pathname: string, options?: IMessageClientOptions, headers?: {[field:string]:string}) : mc.IMessageClient;
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

let defaultMsgClientOptions : IMessageClientOptions = {
    reconnetIntervalMS: 5000
}

// abstract interface for making all $ calls, since all $ calls have url and callOptions in the parameters list
interface I$Caller {
    call: (url: string, callOptions: restIntf.ApiCallOptions) => Promise<any>;
}

class $JCaller implements I$Caller {
    constructor(protected $J: $dr.I$J, protected method: restIntf.HTTPMethod, protected data: any) {}
    call(url: string, callOptions: restIntf.ApiCallOptions) : Promise<restIntf.RESTReturn> {
        return this.$J(this.method, url, this.data, callOptions);
    }
}

class $ECaller implements I$Caller {
    constructor(protected $E: $dr.I$E) {}
    call(url: string, callOptions: restIntf.ApiCallOptions) :  Promise<$dr.I$EReturn> {
        return this.$E(url, callOptions);
    }
}

class $FCaller implements I$Caller {
    constructor(protected $F: $dr.I$F, protected method: restIntf.HTTPMethod, protected formData: $dr.IFormData) {}
    call(url: string, callOptions: restIntf.ApiCallOptions) : Promise<restIntf.RESTReturn> {
        return this.$F(this.method, url, this.formData, callOptions);
    }
}

class $HCaller implements I$Caller {
    constructor(protected $H: $dr.I$H, protected qs: any) {}
    call(url: string, callOptions: restIntf.ApiCallOptions) : Promise<restIntf.RESTReturn> {
        return this.$H(url, this.qs, callOptions);
    }
}

class $BCaller implements I$Caller {
    constructor(protected $B: $dr.I$B, protected qs: any) {}
    call(url: string, callOptions: restIntf.ApiCallOptions) : Promise<restIntf.RESTReturn> {
        return this.$B(url, this.qs, callOptions);
    }
}

class $UCaller implements I$Caller {
    constructor(protected $U: $dr.I$U, protected method: restIntf.HTTPMethod, protected contentInfo: restIntf.ContentInfo, protected blob: $dr.IReadableBlob) {}
    call(url: string, callOptions: restIntf.ApiCallOptions) : Promise<restIntf.RESTReturn> {
        return this.$U(this.method, url, this.contentInfo, this.blob, callOptions);
    }
}

class AuthorizedApiRoute implements IAuthorizedApiRoute {
    constructor(private rootApi: AuthorizedRestApi, private parentBaseUrl: string,  private mountPath: string) {}
    get RootApi() : AuthorizedRestApi {return this.rootApi;}
    get BaseUrl() : string {
        let s = this.parentBaseUrl + this.mountPath;
        if (s.length >= 1 && s.substr(s.length-1, 1) === "/") s = s.substr(0, s.length-1); // remove the last "/"
        return s;
    }
    $J(method: restIntf.HTTPMethod, pathname: string, data: any, headers?: $dr.HTTPHeaders) : Promise<restIntf.RESTReturn> {
        return this.rootApi.$J(method, this.BaseUrl + pathname, data, headers);
    }
    $F(method: restIntf.HTTPMethod, pathname: string, formData: $dr.IFormData, headers?: $dr.HTTPHeaders) : Promise<restIntf.RESTReturn> {
        return this.rootApi.$F(method, this.BaseUrl + pathname, formData, headers);
    }
    $H(pathname: string, qs?: any, headers?: $dr.HTTPHeaders) : Promise<restIntf.RESTReturn> {
        return this.rootApi.$H(this.BaseUrl + pathname, qs, headers);
    }
    $B(pathname: string, qs?: any, headers?: $dr.HTTPHeaders) : Promise<restIntf.RESTReturn> {
        return this.rootApi.$B(this.BaseUrl + pathname, qs, headers);
    }
    $U(method: restIntf.HTTPMethod, pathname: string, contentInfo: restIntf.ContentInfo, blob: $dr.IReadableBlob, headers?: $dr.HTTPHeaders) : Promise<restIntf.RESTReturn> {
        return this.rootApi.$U(method, this.BaseUrl + pathname, contentInfo, blob, headers);
    }
    mount(mountPath: string) : IAuthorizedApiRoute {
        return new AuthorizedApiRoute(this.rootApi, this.BaseUrl, mountPath);
    }
    createFormData() : $dr.IFormData {return this.rootApi.createFormData();}
}

// base class for all REST api
// support the following events:
// 1. on_access_refreshed(newAccess)
export class AuthorizedRestApi extends events.EventEmitter implements IAuthorizedApi {
    constructor(public $driver:$dr.$Driver, public access?: oauth2.Access, public tokenRefresher?: oauth2.ITokenRefresher) {
        super();
    }
    // convert connect options to access (without tokens)
    static connectOptionsToAccess(connectOptions: restIntf.ConnectOptions) : oauth2.Access {
        let access: oauth2.Access = {};
        if (connectOptions && connectOptions.instance_url) access.instance_url = connectOptions.instance_url;
        if (connectOptions && typeof connectOptions.rejectUnauthorized === 'boolean') access.rejectUnauthorized = connectOptions.rejectUnauthorized;
        return (JSON.stringify(access) === '{}' ? null : access);
    }
    public get refresh_token() : string {
        return (this.access && this.access.refresh_token ? this.access.refresh_token : null); 
    }
    public get instance_url(): string {
        return (this.access && this.access.instance_url ? this.access.instance_url : '');
    }
    public getUrl(pathname:string) : string {
        return this.instance_url + pathname;
    }
    // returns the headers to be used for the API call
    public getHeaders(additionalHeaders?: {[field:string]:string}) : any {
        let headers = additionalHeaders || {};
        let authHeader = oauth2.Utils.getAuthorizationHeaderFormAccessToken(this.access);
        if (authHeader) _.assignIn(headers, {'Authorization' : authHeader});
        return (JSON.stringify(headers) === '{}' ? null : headers);
    }
    public get rejectUnauthorized(): boolean {
        return (this.access && typeof this.access.rejectUnauthorized === 'boolean' ? this.access.rejectUnauthorized : null);
    }
    // returns the call options to be used for the API call
    public getCallOptions(additionalHeaders?: {[field:string]:string}): restIntf.ApiCallOptions {
        let ret: restIntf.ApiCallOptions = {};
        let headers = this.getHeaders(additionalHeaders);
        if (headers) ret.headers = headers;
        if (typeof this.rejectUnauthorized === 'boolean') ret.rejectUnauthorized = this.rejectUnauthorized;
        return (JSON.stringify(ret) === '{}' ? null : ret);
    }

    get RootApi() : AuthorizedRestApi {return this;}
    get BaseUrl() : string {return "";}
    mount(mountPath: string) : IAuthorizedApiRoute {
        return new AuthorizedApiRoute(this, this.BaseUrl, mountPath);
    }

    private executeWorkflow($caller: I$Caller, pathname: string, additionalHeaders?: $dr.HTTPHeaders) : Promise<any> {
        return new Promise<any>((resolve: (value: any)=> void, reject: (err: any) => void) => {
            $caller.call(this.getUrl(pathname), this.getCallOptions(additionalHeaders))
            .then((value: any) => {
                resolve(value);
            }).catch((err: any) => {
                if (this.tokenRefresher && this.refresh_token) {
                    this.tokenRefresher.refreshAccessToken(this.refresh_token)
                    .then((newAccess: oauth2.Access) => {
                        this.access = newAccess;
                        this.emit('on_access_refreshed', newAccess);
                        $caller.call(this.getUrl(pathname), this.getCallOptions(additionalHeaders))
                        .then((value: any) => {
                            resolve(value);
                        }).catch((err: any) => {
                            reject(err);
                        });
                    }).catch((err: any) => {
                        reject(err);
                    });
                } else 
                    reject(err);
            });
        });
    }
    
    // api's $J method
    $J(method: restIntf.HTTPMethod, pathname: string, data: any, headers?: $dr.HTTPHeaders) : Promise<restIntf.RESTReturn> {
        let caller = new $JCaller(this.$driver.$J, method, data);
        return this.executeWorkflow(caller, pathname, headers);
    }
    
    // api's $F method
    $F(method: restIntf.HTTPMethod, pathname: string, formData: $dr.IFormData, headers?: $dr.HTTPHeaders) : Promise<restIntf.RESTReturn> {
        let caller = new $FCaller(this.$driver.$F, method, formData);
        return this.executeWorkflow(caller, pathname, headers);
    }

    // api's $H method
    $H(pathname: string, qs?: any, headers?: $dr.HTTPHeaders) : Promise<restIntf.RESTReturn> {
        let caller = new $HCaller(this.$driver.$H, qs);
        return this.executeWorkflow(caller, pathname, headers);
    }

    // api's $B method
    $B(pathname: string, qs?: any,  headers?: $dr.HTTPHeaders) : Promise<restIntf.RESTReturn> {
        let caller = new $BCaller(this.$driver.$B, qs);
        return this.executeWorkflow(caller, pathname, headers);
    }

    // api's $U method
    $U(method: restIntf.HTTPMethod, pathname: string, contentInfo: restIntf.ContentInfo, blob: $dr.IReadableBlob, headers?: $dr.HTTPHeaders) : Promise<restIntf.RESTReturn> {
        let caller = new $UCaller(this.$driver.$U, method, contentInfo, blob);
        return this.executeWorkflow(caller, pathname, headers);
    }

    // api's $E method
    $E(pathname: string, headers?: $dr.HTTPHeaders) : Promise<$dr.I$EReturn> {
        let caller = new $ECaller(this.$driver.$E);
        return this.executeWorkflow(caller, pathname, headers);
    }

    // api's $M method
    $M(pathname: string, options?: IMessageClientOptions, headers?: $dr.HTTPHeaders) : mc.IMessageClient {
        options = options || defaultMsgClientOptions;
        options = _.assignIn({}, defaultMsgClientOptions, options);
        let eventApiRoute = this.mount(pathname);
        let client = new mc.MessageClient(eventApiRoute.$J.bind(eventApiRoute));
        let retryConnect = () => {
            this.$E(pathname, headers)
            .then((ret: $dr.I$EReturn) => {
                client.attachEventSource(ret);
            }).catch((err: any) => {
                client.emit('error', err);
            });
        };
        client.on('error', (err:any) => {
            setTimeout(retryConnect, options.reconnetIntervalMS);
        });
        retryConnect();
        return client;
    }

    // function to create FormData object
    createFormData(): $dr.IFormData {return this.$driver.createFormData();}
}