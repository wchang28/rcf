import * as events from 'events';
import * as restIntf from 'rest-api-interfaces';
import * as eventSource from 'eventsource-typings';
import * as authorized$ from './authorized$';
import {I$EReturn} from 'rest-driver';

export enum EventType {
    CONNECT = 0,
    PING = 1,
    MESSAGE = 2
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
    (msg: IMessage) : void;
}

export type CommandPath = "/subscribe" | "/unsubscribe" | "/send";

export interface SubscriptionJSON {
    destination: string;
    headers: {[field:string]: any};
    sub_id: string;
}

// Subscription interface
export interface ISubscription {
    readonly destination: string;
    readonly headers: {[field:string]: any};
    readonly sub_id: string;
    readonly cb: MessageCallback;
    unsubscribe() : Promise<restIntf.RESTReturn>;
    toJSON() : SubscriptionJSON;
    on(event: "unsubscribed", listener: (sub_id: string) => void) : this;
}

// Subscription class
class Subscription extends events.EventEmitter implements ISubscription {
    constructor(private authorized$J: authorized$.I$J, private conn_id: string, public destination: string, public headers:{[field:string]: any}, public sub_id: string, public cb: MessageCallback) {
        super();
    }
    private ajaxUnsubscribe(conn_id: string, sub_id: string) : Promise<restIntf.RESTReturn> {
        let data = {
            conn_id: conn_id
            ,sub_id: sub_id
        };
        return this.authorized$J("GET", "/unsubscribe", data);
    }
    unsubscribe() : Promise<restIntf.RESTReturn> {
        return this.ajaxUnsubscribe(this.conn_id, this.sub_id)
        .then((restReturn: restIntf.RESTReturn) => {
            this.emit('unsubscribed', this.sub_id);
            return Promise.resolve<restIntf.RESTReturn>(restReturn);
        });
    }
    toJSON() : SubscriptionJSON {
        return {
            destination: this.destination
            ,headers: this.headers
            ,sub_id: this.sub_id
        };
    }
}

// MessageClient interface
export interface IMessageClient {
    readonly connected: boolean;
    readonly connId: string;
    readonly subscriptions: {[sub_id: string]: ISubscription;};
    validSubscription(sub_id: string) : boolean;
    subscribe(destination: string, cb: MessageCallback, headers?:{[field:string]: any}) : Promise<string>;
    unsubscribe(sub_id: string) : Promise<restIntf.RESTReturn>;
    unsubscribeAll() : Promise<restIntf.RESTReturn[]>;
    send(destination:string, headers: {[field:string]:any}, message:any) : Promise<restIntf.RESTReturn>;
    disconnect() : void;
    on(event: "ping", listener: () => void) : this;
    on(event: "connect", listener: (conn_id: string) => void) : this;
    on(event: "error", listener: (err: any) => void) : this;
}

// MessageClient class
export class MessageClient extends events.EventEmitter implements IMessageClient {
    private source: eventSource.IEventSource = null;
    private conn_id: string = null;
    public subscriptions: {[sub_id: string]: ISubscription;} = {};
    private sub_id: number = 0;
    constructor(private authorized$J: authorized$.I$J) {
        super();
    }

