import { db } from './firebase';
import { Sale, SaleProduct } from '../types/sale';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';

const SALES_COLLECTION = 'sales';

export async function addSale(sale: Omit<Sale, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, SALES_COLLECTION), {
    ...sale,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getSales(): Promise<Sale[]> {
  const snapshot = await getDocs(collection(db, SALES_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
}
