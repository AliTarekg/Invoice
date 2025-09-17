// src/lib/products.ts
import { Product } from '../types/product';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

const PRODUCTS_COLLECTION = 'products';

export async function addProduct(product: Omit<Product, 'id'>): Promise<string> {
  const db = getFirestore();
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), product);
  return docRef.id;
}

export async function getProducts(): Promise<Product[]> {
  const db = getFirestore();
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const db = getFirestore();
  await updateDoc(doc(db, PRODUCTS_COLLECTION, id), data);
}

export async function deleteProduct(id: string): Promise<void> {
  const db = getFirestore();
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
}
