import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function validateImageSignature(file: File): Promise<{ isValid: boolean; reason?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      if (!e.target || !e.target.result) {
        resolve({ isValid: false, reason: 'تعذر قراءة الملف' });
        return;
      }

      const arr = (new Uint8Array(e.target.result as ArrayBuffer)).subarray(0, 12);
      let header = '';
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16).toUpperCase().padStart(2, '0');
      }

      // Check for common image signatures
      // JPEG: FF D8 FF
      if (header.startsWith('FFD8FF')) {
        resolve({ isValid: true });
        return;
      }
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (header.startsWith('89504E470D0A1A0A')) {
        resolve({ isValid: true });
        return;
      }
      // GIF: 47 49 46 38
      if (header.startsWith('47494638')) {
        resolve({ isValid: true });
        return;
      }
      // WEBP: RIFF....WEBP -> 52 49 46 46 ... 57 45 42 50
      // Offset 0: 52 49 46 46 (RIFF)
      // Offset 8: 57 45 42 50 (WEBP)
      // Note: bytes 4-7 are file size, so we skip checking them in the hex string
      // 52494646 is 8 chars. 57454250 is 8 chars.
      // The hex string will be continuous.
      // 0-8: RIFF
      // 8-16: Size (skip)
      // 16-24: WEBP
      if (header.startsWith('52494646') && header.substring(16, 24) === '57454250') {
        resolve({ isValid: true });
        return;
      }

      resolve({ isValid: false, reason: 'الملف ليس صورة صالحة أو قد يكون ملفاً ضاراً (توقيع الملف غير صالح)' });
    };
    reader.onerror = () => {
      resolve({ isValid: false, reason: 'حدث خطأ أثناء قراءة الملف' });
    };
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}
