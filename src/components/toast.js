// src/utils/toast.js
import { toast } from "react-toastify";
import i18n from "./i18n";

// Toast configuration options
const defaultOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Toast notification utilities
export const showToast = {
  success: (messageKey, options = {}) => {
    const message = i18n.t(messageKey) || messageKey;
    toast.success(message, { ...defaultOptions, ...options });
  },

  error: (messageKey, options = {}) => {
    const message = i18n.t(messageKey) || messageKey;
    toast.error(message, { ...defaultOptions, ...options });
  },

  warning: (messageKey, options = {}) => {
    const message = i18n.t(messageKey) || messageKey;
    toast.warning(message, { ...defaultOptions, ...options });
  },

  info: (messageKey, options = {}) => {
    const message = i18n.t(messageKey) || messageKey;
    toast.info(message, { ...defaultOptions, ...options });
  },

  // For custom messages that don't need translation
  raw: {
    success: (message, options = {}) => {
      toast.success(message, { ...defaultOptions, ...options });
    },

    error: (message, options = {}) => {
      toast.error(message, { ...defaultOptions, ...options });
    },

    warning: (message, options = {}) => {
      toast.warning(message, { ...defaultOptions, ...options });
    },

    info: (message, options = {}) => {
      toast.info(message, { ...defaultOptions, ...options });
    },
  },
};

// Error handling utility
export const handleApiError = (error, fallbackMessageKey = "generalError") => {
  console.error("API Error:", error);

  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 401:
        showToast.error("authError");
        break;
      case 403:
        showToast.error("accessDenied");
        break;
      case 404:
        showToast.error("notFound");
        break;
      case 500:
        showToast.error("serverError");
        break;
      default:
        if (data?.message) {
          showToast.raw.error(data.message);
        } else {
          showToast.error(fallbackMessageKey);
        }
    }
  } else if (error.request) {
    // Network error
    showToast.error("networkError");
  } else {
    // Other error
    showToast.error(fallbackMessageKey);
  }
};
