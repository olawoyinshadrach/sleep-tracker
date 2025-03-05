// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAugXR5Hi-7O172HIliu2e66wVqgjhvEi4",
  authDomain: "restful-sleep-tracker.firebaseapp.com",
  projectId: "restful-sleep-tracker",
  storageBucket: "restful-sleep-tracker.firebasestorage.app",
  messagingSenderId: "254339015117",
  appId: "1:254339015117:web:ac7645ead009490bd96484",
  measurementId: "G-N3Z3WX9HHK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;