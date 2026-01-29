// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCIIQsDEVLsfpnwQvsdJFTIul4jBHbdN6Q",
  authDomain: "my-reference-app-ac8a9.firebaseapp.com",
  projectId: "my-reference-app-ac8a9",
  storageBucket: "my-reference-app-ac8a9.firebasestorage.app",
  messagingSenderId: "110316288915",
  appId: "1:110316288915:web:08887d774591826662c666",
  measurementId: "G-GQPJ8JEEZ1",
};

// Initialize Firebase
// const analytics = getAnalytics(app);
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
