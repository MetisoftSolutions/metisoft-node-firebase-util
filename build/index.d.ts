import Promise = require('bluebird');
export interface ConfigurationOptions {
    pathToServiceAccountKey: string;
    databaseUrl: string;
    fnGetFirebaseTokenForUser?: (userId: string) => Promise<string>;
    fnSendPushNotificationDefaultErrorHandler?: (err: Error, userId: string) => void;
}
export declare function sendPushNotification(userId: string, title: string, body: string): Promise<string | void>;
export declare function init(opts: ConfigurationOptions): void;
