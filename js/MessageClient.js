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
var EventType;
(function (EventType) {
    EventType[EventType["CONNECT"] = 0] = "CONNECT";
    EventType[EventType["PING"] = 1] = "PING";
    EventType[EventType["MESSAGE"] = 2] = "MESSAGE";
})(EventType = exports.EventType || (exports.EventType = {}));
// Subscription class
var Subscription = (function (_super) {
    __extends(Subscription, _super);
    function Subscription(authorized$J, conn_id, destination, headers, sub_id, cb) {
        var _this = _super.call(this) || this;
        _this.authorized$J = authorized$J;
        _this.conn_id = conn_id;
        _this.destination = destination;
        _this.headers = headers;
        _this.sub_id = sub_id;
        _this.cb = cb;
        return _this;
    }
    Subscription.prototype.ajaxUnsubscribe = function (conn_id, sub_id) {
        var data = {
            conn_id: conn_id,
            sub_id: sub_id
        };
        return this.authorized$J("GET", "/unsubscribe", data);
    };
    Subscription.prototype.unsubscribe = function () {
        var _this = this;
        return this.ajaxUnsubscribe(this.conn_id, this.sub_id)
            .then(function (restReturn) {
            _this.emit('unsubscribed', _this.sub_id);
            return Promise.resolve(restReturn);
        });
    };
    Subscription.prototype.toJSON = function () {
        return {
            destination: this.destination,
            headers: this.headers,
            sub_id: this.sub_id
        };
    };
    return Subscription;
}(events.EventEmitter));
// MessageClient class
var MessageClient = (function (_super) {
    __extends(MessageClient, _super);
    function MessageClient(authorized$J) {
        var _this = _super.call(this) || this;
        _this.authorized$J = authorized$J;
        _this.source = null;
        _this.conn_id = null;
        _this.subscriptions = {};
        _this.sub_id = 0;
        return _this;
    }
    Object.defineProperty(MessageClient.prototype, "OnMessageHandler", {
        get: function () {
            var _this = this;
            var handler = function (message) {
                var msg = JSON.parse(message.data);
                //console.log(JSON.stringify(msg));
                if (msg.headers.event === EventType.PING) {
                    _this.emit('ping');
                }
                else if (msg.headers.event === EventType.CONNECT) {
                    _this.conn_id = msg.headers.conn_id;
                    _this.emit('connect', _this.conn_id);
                }
                else if (msg.headers.event === EventType.MESSAGE) {
                    var sub_id = msg.headers.sub_id;
                    if (_this.subscriptions[sub_id] && typeof _this.subscriptions[sub_id].cb === 'function')
                        (_this.subscriptions[sub_id].cb)(msg);
                }
            };
            return handler.bind(this);
        },
        enumerable: true,
        configurable: true
    });
    MessageClient.prototype.attachEventSource = function ($ERet) {
        var _this = this;
        //this.disconnect();
        this.source = $ERet.eventSrc;
        this.source.onmessage = this.OnMessageHandler;
        this.source.onerror = function (err) {
            _this.disconnect();
            _this.emit('error', err);
        };
        if ($ERet.initMsgs && $ERet.initMsgs.length > 0) {
            for (var i in $ERet.initMsgs) {
                var msg = $ERet.initMsgs[i];
                this.OnMessageHandler(msg);
            }
        }
    };
    Object.defineProperty(MessageClient.prototype, "eventSource", {
        get: function () {
            return this.source;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MessageClient.prototype, "connected", {
        get: function () { return (this.source && this.conn_id ? true : false); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MessageClient.prototype, "connId", {
        get: function () { return this.conn_id; },
        enumerable: true,
        configurable: true
    });
    MessageClient.prototype.validSubscription = function (sub_id) { return (sub_id && this.subscriptions[sub_id] ? true : false); };
    MessageClient.prototype.ajaxSubscribe = function (conn_id, sub_id, destination, headers) {
        var data = {
            conn_id: conn_id,
            sub_id: sub_id,
            destination: destination,
            headers: headers
        };
        return this.authorized$J("POST", "/subscribe", data);
    };
    MessageClient.prototype.ajaxSend = function (conn_id, destination, headers, message) {
        var data = {
            conn_id: conn_id,
            destination: destination,
            headers: headers,
            body: message
        };
        return this.authorized$J("POST", "/send", data);
    };
    Object.defineProperty(MessageClient.prototype, "notConnectReject", {
        get: function () { return Promise.reject({ error: "not_connected", error_description: "not connected" }); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MessageClient.prototype, "badSubscriptionReject", {
        get: function () { return Promise.reject({ error: "invalid_subscription", error_description: "subscription id is bad or invalid" }); },
        enumerable: true,
        configurable: true
    });
    MessageClient.prototype.subscribeImp = function (destination, cb, headers) {
        var _this = this;
        if (headers === void 0) { headers = {}; }
        var this_sub_id = this.sub_id.toString();
        this.sub_id++; // increment the sub_id number
        return this.ajaxSubscribe(this.conn_id, this_sub_id, destination, headers)
            .then(function (restReturn) {
            // subscription is successful, create a new Subscription object
            var subscription = new Subscription(_this.authorized$J, _this.conn_id, destination, headers, this_sub_id, cb);
            subscription.on('unsubscribed', function (sub_id) {
                delete _this.subscriptions[sub_id];
            });
            _this.subscriptions[this_sub_id] = subscription;
            return this_sub_id;
        });
    };
    MessageClient.prototype.subscribe = function (destination, cb, headers) {
        if (headers === void 0) { headers = {}; }
        return (!this.connected ? this.notConnectReject : this.subscribeImp(destination, cb, headers));
    };
    MessageClient.prototype.unsubscribe = function (sub_id) {
        return (!this.connected ? this.notConnectReject : (!this.validSubscription(sub_id) ? this.badSubscriptionReject : this.subscriptions[sub_id].unsubscribe()));
    };
    MessageClient.prototype.unsubscribeAll = function () {
        if (!this.connected)
            return this.notConnectReject;
        else {
            var promises = [];
            var sub_ids = [];
            for (var sub_id in this.subscriptions)
                sub_ids.push(sub_id);
            for (var i in sub_ids) {
                var sub_id = sub_ids[i];
                var subscription = this.subscriptions[sub_id];
                promises.push(subscription.unsubscribe());
            }
            return Promise.all(promises);
        }
    };
    MessageClient.prototype.disconnect = function () {
        if (this.source) {
            this.source.close();
            this.source = null;
            this.conn_id = null;
            this.subscriptions = {};
            this.sub_id = 0;
        }
    };
    MessageClient.prototype.send = function (destination, headers, message) {
        return (!this.connected ? this.notConnectReject : this.ajaxSend(this.conn_id, destination, headers, message));
    };
    return MessageClient;
}(events.EventEmitter));
exports.MessageClient = MessageClient;
