import { UserRole } from '../types';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

// إضافة مستخدم جديد (يجب أن يكون الحساب قد تم إنشاؤه في Auth)
export async function addUser(uid: string, email: string, role: UserRole, displayName?: string) {
  await setDoc(doc(db, 'users', uid), {
    id: uid,
    email,
    displayName: displayName || '',
    role,
    defaultCurrency: 'EGP',
    createdAt: new Date().toISOString(),
  });
}

// جلب جميع المستخدمين
export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => doc.data());
}

// تحديث دور المستخدم
export async function updateUserRole(uid: string, role: UserRole) {
  await updateDoc(doc(db, 'users', uid), { role });
}

// حذف مستخدم
export async function deleteUser(uid: string) {
  await deleteDoc(doc(db, 'users', uid));
}
