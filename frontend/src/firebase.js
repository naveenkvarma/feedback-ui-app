import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAeqdiMmuav0Zig_UK4HJSMzzFkmbPMDDE",
  authDomain: "feedback-system-b03ee.firebaseapp.com",
  projectId: "feedback-system-b03ee",
  storageBucket: "feedback-system-b03ee.firebasestorage.app",
  messagingSenderId: "391060561865",
  appId: "1:391060561865:web:e6e1b5568b84d7b0ce5218",
  measurementId: "G-YRP9PKH33N"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
