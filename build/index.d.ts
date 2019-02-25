import { Promise } from 'es6-promise';
/**
 * `pathToServiceAccountKey` should be a full path to a `serviceAccountKey.json` file.
 *
 * `databaseUrl` is the URL to the Firebase database for the app.
 *
 * `fnGetFirebaseTokenForUser` will be called to retrieve the Firebase token associated with a given
 * user ID from the app's authentication system.
 *
 * `fnSendPushNotificationDefaultErrorHandler` will be called when calling `sendPushNotification()`
 * results in an error.
 */
export interface ConfigurationOptions {
    pathToServiceAccountKey: string;
    databaseUrl: string;
    fnGetFirebaseTokenForUser?: (userId: string) => Promise<string>;
    fnSendPushNotificationDefaultErrorHandler?: (err: Error, userId: string) => void;
}
export declare type IMediaType = 'video' | 'gif' | 'image' | 'audio';
export interface IMedia {
    url: string;
    type: IMediaType;
}
export interface IRichNotificationOptions {
    media: IMedia;
    category: string;
    badge: number;
    sound?: string;
}
export interface ISendPushNotificationOptions {
    userId: string;
    title: string;
    body: string;
    richNotificationOptions?: IRichNotificationOptions;
    extraData?: any;
}
export declare function sendPushNotification(options: ISendPushNotificationOptions): Promise<string | void>;
export declare function init(opts: ConfigurationOptions): void;
