// src/utils/apiErrorHandler.ts
import { AxiosError } from 'axios';

export interface ApiError {
  success?: boolean;
  message?: string;
  data?: any;
  error?: any;
  error_type?: string;
  detail?: string;
  non_field_errors?: string[];
  error_code?: string;
  code?: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ParsedError {
  message: string;
  fieldErrors?: FieldError[];
  errorCode?: string;
  rawError?: any;
}

export const handleApiError = (error: AxiosError<ApiError>): ParsedError => {
  const response = error.response;
  
  // 🌐 Network error
  if (!response) {
    return {
      message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.',
      errorCode: 'network_error',
      rawError: error
    };
  }

  const errorData = response.data;
  
  // ✅ DEBUG: Xem chính xác response từ backend
  console.error('=== 🔍 API ERROR DEBUG ===');
  console.error('Status:', response.status);
  console.error('Full Data:', errorData);
  console.error('========================');

  // ✅ Ưu tiên 1: errorData.message (string)
  if (errorData?.message && typeof errorData.message === 'string' && errorData.message.trim()) {
    console.log('✅ Using: errorData.message');
    return {
      message: errorData.message,
      errorCode: errorData?.error?.code || 'api_error',
      rawError: errorData
    };
  }

  // ✅ Ưu tiên 2: errorData.detail (string)
  if (errorData?.detail && typeof errorData.detail === 'string' && errorData.detail.trim()) {
    console.log('✅ Using: errorData.detail');
    return {
      message: errorData.detail,
      errorCode: errorData?.error?.code || 'api_error',
      rawError: errorData
    };
  }

  // ✅ Ưu tiên 3: errorData.error.detail (string) - Trường hợp duplicate_email
  if (errorData?.error?.detail && typeof errorData.error.detail === 'string' && errorData.error.detail.trim()) {
    console.log('✅ Using: errorData.error.detail');
    return {
      message: errorData.error.detail,
      errorCode: errorData.error.code || 'api_error',
      rawError: errorData
    };
  }

  // ✅ Ưu tiên 4: errorData.error.message (string)
  if (errorData?.error?.message && typeof errorData.error.message === 'string' && errorData.error.message.trim()) {
    console.log('✅ Using: errorData.error.message');
    return {
      message: errorData.error.message,
      errorCode: errorData.error.code || 'api_error',
      rawError: errorData
    };
  }

  // ✅ Ưu tiên 5: errorData.error (string)
  if (typeof errorData?.error === 'string' && errorData.error.trim()) {
    console.log('✅ Using: errorData.error (string)');
    return {
      message: errorData.error,
      errorCode: 'api_error',
      rawError: errorData
    };
  }

  // ✅ Ưu tiên 6: Validation errors với non_field_errors
  if (errorData?.non_field_errors && Array.isArray(errorData.non_field_errors)) {
    console.log('✅ Using: non_field_errors');
    return {
      message: errorData.non_field_errors[0],
      errorCode: 'validation_error',
      rawError: errorData
    };
  }

  // ✅ Ưu tiên 7: Validation errors (field-specific)
  if (errorData?.error_type === 'validation' || response.status === 400) {
    const fieldErrors: FieldError[] = [];
    const errors = errorData.error || errorData;

    if (typeof errors === 'object' && errors !== null) {
      Object.entries(errors).forEach(([field, value]) => {
        if (['success', 'message', 'data', 'error_type', 'code'].includes(field)) return;
        
        if (Array.isArray(value)) {
          value.forEach(msg => fieldErrors.push({ field, message: String(msg) }));
        } else if (typeof value === 'string') {
          fieldErrors.push({ field, message: value });
        }
      });
    }

    if (fieldErrors.length > 0) {
      console.log('✅ Using: fieldErrors');
      return {
        message: 'Dữ liệu không hợp lệ',
        fieldErrors,
        errorCode: 'validation_error',
        rawError: errorData
      };
    }
  }

  // ✅ Ưu tiên 8: Handle error codes
  const errorCode = errorData?.error?.code 
    || errorData?.error_code 
    || errorData?.code;

  const errorCodeMap: Record<string, string> = {
    'unauthorized': 'Vui lòng đăng nhập để tiếp tục.',
    'permission_denied': 'Bạn không có quyền thực hiện thao tác này.',
    'not_found': 'Không tìm thấy dữ liệu.',
    'duplicate': 'Dữ liệu đã tồn tại.',
    'duplicate_email': 'Email này đã được đăng ký. Vui lòng sử dụng email khác.',
    'business_rule_error': 'Vi phạm quy tắc nghiệp vụ.',
    'integrity_error': 'Vi phạm ràng buộc cơ sở dữ liệu.',
    'server_error': 'Đã xảy ra lỗi server. Vui lòng thử lại sau.'
  };

  if (errorCode && errorCodeMap[errorCode]) {
    console.log('✅ Using: errorCodeMap -', errorCode);
    return {
      message: errorCodeMap[errorCode],
      errorCode,
      rawError: errorData
    };
  }

  // ✅ Fallback: Trả về raw error data để debug
  console.warn('⚠️ No matching error format, using fallback');
  return {
    message: 'Đã xảy ra lỗi không mong muốn.',
    errorCode: 'unknown_error',
    rawError: errorData
  };
};

export const displayApiError = (
  error: AxiosError<ApiError>, 
  showToast: (message: string, description?: string, duration?: number) => void
): ParsedError => {
  const parsed = handleApiError(error);
  
  console.log('📢 Displaying toast with message:', parsed.message);
  
  if (parsed.fieldErrors && parsed.fieldErrors.length > 0) {
    const description = parsed.fieldErrors
      .map(err => `• ${err.field}: ${err.message}`)
      .join('\n');
    showToast(parsed.message, description, 8000);
  } else {
    showToast(parsed.message, undefined, 5000);
  }
  
  return parsed;
};