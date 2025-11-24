// src/hooks/useFormValidation.js
import { useState, useCallback, useMemo } from 'react'
import { validators, validateForm, sanitizeInput } from '../utils/security'

/**
 * Form validation hook'u
 * @param {Object} initialValues - Form'un başlangıç değerleri
 * @param {Object} validationRules - Her alan için validation kuralları
 * @param {Object} options - Ek seçenekler
 */
export function useFormValidation(initialValues = {}, validationRules = {}, options = {}) {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    sanitizeInputs = true
  } = options

  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tek bir alanı validate et
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name]
    if (!rules) return null

    for (const rule of rules) {
      const result = typeof rule === 'function' ? rule(value) : rule
      if (!result.valid) {
        return result.message
      }
    }
    return null
  }, [validationRules])

  // Tüm formu validate et
  const validateAll = useCallback(() => {
    const { isValid, errors: newErrors } = validateForm(values, validationRules)
    setErrors(newErrors)
    return isValid
  }, [values, validationRules])

  // Input değişikliği
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    let newValue = type === 'checkbox' ? checked : value

    // Sanitization (password ve email hariç)
    if (sanitizeInputs && type !== 'password' && type !== 'email') {
      newValue = sanitizeInput(newValue)
    }

    setValues(prev => ({ ...prev, [name]: newValue }))

    // Validate on change
    if (validateOnChange && touched[name]) {
      const error = validateField(name, newValue)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }, [sanitizeInputs, validateOnChange, touched, validateField])

  // Programmatic value setter
  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))

    if (validateOnChange && touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }, [validateOnChange, touched, validateField])

  // Blur handler
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target

    setTouched(prev => ({ ...prev, [name]: true }))

    if (validateOnBlur) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }, [validateOnBlur, validateField])

  // Form submit handler
  const handleSubmit = useCallback((onSubmit) => async (e) => {
    e?.preventDefault()

    // Tüm alanları touched olarak işaretle
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {})
    setTouched(allTouched)

    // Validate
    const isValid = validateAll()
    if (!isValid) return

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validationRules, validateAll])

  // Form reset
  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  // Belirli bir alanı reset et
  const resetField = useCallback((name) => {
    setValues(prev => ({ ...prev, [name]: initialValues[name] }))
    setErrors(prev => ({ ...prev, [name]: null }))
    setTouched(prev => ({ ...prev, [name]: false }))
  }, [initialValues])

  // Form durumu
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error)
  }, [errors])

  const isDirty = useMemo(() => {
    return Object.keys(values).some(key => values[key] !== initialValues[key])
  }, [values, initialValues])

  // Field props generator (input'lara spread etmek için)
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: handleChange,
    onBlur: handleBlur,
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined
  }), [values, handleChange, handleBlur, errors])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setValues,
    setErrors,
    reset,
    resetField,
    validateField,
    validateAll,
    getFieldProps
  }
}

// ============================================
// Hazır Validation Şemaları
// ============================================

export const validationSchemas = {
  // Login formu
  login: {
    email: [validators.email],
    password: [(value) => {
      if (!value) return { valid: false, message: 'Şifre gerekli' }
      return { valid: true }
    }]
  },

  // Kayıt formu
  register: {
    username: [validators.username],
    email: [validators.email],
    password: [validators.password],
    confirmPassword: [(value, values) => {
      if (!value) return { valid: false, message: 'Şifre tekrarı gerekli' }
      if (value !== values?.password) {
        return { valid: false, message: 'Şifreler eşleşmiyor' }
      }
      return { valid: true }
    }]
  },

  // Emir oluşturma formu
  order: {
    quantity: [validators.quantity],
    price: [validators.price]
  },

  // Profil güncelleme
  profile: {
    username: [validators.username],
    email: [validators.email],
    bio: [(value) => validators.text(value, { maxLength: 500, fieldName: 'Biyografi' })]
  }
}

// ============================================
// Yardımcı Validation Fonksiyonları
// ============================================

/**
 * Custom validation rule oluştur
 */
export function createRule(validate, message) {
  return (value) => {
    const isValid = validate(value)
    return { valid: isValid, message: isValid ? null : message }
  }
}

/**
 * Required rule
 */
export function required(fieldName = 'Bu alan') {
  return createRule(
    (value) => value !== null && value !== undefined && value !== '',
    `${fieldName} gerekli`
  )
}

/**
 * Min length rule
 */
export function minLength(min, fieldName = 'Bu alan') {
  return createRule(
    (value) => !value || value.length >= min,
    `${fieldName} en az ${min} karakter olmalı`
  )
}

/**
 * Max length rule
 */
export function maxLength(max, fieldName = 'Bu alan') {
  return createRule(
    (value) => !value || value.length <= max,
    `${fieldName} en fazla ${max} karakter olabilir`
  )
}

/**
 * Pattern rule
 */
export function pattern(regex, message) {
  return createRule(
    (value) => !value || regex.test(value),
    message
  )
}

/**
 * Range rule
 */
export function range(min, max, fieldName = 'Değer') {
  return createRule(
    (value) => {
      const num = parseFloat(value)
      return !isNaN(num) && num >= min && num <= max
    },
    `${fieldName} ${min} ile ${max} arasında olmalı`
  )
}

export default useFormValidation
