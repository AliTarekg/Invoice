import { UserRole } from '../types';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
// إنشاء مستخدم جديد مع الدور في Firestore
export async function createUserWithRole(uid: string, email: string, role: UserRole, displayName?: string) {
  await setDoc(doc(db, 'users', uid), {
    id: uid,
    email,
    displayName: displayName || '',
    role,
    createdAt: serverTimestamp(),
  });
}
// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
