# RPS Take Over

Rock / paper / scissors puzzle game for iOS, Android, and web. Built with Expo.

Place a limited number of the winner type on empty cells. Pieces then spread to 4-way neighbors each tick (winner type first). Rock takes scissors, scissors take paper, paper takes rock. No-rock / no-paper / no-scissors tiles block that type. You win when every non-wall cell is the winner type.

## Run

```bash
npm install
npm test
npm run web
```

Also: `npm run ios` / `npm run android`.

## Auth and levels

Without Firebase env vars the app uses **local device accounts** (AsyncStorage) so you can play, create, and explore on one device.

For production, create a Firebase project, enable Email/Password auth, create a Firestore database, deploy `firestore.rules` + `firestore.indexes.json`, then set:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Copy `.env.example` to `.env` locally. Signup is username + email + password. Login accepts email or username.
