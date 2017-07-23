import * as restIntf from 'rest-api-interfaces';
import * as $dr from 'rest-driver';

// already authorized and instance-independent interface that returns a <<CONNECTED>> event source (eventSource.IEventSource)
export interface I$E {
    (pathname: string, headers?: restIntf.HTTPHeaders) : Promise<$dr.I$EReturn>;
}

// already authorized and instance-independent interface that makes an ajax/json call - returns promise
export interface I$J {
    (method: restIntf.HTTPMethod, pathname: string, data:any, headers?: restIntf.HTTPHeaders) : Promise<restIntf.RESTReturn>;
}

// already authorized and instance-independent interface that makes an FormData call - returns promise
export interface I$F {
    (method: restIntf.HTTPMethod, pathname: string, formData: $dr.IFormData, headers?: restIntf.HTTPHeaders) : Promise<restIntf.RESTReturn>;
}

// already authorized and instance-independent interface that makes a HEAD call - returns promise
export interface I$H {
    (pathname: string, qs?: any, headers?: restIntf.HTTPHeaders) : Promise<restIntf.RESTReturn>;
}

// already authorized and instance-independent interface that makes a blob download call - returns promise
export interface I$B {
    (pathname: string, qs?: any, headers?: restIntf.HTTPHeaders) : Promise<restIntf.RESTReturn>;
}

// already authorized and instance-independent interface that makes a blob upload call - returns promise
export interface I$U {
    (method: restIntf.HTTPMethod, pathname: string, readableContent: restIntf.ReadableContent<$dr.IReadableBlob>, headers?: restIntf.HTTPHeaders) : Promise<restIntf.RESTReturn>;
}
