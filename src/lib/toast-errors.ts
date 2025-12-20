import { useTranslation } from 'react-i18next';
import { getErrorMessage } from './error-utils';

/**
 * Professional error message handler for toast notifications
 * Provides user-friendly, localized error messages that hide technical details
 */

interface ErrorContext {
  operation?: string;
  resource?: string;
  field?: string;
}

/**
 * Maps HTTP status codes to user-friendly error messages
 */
const getStatusMessage = (status: number, isRTL: boolean): { title: string; description: string } => {
  const messages: Record<number, { title: { ar: string; en: string }; description: { ar: string; en: string } }> = {
    400: {
      title: { ar: 'طلب غير صالح', en: 'Invalid Request' },
      description: { ar: 'البيانات المدخلة غير صحيحة. يرجى التحقق من المعلومات والمحاولة مرة أخرى.', en: 'The provided information is invalid. Please check your input and try again.' },
    },
    401: {
      title: { ar: 'غير مصرح', en: 'Unauthorized' },
      description: { ar: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', en: 'Your session has expired. Please log in again.' },
    },
    403: {
      title: { ar: 'غير مسموح', en: 'Access Denied' },
      description: { ar: 'ليس لديك الصلاحية للقيام بهذه العملية.', en: 'You do not have permission to perform this action.' },
    },
    404: {
      title: { ar: 'غير موجود', en: 'Not Found' },
      description: { ar: 'المورد المطلوب غير موجود. يرجى التحقق من المعلومات والمحاولة مرة أخرى.', en: 'The requested resource was not found. Please verify the information and try again.' },
    },
    409: {
      title: { ar: 'تعارض', en: 'Conflict' },
      description: { ar: 'المعلومات المدخلة مستخدمة بالفعل. يرجى استخدام بيانات أخرى.', en: 'The provided information is already in use. Please use different information.' },
    },
    422: {
      title: { ar: 'بيانات غير صالحة', en: 'Validation Error' },
      description: { ar: 'البيانات المدخلة لا تلبي المتطلبات. يرجى التحقق من جميع الحقول.', en: 'The provided data does not meet requirements. Please check all fields.' },
    },
    429: {
      title: { ar: 'طلب كثير', en: 'Too Many Requests' },
      description: { ar: 'تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار قليلاً والمحاولة مرة أخرى.', en: 'Too many attempts. Please wait a moment and try again.' },
    },
    500: {
      title: { ar: 'خطأ في الخادم', en: 'Server Error' },
      description: { ar: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً أو الاتصال بالدعم الفني.', en: 'A server error occurred. Please try again later or contact support.' },
    },
    502: {
      title: { ar: 'خطأ في الاتصال', en: 'Connection Error' },
      description: { ar: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.', en: 'Unable to connect to the server. Please check your internet connection and try again.' },
    },
    503: {
      title: { ar: 'الخدمة غير متاحة', en: 'Service Unavailable' },
      description: { ar: 'الخدمة غير متاحة حالياً. يرجى المحاولة مرة أخرى لاحقاً.', en: 'The service is currently unavailable. Please try again later.' },
    },
  };

  const message = messages[status] || {
    title: { ar: 'حدث خطأ', en: 'An Error Occurred' },
    description: { ar: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.', en: 'An unexpected error occurred. Please try again.' },
  };

  return {
    title: isRTL ? message.title.ar : message.title.en,
    description: isRTL ? message.description.ar : message.description.en,
  };
};

/**
 * Extracts user-friendly error message from various error formats
 */
export const getProfessionalErrorMessage = (
  error: unknown,
  context?: ErrorContext,
  isRTL: boolean = false
): { title: string; description: string } => {
  // Default messages
  const defaultTitle = isRTL ? 'حدث خطأ' : 'An Error Occurred';
  const defaultDescription = isRTL
    ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني إذا استمرت المشكلة.'
    : 'An unexpected error occurred. Please try again or contact support if the problem persists.';

  // Check for HTTP status code
  let status: number | undefined;
  let errorMessage = '';

  if (error && typeof error === 'object') {
    // Check for axios/fetch error with response
    if ('response' in error) {
      const response = (error as any).response;
      status = response?.status;
      if (response?.data?.message) {
        errorMessage = typeof response.data.message === 'string'
          ? response.data.message
          : JSON.stringify(response.data.message);
      }
    }
    // Check for statusCode directly
    else if ('statusCode' in error) {
      status = (error as any).statusCode;
    }
    // Check for status directly
    else if ('status' in error) {
      status = (error as any).status;
    }
  }

  // If we have a status code, use status-based message
  if (status && status >= 400) {
    const statusMsg = getStatusMessage(status, isRTL);
    
    // Enhance with context if available
    if (context?.operation && context?.resource) {
      return {
        title: statusMsg.title,
        description: isRTL
          ? `تعذر ${context.operation} ${context.resource}. ${statusMsg.description}`
          : `Unable to ${context.operation} ${context.resource}. ${statusMsg.description}`,
      };
    }
    
    return statusMsg;
  }

  // Extract error message from various formats
  const rawMessage = getErrorMessage(error);

  // Map common error messages to professional ones
  const commonErrors: Record<string, { ar: string; en: string }> = {
    'network error': { ar: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.', en: 'Unable to connect to the server. Please check your internet connection.' },
    'timeout': { ar: 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.', en: 'Connection timeout. Please try again.' },
    'unauthorized': { ar: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', en: 'Your session has expired. Please log in again.' },
    'forbidden': { ar: 'ليس لديك الصلاحية للقيام بهذه العملية.', en: 'You do not have permission to perform this action.' },
    'not found': { ar: 'المورد المطلوب غير موجود.', en: 'The requested resource was not found.' },
    'email already exists': { ar: 'هذا البريد الإلكتروني مستخدم بالفعل. الرجاء استخدام بريد آخر.', en: 'This email address is already in use. Please use a different email.' },
    'email already registered': { ar: 'هذا البريد الإلكتروني مستخدم بالفعل. الرجاء استخدام بريد آخر.', en: 'This email address is already registered. Please use a different email.' },
    'invalid email': { ar: 'البريد الإلكتروني المدخل غير صالح. يرجى التحقق من البريد والمحاولة مرة أخرى.', en: 'The email address is invalid. Please check the email and try again.' },
    'invalid password': { ar: 'كلمة المرور غير صحيحة. يرجى التحقق من كلمة المرور والمحاولة مرة أخرى.', en: 'The password is incorrect. Please check your password and try again.' },
    'invalid credentials': { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق من البيانات المدخلة.', en: 'The email or password is incorrect. Please verify your credentials.' },
    'user not found': { ar: 'المستخدم غير موجود. يرجى التحقق من البريد الإلكتروني.', en: 'User not found. Please check the email address.' },
    'account locked': { ar: 'تم قفل حسابك مؤقتاً. يرجى المحاولة لاحقاً أو الاتصال بالدعم.', en: 'Your account has been temporarily locked. Please try again later or contact support.' },
    'too many attempts': { ar: 'تم تجاوز عدد المحاولات المسموح. يرجى الانتظار قليلاً والمحاولة مرة أخرى.', en: 'Too many attempts. Please wait a moment and try again.' },
    'subdomain already exists': { ar: 'اسم النطاق الفرعي مستخدم بالفعل. الرجاء اختيار اسم آخر.', en: 'This subdomain is already in use. Please choose a different subdomain.' },
    'verification code invalid': { ar: 'رمز التحقق غير صحيح. يرجى التحقق من الرمز وإدخاله مرة أخرى.', en: 'The verification code is invalid. Please verify and enter the code again.' },
    'verification code expired': { ar: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.', en: 'The verification code has expired. Please request a new code.' },
    'password reset token invalid': { ar: 'رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.', en: 'The password reset link is invalid or expired. Please request a new link.' },
  };

  // Check for common error patterns
  const lowerMessage = rawMessage.toLowerCase();
  for (const [key, message] of Object.entries(commonErrors)) {
    if (lowerMessage.includes(key)) {
      return {
        title: defaultTitle,
        description: isRTL ? message.ar : message.en,
      };
    }
  }

  // If we have a raw message, try to clean it up
  if (rawMessage && rawMessage !== 'An error occurred') {
    // Remove technical details
    let cleanMessage = rawMessage
      .replace(/^Error:\s*/i, '')
      .replace(/^\d+\s*/, '')
      .replace(/\[.*?\]/g, '')
      .trim();

    // Don't expose stack traces or technical paths
    if (cleanMessage.includes('at ') || cleanMessage.includes('stack') || cleanMessage.includes('file://')) {
      cleanMessage = defaultDescription;
    }

    return {
      title: defaultTitle,
      description: cleanMessage.length > 200 ? defaultDescription : cleanMessage,
    };
  }

  return {
    title: defaultTitle,
    description: defaultDescription,
  };
};

/**
 * Hook for professional error toast notifications
 */
export const useProfessionalToast = () => {
  const { toast } = require('@/hooks/use-toast').useToast();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const showError = (error: unknown, context?: ErrorContext) => {
    const { title, description } = getProfessionalErrorMessage(error, context, isRTL);
    toast({
      variant: 'destructive',
      title,
      description,
    });
  };

  const showSuccess = (message: string, description?: string) => {
    toast({
      title: message,
      description,
    });
  };

  return { showError, showSuccess, toast };
};

