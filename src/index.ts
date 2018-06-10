import Promise = require('bluebird');
import admin = require('firebase-admin');



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



let options: ConfigurationOptions = {
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
  if (!opts.pathToServiceAccountKey) {
    throw new Error("pathToServiceAccountKey key in opts required.");
  }

  if (!opts.databaseUrl) {
    throw new Error("databaseUrl key in opts required.");
  }

  options = Object.assign(options, opts);

  let serviceAccount = require(options.pathToServiceAccountKey);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: options.databaseUrl
  });
}