import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function logToFirebase(message: string, data?: any) {
  try {
    await addDoc(collection(db, "logs"), {
      message,
      data: data || null,
      timestamp: Timestamp.now(),
    });
  } catch (e) {
    console.error("Error logging to Firebase:", e);
  }
} 