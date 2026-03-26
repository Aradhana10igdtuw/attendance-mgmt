// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZU66NNTC1CIwZx-doWRV9CU06ihnf-g0",
  authDomain: "attendance-mgmt-dev.firebaseapp.com",
  projectId: "attendance-mgmt-dev",
  storageBucket: "attendance-mgmt-dev.firebasestorage.app",
  messagingSenderId: "466233838868",
  appId: "1:466233838868:web:7e0d84227fe6a0bf120601",
  measurementId: "G-HNR235R5PN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);