    private get OnMessageHandler() : (message: eventSource.Message) => void {
        let handler = (message: eventSource.Message) => {
            let msg: IMessage = JSON.parse(message.data);
            //console.log(JSON.stringify(msg));
            if (msg.headers.event === EventType.PING) {
                this.emit('ping');
            } else if (msg.headers.event === EventType.CONNECT) {
                this.conn_id = msg.headers.conn_id;
                this.emit('connect', this.conn_id);
            } else if (msg.headers.event === EventType.MESSAGE) {
                let sub_id = msg.headers.sub_id;
                if (this.subscriptions[sub_id] && typeof this.subscriptions[sub_id].cb === 'function') (this.subscriptions[sub_id].cb)(msg);
            }
        };
        return handler.bind(this);
    }
    attachEventSource($ERet: I$EReturn) {
        //this.disconnect();
        this.source = $ERet.eventSrc;
        this.source.onmessage = this.OnMessageHandler;
        this.source.onerror = (err: eventSource.Error) => {
            this.disconnect();
            this.emit('error', err);
        };
        if ($ERet.initMsgs && $ERet.initMsgs.length > 0) {
            for (let i in $ERet.initMsgs) {
                let msg = $ERet.initMsgs[i];
                this.OnMessageHandler(msg);
            }
        }       
    }
    get eventSource():eventSource.IEventSource {
        return this.source;
    }
    get connected() : boolean {return (this.source && this.conn_id ? true : false);}
    get connId() : string {return this.conn_id;}
    validSubscription(sub_id: string) : boolean {return (sub_id && this.subscriptions[sub_id] ? true : false);}

    private ajaxSubscribe(conn_id: string, sub_id: string, destination: string, headers: {[field:string]: any}) : Promise<restIntf.RESTReturn> {
        let data = {
            conn_id: conn_id,
            sub_id: sub_id,
            destination: destination,
            headers: headers
        };
        return this.authorized$J("POST", "/subscribe", data);
    }
    
    private ajaxSend(conn_id: string, destination: string, headers: { [field: string]: any}, message: any) : Promise<restIntf.RESTReturn> {
        let data = {
            conn_id: conn_id,
            destination: destination,
            headers: headers,
            body: message
        };
        return this.authorized$J("POST", "/send", data);
    }
		
    private get notConnectReject() : Promise<any> {return Promise.reject({error: "not_connected", error_description: "not connected"});}
    private get badSubscriptionReject() : Promise<any> {return Promise.reject({error: "invalid_subscription", error_description: "subscription id is bad or invalid"});}
    
    private subscribeImp(destination: string, cb: MessageCallback, headers:{[field:string]: any} = {}): Promise<string> {
        let this_sub_id = this.sub_id.toString();
        this.sub_id++;  // increment the sub_id number
        return this.ajaxSubscribe(this.conn_id, this_sub_id, destination, headers)
        .then((restReturn: restIntf.RESTReturn) => {
            // subscription is successful, create a new Subscription object
            let subscription: ISubscription = new Subscription(this.authorized$J, this.conn_id, destination, headers, this_sub_id, cb);
            subscription.on('unsubscribed', (sub_id: string) => {
                delete this.subscriptions[sub_id];
            });
            this.subscriptions[this_sub_id] = subscription;
            return this_sub_id;
        });
    }

    subscribe(destination: string, cb: MessageCallback, headers:{[field:string]: any} = {}) : Promise<string> {
        return (!this.connected ? this.notConnectReject : this.subscribeImp(destination, cb, headers));
    }

    unsubscribe(sub_id: string) : Promise<restIntf.RESTReturn> {
        return (!this.connected ? this.notConnectReject : (!this.validSubscription(sub_id) ? this.badSubscriptionReject: this.subscriptions[sub_id].unsubscribe()));
    }

    unsubscribeAll() : Promise<restIntf.RESTReturn[]> {
        if (!this.connected)
            return this.notConnectReject;
        else {
            let promises: Promise<restIntf.RESTReturn>[] = [];
            let sub_ids: string[] = [];
            for (let sub_id in this.subscriptions)
                sub_ids.push(sub_id);
            for (let i in sub_ids) {
                let sub_id = sub_ids[i];
                let subscription = this.subscriptions[sub_id];
                promises.push(subscription.unsubscribe());
            }
            return Promise.all(promises);
        }
    }

    disconnect() : void {
        if (this.source) {
            this.source.close();
            this.source = null;
            this.conn_id = null;
            this.subscriptions = {};
            this.sub_id = 0;
        }
    }

    send(destination:string, headers: {[field:string]:any}, message:any) : Promise<restIntf.RESTReturn> {
        return (!this.connected ? this.notConnectReject : this.ajaxSend(this.conn_id, destination, headers, message));
    }
}