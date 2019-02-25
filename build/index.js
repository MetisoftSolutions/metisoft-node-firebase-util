"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const es6_promise_1 = require("es6-promise");
const admin = __importStar(require("firebase-admin"));
let __options = {
    pathToServiceAccountKey: '',
    databaseUrl: '',
    fnGetFirebaseTokenForUser: function (userId) {
        return es6_promise_1.Promise.resolve(userId);
    },
    fnSendPushNotificationDefaultErrorHandler: function (err, userId) {
        console.error(`Error sending push notification to user with ID ${userId}:`);
        console.error(err);
    }
};
function sendPushNotification(options) {
    let firebaseToken;
    if (!__options.fnGetFirebaseTokenForUser) {
        throw new Error('CANT_FIND_fnGetFirebaseTokenForUser');
    }
    return __options.fnGetFirebaseTokenForUser(options.userId)
        .then((_firebaseToken) => {
        if (!_firebaseToken) {
            throw new Error('NO_FIREBASE_TOKEN_FOR_USER');
        }
        firebaseToken = _firebaseToken;
    })
        .then(() => admin.messaging().send(__genFirebaseMessage(firebaseToken, options)))
        .catch((err) => {
        if (!__options.fnSendPushNotificationDefaultErrorHandler) {
            throw err;
        }
        else {
            __options.fnSendPushNotificationDefaultErrorHandler(err, options.userId);
        }
    });
}
exports.sendPushNotification = sendPushNotification;
function __genFirebaseMessage(firebaseToken, options) {
    const message = {
        notification: {
            title: options.title,
            body: options.body
        },
        token: firebaseToken
    };
    if (options.richNotificationOptions) {
        message.data = {
            message: options.body,
            mediaUrl: options.richNotificationOptions.media.url,
            mediaType: options.richNotificationOptions.media.type,
            // Cannot send anything other than a string. This supports data that has a logical structure
            // to it.
            extraData: options.extraData ? JSON.stringify(options.extraData) : ''
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
function init(opts) {
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
exports.init = init;
