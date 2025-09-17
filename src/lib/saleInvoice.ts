
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product } from '../types/product';
import { formatCurrency } from './utils';

// --- Helpers copied from pdfGenerator.ts ---
const loadAmiriFont = async (): Promise<string> => {
  try {
    const response = await fetch('/fonts/Amiri.ttf');
    if (!response.ok) throw new Error('Font file not found');
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
    return btoa(binaryString);
  } catch {
    return '';
  }
};

const setArabicFont = (doc: jsPDF, style: 'normal' | 'bold' = 'normal'): void => {
  try {
    doc.setFont('Amiri', style);
  } catch {
    try { doc.setFont('Amiri', 'normal'); } catch { doc.setFont('helvetica', style); }
  }
};

const registerAmiriFont = async (doc: jsPDF): Promise<boolean> => {
  try {
    const amiriFontBase64 = await loadAmiriFont();
    if (amiriFontBase64) {
      doc.addFileToVFS('Amiri.ttf', amiriFontBase64);
      doc.addFont('Amiri.ttf', 'Amiri', 'normal');
      doc.addFont('Amiri.ttf', 'Amiri', 'bold');
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

const addPNGLogo = async (doc: jsPDF, x: number, y: number, width: number = 40, height: number = 40): Promise<void> => {
  try {
    const logoResponse = await fetch('/logo.png');
    if (!logoResponse.ok) throw new Error('PNG logo not found');
    const arrayBuffer = await logoResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
    const base64String = btoa(binaryString);
    doc.addImage('data:image/png;base64,' + base64String, 'PNG', x, y, width, height, undefined, 'FAST');
  } catch {}
};

// --- Main Sale Invoice PDF ---
export async function generateSaleInvoice({
  product,
  quantity,
  date,
  note,
  price,
  currency = 'EGP',
  customer = '',
}: {
  product: Product;
  quantity: number;
  date: string;
  note?: string;
  price: number;
  currency?: string;
  customer?: string;
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a5' });
  await registerAmiriFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;

  // Header background
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 60, 'F');
  await addPNGLogo(doc, margin + 20, 30, 30, 40);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  setArabicFont(doc, 'bold');
  doc.setFontSize(8);
  setArabicFont(doc, 'normal');
  doc.text('للتوريدات العامه', margin + 45, 45);

  // Main title
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  setArabicFont(doc, 'bold');
  doc.text('فاتورة بيع', pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  setArabicFont(doc, 'normal');

  // Invoice number and date
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  setArabicFont(doc, 'normal');
  // إنشاء رقم فاتورة مؤقت (يمكن تحسينه لاحقاً)
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  doc.text(`رقم الفاتورة ${invoiceNumber}`, pageWidth - margin - 5, 45, { align: 'right' });

  // Client info section
  let yPos = 75;
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 20, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(11);
  setArabicFont(doc, 'bold');
  doc.text('تفاصيل العميل', pageWidth / 2, yPos + 13, { align: 'center' });
  yPos += 25;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 40, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(1);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 40);
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text('اسم العميل:', pageWidth - margin - 8, yPos + 15, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  setArabicFont(doc, 'bold');
  doc.text(customer || 'بدون اسم', pageWidth - margin - 8, yPos + 28, { align: 'right' });
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text('تاريخ الفاتورة', margin + 8, yPos + 15);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  setArabicFont(doc, 'bold');
  doc.text(new Date(date).toLocaleDateString('ar-EG'), margin + 8, yPos + 28);

  // Table section
  const tableY = yPos + 80;
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, tableY - 25, pageWidth - 2 * margin, 20, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(2);
  doc.line(margin, tableY - 25, pageWidth - margin, tableY - 25);
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(12);
  setArabicFont(doc, 'bold');
  doc.text('تفاصيل الفاتورة', pageWidth / 2, tableY - 12, { align: 'center' });
  autoTable(doc, {
    startY: tableY,
    head: [[
      'الإجمالي',
      'سعر الوحدة',
      'الكمية',
      'اسم المنتج',
      'ملاحظة',
    ]],
    body: [[
      formatCurrency(price * quantity, currency as any),
      formatCurrency(price, currency as any),
      quantity.toString(),
      product.name,
      note || '-',
    ]],
    styles: {
      font: 'Amiri',
      fontSize: 9,
      cellPadding: 8,
      lineColor: [220, 220, 220],
      lineWidth: 0.5,
      textColor: [60, 60, 60],
    },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      font: 'Amiri',
      halign: 'center',
      valign: 'middle',
      fontSize: 9,
      minCellHeight: 35,
      lineWidth: 0,
    },
    bodyStyles: {
      halign: 'center',
      valign: 'middle',
      minCellHeight: 25,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
    theme: 'grid',
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.5,
  });

  // Totals section
  const totalsY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : tableY + 100;
  const totalsWidth = 140;
  const totalsX = pageWidth - margin - totalsWidth;
  doc.setFillColor(248, 250, 252);
  doc.rect(totalsX, totalsY, totalsWidth, 22, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(totalsX, totalsY, totalsWidth, 22);
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  setArabicFont(doc, 'normal');
  doc.text('الإجمالي الكلي:', totalsX + totalsWidth - 8, totalsY + 10, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  setArabicFont(doc, 'bold');
  doc.text(formatCurrency(price * quantity, currency as any), totalsX + 8, totalsY + 16);

  // Footer
  doc.setFontSize(8);
  setArabicFont(doc, 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('تم الإنشاء بواسطة Qalaj Financial', pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });

  doc.save(`فاتورة-${product.name}-${Date.now()}.pdf`);
}
