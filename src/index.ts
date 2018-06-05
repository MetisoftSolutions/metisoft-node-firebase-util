import Promise = require('bluebird');
import admin = require('firebase-admin');

export interface ConfigurationOptions {
  fnGetFirebaseTokenForUser?: (userId: string) => Promise<string>;
  fnSendPushNotificationDefaultErrorHandler?: (err: Error, userId: string) => void;
}

let options: ConfigurationOptions = {
      fnGetFirebaseTokenForUser: function(userId: string): Promise<string> {
        return Promise.resolve(userId);
      },

      fnSendPushNotificationDefaultErrorHandler: function(err: Error, userId: string) {
        console.error(`Error sending push notification to user with ID ${userId}:`);
        console.error(err);
      }
    };

export function sendPushNotification(userId: string, title: string, body: string): Promise<string|void> {
  let firebaseToken: string;

  if (!options.fnGetFirebaseTokenForUser) {
    throw new Error('CANT_FIND_fnGetFirebaseTokenForUser');
  }

  return options.fnGetFirebaseTokenForUser(userId)

    .then((_firebaseToken: string|null) => {
      if (!_firebaseToken) {
        throw new Error('NO_FIREBASE_TOKEN_FOR_USER');
      }
      firebaseToken = _firebaseToken;
    })

    .then(() => {
      let message = {
            notification: {
              title,
              body
            },
            token: firebaseToken
          };

      return admin.messaging().send(message);
    })

    .catch((err: Error) => {
      if (!options.fnSendPushNotificationDefaultErrorHandler) {
        throw err;
      } else {
        options.fnSendPushNotificationDefaultErrorHandler(err, userId);
      }
    });
}

export function init(opts: ConfigurationOptions) {
  options = Object.assign(options, opts);
}