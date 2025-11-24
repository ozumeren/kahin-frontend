// src/utils/security.js
// Frontend güvenlik yardımcı fonksiyonları

// ============================================
// XSS Sanitization
// ============================================

/**
 * HTML özel karakterlerini escape eder (XSS koruması)
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return str;

  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
}

/**
 * Tehlikeli HTML taglarını ve attributeları temizler
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  // Script taglarını kaldır
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Event handler attribute'larını kaldır (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // javascript: protocol'ünü kaldır
  sanitized = sanitized.replace(/javascript:/gi, '');

  // data: protocol'ünü kaldır (base64 injection)
  sanitized = sanitized.replace(/data:/gi, '');

  return sanitized.trim();
}

/**
 * Obje içindeki tüm string değerleri sanitize eder
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeInput(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

// ============================================
// Input Validation
// ============================================

export const validators = {
  /**
   * Email formatı kontrolü
   */
  email: (value) => {
    if (!value) return { valid: false, message: 'Email gerekli' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, message: 'Geçerli bir email adresi giriniz' };
    }
    if (value.length > 254) {
      return { valid: false, message: 'Email çok uzun' };
    }
    return { valid: true };
  },

  /**
   * Şifre güçlülük kontrolü
   */
  password: (value, options = {}) => {
    const { minLength = 8, requireUppercase = true, requireNumber = true } = options;

    if (!value) return { valid: false, message: 'Şifre gerekli' };
    if (value.length < minLength) {
      return { valid: false, message: `Şifre en az ${minLength} karakter olmalı` };
    }
    if (requireUppercase && !/[A-Z]/.test(value)) {
      return { valid: false, message: 'Şifre en az bir büyük harf içermeli' };
    }
    if (requireNumber && !/\d/.test(value)) {
      return { valid: false, message: 'Şifre en az bir rakam içermeli' };
    }
    if (value.length > 128) {
      return { valid: false, message: 'Şifre çok uzun' };
    }
    return { valid: true };
  },

  /**
   * Kullanıcı adı kontrolü
   */
  username: (value) => {
    if (!value) return { valid: false, message: 'Kullanıcı adı gerekli' };
    if (value.length < 3) {
      return { valid: false, message: 'Kullanıcı adı en az 3 karakter olmalı' };
    }
    if (value.length > 30) {
      return { valid: false, message: 'Kullanıcı adı en fazla 30 karakter olabilir' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return { valid: false, message: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir' };
    }
    return { valid: true };
  },

  /**
   * Pozitif sayı kontrolü
   */
  positiveNumber: (value, { min = 0, max = Infinity, fieldName = 'Değer' } = {}) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { valid: false, message: `${fieldName} bir sayı olmalı` };
    }
    if (num < min) {
      return { valid: false, message: `${fieldName} en az ${min} olmalı` };
    }
    if (num > max) {
      return { valid: false, message: `${fieldName} en fazla ${max} olabilir` };
    }
    return { valid: true };
  },

  /**
   * Fiyat kontrolü (0-1 arası)
   */
  price: (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { valid: false, message: 'Geçerli bir fiyat giriniz' };
    }
    if (num < 0.01) {
      return { valid: false, message: 'Fiyat en az 0.01 olmalı' };
    }
    if (num > 0.99) {
      return { valid: false, message: 'Fiyat en fazla 0.99 olabilir' };
    }
    return { valid: true };
  },

  /**
   * Miktar kontrolü
   */
  quantity: (value, { min = 1, max = 10000 } = {}) => {
    const num = parseInt(value);
    if (isNaN(num) || !Number.isInteger(num)) {
      return { valid: false, message: 'Miktar tam sayı olmalı' };
    }
    if (num < min) {
      return { valid: false, message: `Miktar en az ${min} olmalı` };
    }
    if (num > max) {
      return { valid: false, message: `Miktar en fazla ${max} olabilir` };
    }
    return { valid: true };
  },

  /**
   * Genel text alanı kontrolü
   */
  text: (value, { minLength = 0, maxLength = 1000, fieldName = 'Alan' } = {}) => {
    if (!value && minLength > 0) {
      return { valid: false, message: `${fieldName} gerekli` };
    }
    if (value && value.length < minLength) {
      return { valid: false, message: `${fieldName} en az ${minLength} karakter olmalı` };
    }
    if (value && value.length > maxLength) {
      return { valid: false, message: `${fieldName} en fazla ${maxLength} karakter olabilir` };
    }
    return { valid: true };
  },
};

/**
 * Birden fazla validation çalıştır
 */
export function validateForm(data, rules) {
  const errors = {};
  let isValid = true;

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];

    for (const rule of fieldRules) {
      const result = typeof rule === 'function' ? rule(value) : rule;
      if (!result.valid) {
        errors[field] = result.message;
        isValid = false;
        break; // İlk hatada dur
      }
    }
  }

  return { isValid, errors };
}

