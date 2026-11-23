// Firebase setup. Web API keys are public identifiers, not secrets; access is enforced by
// firestore.rules (see the repo root).
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0YGrLl-xrGYgIMJjqnKZ1UwkxEPflmHk",
  authDomain: "roll-for-real-app.firebaseapp.com",
  projectId: "roll-for-real-app",
  storageBucket: "roll-for-real-app.firebasestorage.app",
  messagingSenderId: "800440893791",
  appId: "1:800440893791:web:58cc42072209b0304ab6ea",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
