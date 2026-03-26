import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDZU66NNTC1CIwZx-doWRV9CU06ihnf-g0",
  authDomain: "attendance-mgmt-dev.firebaseapp.com",
  projectId: "attendance-mgmt-dev",
  storageBucket: "attendance-mgmt-dev.firebasestorage.app",
  messagingSenderId: "466233838868",
  appId: "1:466233838868:web:7e0d84227fe6a0bf120601"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)