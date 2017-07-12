"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events = require("events");
var _ = require("lodash");
var oauth2 = require("oauth2");
var mc = require("./MessageClient");
// make sure the environment has the Promise object in the global space
require("es6-promise").polyfill();
var MessageClient_1 = require("./MessageClient");
exports.MessageEventType = MessageClient_1.EventType;
var defaultMsgClientOptions = {
    reconnetIntervalMS: 5000
};
var $JCaller = (function () {
    function $JCaller($J, method, data) {
        this.$J = $J;
        this.method = method;
        this.data = data;
    }
    $JCaller.prototype.call = function (url, callOptions) {
        return this.$J(this.method, url, this.data, callOptions);
    };
    return $JCaller;
}());
var $ECaller = (function () {
    function $ECaller($E) {
        this.$E = $E;
    }
    $ECaller.prototype.call = function (url, callOptions) {
        return this.$E(url, callOptions);
    };
    return $ECaller;
}());
var $FCaller = (function () {
    function $FCaller($F, method, formData) {
        this.$F = $F;
        this.method = method;
        this.formData = formData;
    }
    $FCaller.prototype.call = function (url, callOptions) {
        return this.$F(this.method, url, this.formData, callOptions);
    };
    return $FCaller;
}());
var $HCaller = (function () {
    function $HCaller($H, qs) {
        this.$H = $H;
        this.qs = qs;
    }
    $HCaller.prototype.call = function (url, callOptions) {
        return this.$H(url, this.qs, callOptions);
    };
    return $HCaller;
}());
var $BCaller = (function () {
    function $BCaller($B, qs) {
        this.$B = $B;
        this.qs = qs;
    }
    $BCaller.prototype.call = function (url, callOptions) {
        return this.$B(url, this.qs, callOptions);
    };
    return $BCaller;
}());
var $UCaller = (function () {
    function $UCaller($U, method, contentInfo, blob) {
        this.$U = $U;
        this.method = method;
        this.contentInfo = contentInfo;
        this.blob = blob;
    }
    $UCaller.prototype.call = function (url, callOptions) {
        return this.$U(this.method, url, this.contentInfo, this.blob, callOptions);
    };
    return $UCaller;
}());
var AuthorizedApiRoute = (function () {
    function AuthorizedApiRoute(rootApi, parentBaseUrl, mountPath) {
        this.rootApi = rootApi;
        this.parentBaseUrl = parentBaseUrl;
        this.mountPath = mountPath;
    }
    Object.defineProperty(AuthorizedApiRoute.prototype, "RootApi", {
        get: function () { return this.rootApi; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AuthorizedApiRoute.prototype, "BaseUrl", {
        get: function () {
            var s = this.parentBaseUrl + this.mountPath;
            if (s.length >= 1 && s.substr(s.length - 1, 1) === "/")
                s = s.substr(0, s.length - 1); // remove the last "/"
            return s;
        },
        enumerable: true,
        configurable: true
    });
    AuthorizedApiRoute.prototype.$J = function (method, pathname, data, headers) {
        return this.rootApi.$J(method, this.BaseUrl + pathname, data, headers);
    };
    AuthorizedApiRoute.prototype.$F = function (method, pathname, formData, headers) {
        return this.rootApi.$F(method, this.BaseUrl + pathname, formData, headers);
    };
    AuthorizedApiRoute.prototype.$H = function (pathname, qs, headers) {
        return this.rootApi.$H(this.BaseUrl + pathname, qs, headers);
    };
    AuthorizedApiRoute.prototype.$B = function (pathname, qs, headers) {
        return this.rootApi.$B(this.BaseUrl + pathname, qs, headers);
    };
    AuthorizedApiRoute.prototype.$U = function (method, pathname, contentInfo, blob, headers) {
        return this.rootApi.$U(method, this.BaseUrl + pathname, contentInfo, blob, headers);
    };
    AuthorizedApiRoute.prototype.mount = function (mountPath) {
        return new AuthorizedApiRoute(this.rootApi, this.BaseUrl, mountPath);
    };
    AuthorizedApiRoute.prototype.createFormData = function () { return this.rootApi.createFormData(); };
    return AuthorizedApiRoute;
}());
// base class for all REST api
// support the following events:
// 1. on_access_refreshed(newAccess)
var AuthorizedRestApi = (function (_super) {
    __extends(AuthorizedRestApi, _super);
    function AuthorizedRestApi($driver, access, tokenRefresher) {
        var _this = _super.call(this) || this;
        _this.$driver = $driver;
        _this.access = access;
        _this.tokenRefresher = tokenRefresher;
        return _this;
    }
    // convert connect options to access (without tokens)
    AuthorizedRestApi.connectOptionsToAccess = function (connectOptions) {
        var access = {};
        if (connectOptions && connectOptions.instance_url)
            access.instance_url = connectOptions.instance_url;
        if (connectOptions && typeof connectOptions.rejectUnauthorized === 'boolean')
            access.rejectUnauthorized = connectOptions.rejectUnauthorized;
        return (JSON.stringify(access) === '{}' ? null : access);
    };
    Object.defineProperty(AuthorizedRestApi.prototype, "refresh_token", {
        get: function () {
            return (this.access && this.access.refresh_token ? this.access.refresh_token : null);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AuthorizedRestApi.prototype, "instance_url", {
        get: function () {
            return (this.access && this.access.instance_url ? this.access.instance_url : '');
        },
        enumerable: true,
        configurable: true
    });
    AuthorizedRestApi.prototype.getUrl = function (pathname) {
        return this.instance_url + pathname;
    };
    // returns the headers to be used for the API call
    AuthorizedRestApi.prototype.getHeaders = function (additionalHeaders) {
        var headers = additionalHeaders || {};
        var authHeader = oauth2.Utils.getAuthorizationHeaderFormAccessToken(this.access);
        if (authHeader)
            _.assignIn(headers, { 'Authorization': authHeader });
        return (JSON.stringify(headers) === '{}' ? null : headers);
    };
    Object.defineProperty(AuthorizedRestApi.prototype, "rejectUnauthorized", {
        get: function () {
            return (this.access && typeof this.access.rejectUnauthorized === 'boolean' ? this.access.rejectUnauthorized : null);
        },
        enumerable: true,
        configurable: true
    });
    // returns the call options to be used for the API call
    AuthorizedRestApi.prototype.getCallOptions = function (additionalHeaders) {
        var ret = {};
        var headers = this.getHeaders(additionalHeaders);
        if (headers)
            ret.headers = headers;
        if (typeof this.rejectUnauthorized === 'boolean')
            ret.rejectUnauthorized = this.rejectUnauthorized;
        return (JSON.stringify(ret) === '{}' ? null : ret);
    };
    Object.defineProperty(AuthorizedRestApi.prototype, "RootApi", {
        get: function () { return this; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AuthorizedRestApi.prototype, "BaseUrl", {
        get: function () { return ""; },
        enumerable: true,
        configurable: true
    });
    AuthorizedRestApi.prototype.mount = function (mountPath) {
        return new AuthorizedApiRoute(this, this.BaseUrl, mountPath);
    };
    AuthorizedRestApi.prototype.executeWorkflow = function ($caller, pathname, additionalHeaders) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            $caller.call(_this.getUrl(pathname), _this.getCallOptions(additionalHeaders))
                .then(function (value) {
                resolve(value);
            }).catch(function (err) {
                if (_this.tokenRefresher && _this.refresh_token) {
                    _this.tokenRefresher.refreshAccessToken(_this.refresh_token)
                        .then(function (newAccess) {
                        _this.access = newAccess;
                        _this.emit('on_access_refreshed', newAccess);
                        $caller.call(_this.getUrl(pathname), _this.getCallOptions(additionalHeaders))
                            .then(function (value) {
                            resolve(value);
                        }).catch(function (err) {
                            reject(err);
                        });
                    }).catch(function (err) {
                        reject(err);
                    });
                }
                else
                    reject(err);
            });
        });
    };
    // api's $J method
    AuthorizedRestApi.prototype.$J = function (method, pathname, data, headers) {
        var caller = new $JCaller(this.$driver.$J, method, data);
        return this.executeWorkflow(caller, pathname, headers);
    };
    // api's $F method
    AuthorizedRestApi.prototype.$F = function (method, pathname, formData, headers) {
        var caller = new $FCaller(this.$driver.$F, method, formData);
        return this.executeWorkflow(caller, pathname, headers);
    };
    // api's $H method
    AuthorizedRestApi.prototype.$H = function (pathname, qs, headers) {
        var caller = new $HCaller(this.$driver.$H, qs);
        return this.executeWorkflow(caller, pathname, headers);
    };
    // api's $B method
    AuthorizedRestApi.prototype.$B = function (pathname, qs, headers) {
        var caller = new $BCaller(this.$driver.$B, qs);
        return this.executeWorkflow(caller, pathname, headers);
    };
    // api's $U method
    AuthorizedRestApi.prototype.$U = function (method, pathname, contentInfo, blob, headers) {
        var caller = new $UCaller(this.$driver.$U, method, contentInfo, blob);
        return this.executeWorkflow(caller, pathname, headers);
    };
    // api's $E method
    AuthorizedRestApi.prototype.$E = function (pathname, headers) {
        var caller = new $ECaller(this.$driver.$E);
        return this.executeWorkflow(caller, pathname, headers);
    };
    // api's $M method
    AuthorizedRestApi.prototype.$M = function (pathname, options, headers) {
        var _this = this;
        options = options || defaultMsgClientOptions;
        options = _.assignIn({}, defaultMsgClientOptions, options);
        var eventApiRoute = this.mount(pathname);
        var client = new mc.MessageClient(eventApiRoute.$J.bind(eventApiRoute));
        var retryConnect = function () {
            _this.$E(pathname, headers)
                .then(function (ret) {
                client.attachEventSource(ret);
            }).catch(function (err) {
                client.emit('error', err);
            });
        };
        client.on('error', function (err) {
            setTimeout(retryConnect, options.reconnetIntervalMS);
        });
        retryConnect();
        return client;
    };
    // function to create FormData object
    AuthorizedRestApi.prototype.createFormData = function () { return this.$driver.createFormData(); };
    return AuthorizedRestApi;
}(events.EventEmitter));
exports.AuthorizedRestApi = AuthorizedRestApi;
