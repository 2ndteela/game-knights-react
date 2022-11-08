// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
require('firebase/database');
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
// const analytics = getAnalytics(app);

export default app