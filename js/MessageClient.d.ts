/// <reference types="node" />
import * as events from 'events';
import * as restIntf from 'rest-api-interfaces';
import * as eventSource from 'eventsource-typings';
import * as authorized$ from './authorized$';
import { I$EReturn } from 'rest-driver';
export declare enum EventType {
    CONNECT = 0,
    PING = 1,
    MESSAGE = 2,
}
export interface IMsgHeaders {
    event: EventType;
    conn_id?: string;
    sub_id?: string;
    destination?: string;
}
export interface IMessage {
    headers: IMsgHeaders;
    body?: any;
}
export interface MessageCallback {
    (msg: IMessage): void;
}
export declare type CommandPath = "/subscribe" | "/unsubscribe" | "/send";
export interface SubscriptionJSON {
    destination: string;
    headers: {
        [field: string]: any;
    };
    sub_id: string;
}
export interface ISubscription {
    readonly destination: string;
    readonly headers: {
        [field: string]: any;
    };
    readonly sub_id: string;
    readonly cb: MessageCallback;
    unsubscribe: () => Promise<restIntf.RESTReturn>;
    toJSON: () => SubscriptionJSON;
}
export interface IMessageClient {
    readonly connected: boolean;
    readonly connId: string;
    readonly subscriptions: {
        [sub_id: string]: ISubscription;
    };
    validSubscription: (sub_id: string) => boolean;
    subscribe: (destination: string, cb: MessageCallback, headers?: {
        [field: string]: any;
    }) => Promise<string>;
    unsubscribe: (sub_id: string) => Promise<restIntf.RESTReturn>;
    unsubscribeAll: () => Promise<restIntf.RESTReturn[]>;
    send: (destination: string, headers: {
        [field: string]: any;
    }, message: any) => Promise<restIntf.RESTReturn>;
    disconnect: () => void;
    on: (event: string, listener: Function) => this;
}
export declare class MessageClient extends events.EventEmitter implements IMessageClient {
    private authorized$J;
    private source;
    private conn_id;
    subscriptions: {
        [sub_id: string]: ISubscription;
    };
    private sub_id;
    constructor(authorized$J: authorized$.I$J);
    private readonly OnMessageHandler;
    attachEventSource($ERet: I$EReturn): void;
    readonly eventSource: eventSource.IEventSource;
    readonly connected: boolean;
    readonly connId: string;
    validSubscription(sub_id: string): boolean;
    private ajaxSubscribe(conn_id, sub_id, destination, headers);
    private ajaxSend(conn_id, destination, headers, message);
    private readonly notConnectReject;
    private readonly badSubscriptionReject;
    private subscribeImp(destination, cb, headers?);
    subscribe(destination: string, cb: MessageCallback, headers?: {
        [field: string]: any;
    }): Promise<string>;
    unsubscribe(sub_id: string): Promise<restIntf.RESTReturn>;
    unsubscribeAll(): Promise<restIntf.RESTReturn[]>;
    disconnect(): void;
    send(destination: string, headers: {
        [field: string]: any;
    }, message: any): Promise<restIntf.RESTReturn>;
}
