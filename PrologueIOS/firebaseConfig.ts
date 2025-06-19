import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBYUD1AZoCCLBGpICzMJ7dvwrsFeF0UWwQ",
  authDomain: "prologue-16d46.firebaseapp.com",
  projectId: "prologue-16d46",
  storageBucket: "prologue-16d46.appspot.com",
  messagingSenderId: "454158631172",
  appId: "1:454158631172:web:36fcc7c7bf1c731b835051",
  measurementId: "G-B7FZLZJBDY"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };

