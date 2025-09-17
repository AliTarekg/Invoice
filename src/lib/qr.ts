// src/lib/qr.ts
import QRCode from 'qrcode';

export async function generateQRCode(data: string): Promise<string> {
  // Returns a data URL for the QR code
  return await QRCode.toDataURL(data, { width: 200, margin: 2 });
}
