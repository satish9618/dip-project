// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCgHVsYZOWWHZ73KvKWucrZsbA3wfIr9qs",
  authDomain: "dr-animal-64f85.firebaseapp.com",
  projectId: "dr-animal-64f85",
  storageBucket: "dr-animal-64f85.firebasestorage.app",
  messagingSenderId: "796791539003",
  appId: "1:796791539003:web:43c70d3108cece2c1f631e",
  measurementId: "G-GJX8FKSFPH"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ✅ Initialize and export Firestore
const db = getFirestore(app);
export { db };
