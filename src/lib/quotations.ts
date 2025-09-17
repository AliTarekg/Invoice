import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { Quotation } from '../types';

export async function addQuotation(quotation: Quotation) {
  const db = getFirestore();
  const quotationsRef = collection(db, 'quotations');
  await addDoc(quotationsRef, {
    ...quotation,
    createdAt: Timestamp.now(),
  });
}
