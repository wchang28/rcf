import * as restIntf from 'rest-api-interfaces';
import * as $dr from 'rest-driver';
export interface I$E {
    (pathname: string, headers?: restIntf.HTTPHeaders): Promise<$dr.I$EReturn>;
}
export interface I$J {
    (method: restIntf.HTTPMethod, pathname: string, data: any, headers?: restIntf.HTTPHeaders): Promise<restIntf.RESTReturn>;
}
export interface I$F {
    (method: restIntf.HTTPMethod, pathname: string, formData: $dr.IFormData, headers?: restIntf.HTTPHeaders): Promise<restIntf.RESTReturn>;
}
export interface I$H {
    (pathname: string, qs?: any, headers?: restIntf.HTTPHeaders): Promise<restIntf.RESTReturn>;
}
export interface I$B {
    (pathname: string, qs?: any, headers?: restIntf.HTTPHeaders): Promise<restIntf.RESTReturn>;
}
export interface I$U {
    (method: restIntf.HTTPMethod, pathname: string, readableContent: restIntf.ReadableContent<$dr.IReadableBlob>, progressCB: $dr.ProgressCallback, headers?: restIntf.HTTPHeaders): Promise<restIntf.RESTReturn>;
}