// ============================================
// Rate Limiting (Client-side)
// ============================================

const rateLimitStore = new Map();

/**
 * Client-side rate limiting
 */
export function checkRateLimit(key, { maxRequests = 10, windowMs = 60000 } = {}) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Eski kayıtları temizle
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const timestamps = rateLimitStore.get(key).filter(ts => ts > windowStart);
  rateLimitStore.set(key, timestamps);

  if (timestamps.length >= maxRequests) {
    const oldestRequest = timestamps[0];
    const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      message: `Çok fazla istek. ${retryAfter} saniye sonra tekrar deneyin.`
    };
  }

  timestamps.push(now);
  return { allowed: true };
}

/**
 * Rate limit'i sıfırla
 */
export function resetRateLimit(key) {
  rateLimitStore.delete(key);
}

// ============================================
// Secure Storage
// ============================================

const STORAGE_PREFIX = 'kahin_';

/**
 * Güvenli localStorage wrapper
 */
export const secureStorage = {
  set(key, value, { encrypt = false } = {}) {
    try {
      const data = JSON.stringify({
        value,
        timestamp: Date.now(),
      });
      // Not: Gerçek encryption için bir kütüphane kullanılmalı
      // Bu basit bir obfuscation
      const stored = encrypt ? btoa(data) : data;
      localStorage.setItem(STORAGE_PREFIX + key, stored);
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },

  get(key, { decrypt = false, maxAge = null } = {}) {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key);
      if (!stored) return null;

      const data = decrypt ? atob(stored) : stored;
      const parsed = JSON.parse(data);

      // Yaş kontrolü
      if (maxAge && Date.now() - parsed.timestamp > maxAge) {
        this.remove(key);
        return null;
      }

      return parsed.value;
    } catch (e) {
      console.error('Storage read error:', e);
      return null;
    }
  },

  remove(key) {
    localStorage.removeItem(STORAGE_PREFIX + key);
  },

  clear() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  },
};

// ============================================
// Error Sanitization
// ============================================

/**
 * API hatalarını kullanıcı dostu mesajlara çevirir
 * Hassas bilgileri gizler
 */
export function sanitizeError(error) {
  // Axios error
  if (error.response) {
    const status = error.response.status;
    const serverMessage = error.response.data?.message;

    // Bilinen hata kodları için özel mesajlar
    const statusMessages = {
      400: 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.',
      401: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.',
      403: 'Bu işlem için yetkiniz bulunmuyor.',
      404: 'Aradığınız kaynak bulunamadı.',
      409: 'Bu işlem zaten gerçekleştirilmiş.',
      422: 'Girilen bilgiler geçersiz.',
      429: 'Çok fazla istek gönderdiniz. Lütfen bekleyin.',
      500: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
      502: 'Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.',
      503: 'Servis geçici olarak kullanılamıyor.',
    };

    // Server'dan gelen mesaj güvenliyse kullan
    if (serverMessage && !serverMessage.includes('Error:') && !serverMessage.includes('SQL')) {
      return serverMessage;
    }

    return statusMessages[status] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }

  // Network error
  if (error.request) {
    return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
  }

  // Diğer hatalar
  return 'Beklenmeyen bir hata oluştu.';
}

// ============================================
// URL Validation
// ============================================

const ALLOWED_DOMAINS = [
  'kahinmarket.com',
  'api.kahinmarket.com',
  'localhost',
];

/**
 * URL'in güvenli olup olmadığını kontrol eder
 */
export function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * External link kontrolü
 */
export function isExternalLink(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin !== window.location.origin;
  } catch {
    return false;
  }
}

// ============================================
// Activity Tracking (for auto-logout)
// ============================================

let lastActivityTime = Date.now();
let activityListenersAttached = false;

/**
 * Kullanıcı aktivitesini izle
 */
export function trackUserActivity() {
  if (activityListenersAttached) return;

  const updateActivity = () => {
    lastActivityTime = Date.now();
  };

  // Kullanıcı aktivitelerini dinle
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });

  activityListenersAttached = true;
}

/**
 * Son aktiviteden bu yana geçen süreyi al (ms)
 */
export function getInactivityDuration() {
  return Date.now() - lastActivityTime;
}

/**
 * Aktivite zamanını sıfırla
 */
export function resetActivityTime() {
  lastActivityTime = Date.now();
}

export default {
  escapeHtml,
  sanitizeInput,
  sanitizeObject,
  validators,
  validateForm,
  checkRateLimit,
  resetRateLimit,
  secureStorage,
  sanitizeError,
  isAllowedUrl,
  isExternalLink,
  trackUserActivity,
  getInactivityDuration,
  resetActivityTime,
};
