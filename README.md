# metisoft-node-firebase-util

This module provides an abstraction over the `firebase-admin` module to better suit Metisoft server applications written in Node.js.

## Installation

1. `npm i https://github.com/MetisoftSolutions/metisoft-node-firebase-util.git`
2. In your server's initialization code, make a call to `firebaseUtil.init()`, which requires at least `pathToServiceAccountKey` and `databaseUrl` to be set in the options argument.

`pathToServiceAccountKey` should be the **full** path to the `serviceAccountKey.json` file that you should get from the Firebase Console. You can get this key from Project Settings -> Service Accounts -> Firebase Admin SDK -> Generate New Private Key.

`databaseUrl` is the URL to the Firebase database for your app. This can also be found on the Firebase Admin SDK page.

## Usage

### Push notifications

You can send push notifications using `firebaseUtil.sendPushNotification()`. The first argument is some form of user ID. By default, this is a Firebase token. However, if you supply a function to the configuration options object's `fnGetFirebaseTokenForUser` key in the `init()` call, then you can pass in a user ID native to your user authentication system. This relies on you defining your `fnGetFirebaseTokenForUser` function to return a Firebase token when given a user ID.

To customize handling of `sendPushNotifications()` errors, supply a function value for `fnSendPushNotificationDefaultErrorHandler` in the `init()` options object.