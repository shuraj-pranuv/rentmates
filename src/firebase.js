

// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCql-RSQq9Rt2npeTBNvNbEwJmQ8rfgrXM",
  authDomain: "rentmates-ver1.firebaseapp.com",
  projectId: "rentmates-ver1",
  storageBucket: "rentmates-ver1.firebasestorage.app",
  messagingSenderId: "197528175717",
  appId: "1:197528175717:web:d76b448e46fe2f33a9f28c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
