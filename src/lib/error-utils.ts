/**
 * Safely extracts an error message from any error type
 * Always returns a string, never an object
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return 'An error occurred';
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If it's an Error instance, return its message
  if (error instanceof Error) {
    return error.message || 'An error occurred';
  }

  // If it's an object with a message property
  if (typeof error === 'object') {
    // Check for NestJS error format: { message, error, statusCode }
    if ('message' in error) {
      const message = (error as { message: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
      if (typeof message === 'object') {
        // If message is an object (array of validation errors), stringify it
        return JSON.stringify(message);
      }
    }

    // Check for ApiError format: { status, message, data }
    if ('status' in error && 'message' in error) {
      const apiErr = error as { message: string, data?: { originalMessage?: string } };
      // If we have an original message from the backend, it's often more useful for debugging
      // especially if the main message is localized/masked
      if (apiErr.data?.originalMessage && typeof apiErr.data.originalMessage === 'string') {
        return apiErr.data.originalMessage;
      }
      if (typeof apiErr.message === 'string') {
        return apiErr.message;
      }
    }

    // Check for axios error format: { response: { data: { message } } }
    if ('response' in error) {
      const response = (error as { response: { data?: { message?: unknown } } }).response;
      if (response?.data?.message) {
        return typeof response.data.message === 'string' 
          ? response.data.message 
          : JSON.stringify(response.data.message);
      }
    }

    // Last resort: stringify the object
    try {
      return JSON.stringify(error);
    } catch {
      return 'An error occurred';
    }
  }

  return 'An error occurred';
}

/**
 * Checks if a value is an error object (NestJS format)
 */
export function isErrorObject(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return 'message' in value && ('error' in value || 'statusCode' in value);
}

/**
 * Validates and filters out error objects from an array
 */
export function filterErrorObjects<T>(items: unknown[]): T[] {
  return items.filter((item): item is T => {
    if (!item || typeof item !== 'object') {
      return false;
    }
    // Reject if it's an error object
    if (isErrorObject(item)) {
      return false;
    }
    return true;
  });
}

