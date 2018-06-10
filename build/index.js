"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const admin = require("firebase-admin");
let options = {
    pathToServiceAccountKey: '',
    databaseUrl: '',
    fnGetFirebaseTokenForUser: function (userId) {
        return Promise.resolve(userId);
    },
    fnSendPushNotificationDefaultErrorHandler: function (err, userId) {
        console.error(`Error sending push notification to user with ID ${userId}:`);
        console.error(err);
    }
};
function sendPushNotification(userId, title, body) {
    let firebaseToken;
    if (!options.fnGetFirebaseTokenForUser) {
        throw new Error('CANT_FIND_fnGetFirebaseTokenForUser');
    }
    return options.fnGetFirebaseTokenForUser(userId)
        .then((_firebaseToken) => {
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
        .catch((err) => {
        if (!options.fnSendPushNotificationDefaultErrorHandler) {
            throw err;
        }
        else {
            options.fnSendPushNotificationDefaultErrorHandler(err, userId);
        }
    });
}
exports.sendPushNotification = sendPushNotification;
function init(opts) {
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
exports.init = init;
