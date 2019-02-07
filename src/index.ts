import {Promise} from 'es6-promise';
import * as admin from 'firebase-admin';



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



let __options: ConfigurationOptions = {
  pathToServiceAccountKey: '',
  databaseUrl: '',

  fnGetFirebaseTokenForUser: function(userId: string): Promise<string> {
    return Promise.resolve(userId);
  },

  fnSendPushNotificationDefaultErrorHandler: function(err: Error, userId: string) {
    console.error(`Error sending push notification to user with ID ${userId}:`);
    console.error(err);
  }
};



export type IMediaType = 'video' | 'gif' | 'image' | 'audio';

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
  richOptions?: IRichNotificationOptions;
}

export function sendPushNotification(options: ISendPushNotificationOptions): Promise<string | void> {
  let firebaseToken: string;

  if (!__options.fnGetFirebaseTokenForUser) {
    throw new Error('CANT_FIND_fnGetFirebaseTokenForUser');
  }

  return __options.fnGetFirebaseTokenForUser(options.userId)

    .then((_firebaseToken: string | null) => {
      if (!_firebaseToken) {
        throw new Error('NO_FIREBASE_TOKEN_FOR_USER');
      }
      firebaseToken = _firebaseToken;
    })

    .then(() => {
      let message = {
        notification: {
          title: options.title,
          body: options.body
        },
        token: firebaseToken
      } as admin.messaging.Message;

      if (options.richOptions) {
        message.data = {
          message: options.body,
          mediaUrl: options.richOptions.media.url,
          mediaType: options.richOptions.media.type
        };
        // Support for rich notifications on iOS
        message.apns = {
          payload: {
            aps: {
              contentAvailable: true,
              mutableContent: true,
              sound: options.richOptions.sound || 'default',
              alert: {
                body: options.body,
                title: options.title,
              },
              badge: options.richOptions.badge,
              category: options.richOptions.category
            }
          }
        };
      }

      return admin.messaging().send(message);
    })

    .catch((err: Error) => {
      if (!__options.fnSendPushNotificationDefaultErrorHandler) {
        throw err;
      } else {
        __options.fnSendPushNotificationDefaultErrorHandler(err, options.userId);
      }
    });
}



export function init(opts: ConfigurationOptions) {
  if (!opts.pathToServiceAccountKey) {
    throw new Error("pathToServiceAccountKey key in opts required.");
  }

  if (!opts.databaseUrl) {
    throw new Error("databaseUrl key in opts required.");
  }

  __options = Object.assign(__options, opts);

  let serviceAccount = require(opts.pathToServiceAccountKey);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: opts.databaseUrl
  });
}