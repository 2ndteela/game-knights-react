// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAI, GoogleAIBackend } from "firebase/ai";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDPLyYKmxXjSYuDvdOODQP42_6fB5c71ro",
  authDomain: "gameknights-4367f.firebaseapp.com",
  databaseURL: "https://gameknights-4367f-default-rtdb.firebaseio.com",
  projectId: "gameknights-4367f",
  storageBucket: "gameknights-4367f.appspot.com",
  messagingSenderId: "284824312395",
  appId: "1:284824312395:web:ec21ec21e46dc0493f0bce",
  measurementId: "G-EX8S64W8HK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// App Check attests that requests come from this app on its own domain, rather
// than from anyone who copied the config above out of the bundle. The story
// generator is the reason it is here: without it the Gemini proxy is open to
// whoever finds it, and Firebase AI Logic starts enforcing App Check anyway on
// 2026-11-02.
//
// The reCAPTCHA site key is public like the rest of the config -- it is only
// valid for the domains it was registered to -- so it ships in the bundle. It is
// read from the environment because it differs per Firebase project, and it is
// optional so a fresh checkout still runs the games without one.
const appCheckSiteKey = import.meta.env.VITE_APPCHECK_SITE_KEY

if (appCheckSiteKey) {
  // A localhost origin cannot pass reCAPTCHA, so development asks the SDK for a
  // debug token instead. It prints one to the console on first run; registering
  // that token in the Firebase console lets `npm start` reach the AI backend.
  if (import.meta.env.DEV) globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true
  })
}

// Exporting the database instance keeps every caller from depending on
// initializeApp having already run somewhere else in the import graph.
export const database = getDatabase(app);

// The Gemini Developer API backend, which is the one with a free tier and the
// only one that works without a billing account. Firebase holds the API key, so
// nothing secret ends up in the bundle.
export const ai = getAI(app, { backend: new GoogleAIBackend() });

export default app
