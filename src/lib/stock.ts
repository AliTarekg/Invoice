// src/lib/stock.ts
import { StockMovement } from '../types/stock';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';

const STOCK_COLLECTION = 'stock_movements';

export async function addStockMovement(movement: Omit<StockMovement, 'id'>): Promise<string> {
  const db = getFirestore();
  const docRef = await addDoc(collection(db, STOCK_COLLECTION), movement);
  return docRef.id;
}

export async function getStockMovements(productId?: string): Promise<StockMovement[]> {
  const db = getFirestore();
  const colRef = collection(db, STOCK_COLLECTION);
  const q = productId ? query(colRef, where('productId', '==', productId)) : colRef;
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StockMovement[];
}

export async function deleteStockMovement(id: string): Promise<void> {
  const db = getFirestore();
  await deleteDoc(doc(db, STOCK_COLLECTION, id));
}

export async function getProductStock(productId: string): Promise<number> {
  const movements = await getStockMovements(productId);
  return movements.reduce((sum, m) => sum + (m.type === 'in' ? m.quantity : -m.quantity), 0);
}
