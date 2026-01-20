import { useTranslation } from 'react-i18next';
import { getErrorMessage } from './error-utils';
import { toast } from 'sonner';

/**
 * Professional error message handler for toast notifications
 * Provides clear, simple, human-readable messages suitable for non-technical users.
 */

interface ErrorContext {
  operation?: string;
  resource?: string;
}

/**
 * Maps HTTP status codes to user-friendly error messages
 */
const getStatusMessage = (status: number, isRTL: boolean): { title: string; description: string } => {
  const messages: Record<number, { title: { ar: string; en: string }; description: { ar: string; en: string } }> = {
    400: {
      title: { ar: 'تعذر إتمام الطلب', en: 'Action could not be completed' },
      description: { ar: 'يرجى التأكد من البيانات والمحاولة مرة أخرى.', en: 'Please check your input and try again.' },
    },
    401: {
      title: { ar: 'تنبيه', en: 'Notice' },
      description: { ar: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', en: 'Your session has expired. Please sign in again.' },
    },
    403: {
      title: { ar: 'غيـر مصرح', en: 'Access denied' },
      description: { ar: 'ليس لديك صلاحية لهذا الإجراء.', en: 'You don’t have permission to do this action.' },
    },
    404: {
      title: { ar: 'غير موجود', en: 'Not found' },
      description: { ar: 'العنصر الذي تبحث عنه غير متوفر.', en: 'We couldn’t find what you were looking for.' },
    },
    409: {
      title: { ar: 'تعارض في البيانات', en: 'Data conflict' },
      description: { ar: 'هذه البيانات موجودة مسبقاً. حاول استخدام بيانات أخرى.', en: 'This information is already in use. Please try different details.' },
    },
    422: {
      title: { ar: 'بيانات غير مكتملة', en: 'Incomplete information' },
      description: { ar: 'بعض المعلومات المطلوبة ناقصة أو غير صحيحة.', en: 'Some required information is missing or incorrect.' },
    },
    429: {
      title: { ar: 'طلبات متكررة', en: 'Too many requests' },
      description: { ar: 'يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.', en: 'Please wait a moment and try again.' },
    },
    500: {
      title: { ar: 'خطأ مؤقت', en: 'Temporary issue' },
      description: { ar: 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.', en: 'The service is temporarily unavailable. Please try again later.' },
    },
    502: {
      title: { ar: 'خطأ في الاتصال', en: 'Connection issue' },
      description: { ar: 'الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً.', en: 'The service is temporarily unavailable. Please try again later.' },
    },
    503: {
      title: { ar: 'خدمة غير متاحة', en: 'Service unavailable' },
      description: { ar: 'النظام مشغول حالياً. يرجى المحاولة بعد قليل.', en: 'The service is temporarily unavailable. Please try again in a moment.' },
    },
  };

  const message = messages[status] || messages[500];

  return {
    title: isRTL ? message.title.ar : message.title.en,
    description: isRTL ? message.description.ar : message.description.en,
  };
};

/**
 * Extracts professionally formatted error message
 */
export const getProfessionalErrorMessage = (
  error: unknown,
  context?: ErrorContext,
  isRTL: boolean = false
): { title: string; description: string } => {
  // Default fallback
  const fallbackTitle = isRTL ? 'حدث خطأ' : 'Something went wrong';
  const fallbackDescription = isRTL
    ? 'يرجى المحاولة مرة أخرى.'
    : 'Please try again.';

  let status: number | undefined;

  // 1. Analyze the error object
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    
    // Check for HTTP Response (Axios format)
    if (err.response && typeof err.response === 'object') {
      const response = err.response as { status?: number; data?: { errorCode?: string } };
      status = response.status;
      if (response.data?.errorCode) {
        // TODO: Map error codes
      }
    } 
    // Check direct properties (fetch or custom format)
    else if (typeof err.status === 'number') status = err.status;
    else if (typeof err.statusCode === 'number') status = err.statusCode;
  }

  // 2. Map known status codes or use custom message
  const rawMessage = getErrorMessage(error);
  const isGenericMessage = !rawMessage || rawMessage.toLowerCase().includes('error') || rawMessage.toLowerCase().includes('request');

  if (status && status >= 400) {
    // If we have a status code, we usually have a localized generic message
    const statusMsg = getStatusMessage(status, isRTL);
    
    // BUT if the backend provided a specific human-readable message, we want to show it
    // unless it's a 400 which often has technical validation messages we want to mask
    // OR it's a generic "Bad Request"
    if (rawMessage && !isGenericMessage && status !== 500) {
      return {
        title: statusMsg.title,
        description: rawMessage
      };
    }
    
    return statusMsg;
  }

  // 3. String matching for common non-HTTP errors or raw messages
  const lowerMessage = rawMessage.toLowerCase();

  const commonMaps: Record<string, { ar: string; en: string }> = {
    'network': { ar: 'تحقق من اتصالك بالإنترنت والمحاولة مجدداً.', en: 'Please check your internet connection and try again.' },
    'timeout': { ar: 'استغرق الطلب وقتاً طويلاً. يرجى المحاولة مرة أخرى.', en: 'The request timed out. Please try again.' },
    'offline': { ar: 'لا يوجد اتصال بالإنترنت.', en: 'No internet connection.' },
    'unauthorized': { ar: 'يرجى تسجيل الدخول للمتابعة.', en: 'Please log in to continue.' },
    'forbidden': { ar: 'لا تملك الصلاحية اللازمة.', en: 'You don’t have permission to do this.' },
    'verification code': { ar: 'رمز التحقق غير صحيح.', en: 'Verification code is invalid.' },
    'code expired': { ar: 'انتهت صلاحية الرمز. يرجى طلب رمز جديد.', en: 'Verification code has expired. Please request a new one.' },
    'otp': { ar: 'رمز التحقق غير صحيح.', en: 'Incorrect verification code.' },
    'expired': { ar: 'انتهت صلاحية الجلسة.', en: 'Your session has expired. Please sign in again.' },
    // Database/System keywords to mask
    'constraint': { ar: 'لا يمكن حفظ البيانات. يرجى المحاولة مرة أخرى.', en: 'We couldn’t save your data. Please try again.' },
    'duplicate': { ar: 'هذه القيمة موجودة بالفعل.', en: 'This entry already exists.' },
    'foreign key': { ar: 'حدث خطأ في ترابط البيانات.', en: 'Something went wrong with the data. Please try again.' },
  };

  for (const [key, map] of Object.entries(commonMaps)) {
    if (lowerMessage.includes(key)) {
      return {
        title: isRTL ? 'تنبيه' : 'Notice',
        description: isRTL ? map.ar : map.en,
      };
    }
  }

  // 4. Default Fallback
  return {
    title: fallbackTitle,
    description: fallbackDescription,
  };
};

/**
 * Hook for professional error toast notifications
 */
export const useProfessionalToast = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const showError = (error: unknown, context?: ErrorContext) => {
    const { title, description } = getProfessionalErrorMessage(error, context, isRTL);
    toast.error(title, {
      description,
      duration: 5000,
    });
  };

  const showSuccess = (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000,
    });
  };

  return { showError, showSuccess };
};


