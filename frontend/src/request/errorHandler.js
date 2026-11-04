import { notification } from 'antd';
import codeMessage from './codeMessage';
import { triggerAutoLogout } from '@/utils/authSession';

const errorHandler = (error) => {
  if (!navigator.onLine) {
    notification.config({
      duration: 15,
      maxCount: 1,
    });
    notification.error({
      message: 'No internet connection',
      description: 'Cannot connect to the Internet, Check your internet network',
    });
    return {
      success: false,
      result: null,
      message: 'Cannot connect to the server, Check your internet network',
    };
  }

  const { response } = error;

  if (!response) {
    notification.config({
      duration: 20,
      maxCount: 1,
    });
    return {
      success: false,
      result: null,
      message: 'Cannot connect to the server, Contact your Account administrator',
    };
  }

  const isAuthEndpoint =
    error.config?.url?.includes('employees/auth') ||
    error.config?.url?.includes('/login') ||
    error.config?.url?.includes('/register');

  // 🔐 Check Token Expiry & Unauthorized globally (kecuali endpoint login/register autentikasi itu sendiri)
  if (
    !isAuthEndpoint &&
    (response.status === 401 ||
      response.data?.jwtExpired ||
      response.data?.error?.name === 'JsonWebTokenError' ||
      response.data?.error?.name === 'TokenExpiredError')
  ) {
    triggerAutoLogout('expired');
    return {
      success: false,
      result: null,
      message: 'Sesi login telah berakhir. Mengalihkan ke halaman login...',
    };
  }

  if (response && response.status) {
    const message = response.data && response.data.message;

    const errorText = message || codeMessage[response.status];
    const { status } = response;
    notification.config({
      duration: 20,
      maxCount: 2,
    });
    notification.error({
      message: `Request error ${status}`,
      description: errorText,
    });

    return response.data;
  } else {
    notification.config({
      duration: 15,
      maxCount: 1,
    });

    if (navigator.onLine) {
      notification.error({
        message: 'Problem connecting to server',
        description: 'Cannot connect to the server, Try again later',
      });
      return {
        success: false,
        result: null,
        message: 'Cannot connect to the server, Contact your Account administrator',
      };
    } else {
      notification.error({
        message: 'No internet connection',
        description: 'Cannot connect to the Internet, Check your internet network',
      });
      return {
        success: false,
        result: null,
        message: 'Cannot connect to the server, Check your internet network',
      };
    }
  }
};

export default errorHandler;
