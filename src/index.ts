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
  richNotificationOptions?: IRichNotificationOptions;
  extraData?: any;
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

    .then(() =>
      admin.messaging().send(__genFirebaseMessage(firebaseToken, options)))

    .catch((err: Error) => {
      if (!__options.fnSendPushNotificationDefaultErrorHandler) {
        throw err;
      } else {
        __options.fnSendPushNotificationDefaultErrorHandler(err, options.userId);
      }
    });
}



function __genFirebaseMessage(firebaseToken: string, options: ISendPushNotificationOptions) {
  const message = {
    notification: {
      title: options.title,
      body: options.body
    },
    token: firebaseToken
  } as admin.messaging.Message;

  if (options.richNotificationOptions) {
    message.data = {
      message: options.body,
      mediaUrl: options.richNotificationOptions.media.url,
      mediaType: options.richNotificationOptions.media.type,
      extraData: JSON.stringify(options.extraData)
    };
    // Support for rich notifications on iOS
    message.apns = {
      payload: {
        aps: {
          contentAvailable: true,
          mutableContent: true,
          sound: options.richNotificationOptions.sound || 'default',
          alert: {
            body: options.body,
            title: options.title,
          },
          badge: options.richNotificationOptions.badge,
          category: options.richNotificationOptions.category
        }
      }
    };
  }

  return message;
}



export function init(opts: ConfigurationOptions) {
  if (!opts.pathToServiceAccountKey) {
    throw new Error("pathToServiceAccountKey key in opts required.");
  }

  if (!opts.databaseUrl) {
    throw new Error("databaseUrl key in opts required.");
  }

  __options = Object.assign(__options, opts);

  let serviceAccount = require(__options.pathToServiceAccountKey);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: __options.databaseUrl
  });
}