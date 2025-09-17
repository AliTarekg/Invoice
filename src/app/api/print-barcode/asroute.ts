// تم تعطيل هذا الملف مؤقتًا للسماح بالبناء الثابت (static export)
// import { NextRequest } from 'next/server';
// import { NextResponse } from 'next/server';
// import jsPDF from 'jspdf';
// import bwipjs from 'bwip-js';
// import fs from 'fs';
// import path from 'path';

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const code = searchParams.get('code') || '';
//   const name = searchParams.get('name') || '';
//   if (!code) return NextResponse.json({ error: 'Barcode required' }, { status: 400 });

//   // توليد صورة باركود
//   let barcodePng: string = '';
//   try {
//     const png = await bwipjs.toBuffer({
//       bcid: 'code128',
//       text: code,
//       scale: 2,
//       height: 10,
//       includetext: false,
//       backgroundcolor: 'FFFFFF',
//     });
//     barcodePng = 'data:image/png;base64,' + png.toString('base64');
//   } catch (e) {
//     return NextResponse.json({ error: 'Barcode generation failed' }, { status: 500 });
//   }
//   ...
// }
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import bwipjs from 'bwip-js';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code') || '';
  const name = searchParams.get('name') || '';
  if (!code) return NextResponse.json({ error: 'Barcode required' }, { status: 400 });

  // توليد صورة باركود
  let barcodePng: string = '';
  try {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: code,
      scale: 2,
      height: 10,
      includetext: false,
      backgroundcolor: 'FFFFFF',
    });
    barcodePng = 'data:image/png;base64,' + png.toString('base64');
  } catch (e) {
    return NextResponse.json({ error: 'Barcode generation failed' }, { status: 500 });
  }

  // إعداد PDF للطابعة الحرارية بشكل طولي (عمودي) مع توسيط الباركود
  const width = 30, height = 50;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [width, height],
  });
  // تحميل خط Amiri من السيرفر وتسجيله في jsPDF
  try {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Amiri.ttf');
    const fontData = fs.readFileSync(fontPath);
    const fontBase64 = fontData.toString('base64');
    doc.addFileToVFS('Amiri.ttf', fontBase64);
    doc.addFont('Amiri.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri', 'normal');
  } catch (e) {
    doc.setFont('helvetica', 'normal');
  }
  doc.setFontSize(10);
  // اسم المنتج أعلى الصفحة
  doc.text(name, width/2, 10, { align: 'center' });
  // أبعاد الباركود
  const barcodeW = 24, barcodeH = 18;
  const barcodeX = (width - barcodeW) / 2;
  const barcodeY = (height - barcodeH) / 2;
  // صورة الباركود في منتصف الصفحة
  doc.addImage(barcodePng, 'PNG', barcodeX, barcodeY, barcodeW, barcodeH);
  // الكود نصاً أسفل الباركود
  doc.setFontSize(9);
  doc.text(code, width/2, barcodeY + barcodeH + 9, { align: 'center' });

  const pdf = doc.output('arraybuffer');
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="barcode-${code}.pdf"`,
    },
  });
}
