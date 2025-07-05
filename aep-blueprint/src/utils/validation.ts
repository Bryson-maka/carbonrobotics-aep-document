/**
 * Lightweight validation utilities
 * 
 * Design principles:
 * 1. Simple, functional validation without heavy dependencies
 * 2. Composable validation functions
 * 3. Clear error messages
 * 4. Type-safe throughout
 * 5. Easy to test and maintain
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export type Validator<T> = (value: T) => ValidationResult;

/**
 * Create a successful validation result
 */
export const valid = (): ValidationResult => ({ isValid: true });

/**
 * Create a failed validation result
 */
export const invalid = (error: string): ValidationResult => ({ isValid: false, error });

/**
 * Compose multiple validators (all must pass)
 */
export function compose<T>(...validators: Validator<T>[]): Validator<T> {
  return (value: T) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        return result;
      }
    }
    return valid();
  };
}

/**
 * Basic validation functions
 */
export const validators = {
  /**
   * Validate required string
   */
  required: (fieldName: string): Validator<string> => (value) => {
    const trimmed = value?.trim();
    if (!trimmed) {
      return invalid(`${fieldName} is required`);
    }
    return valid();
  },

  /**
   * Validate string length constraints
   */
  length: (fieldName: string, min: number, max: number): Validator<string> => (value) => {
    const length = value?.length || 0;
    
    if (length < min) {
      return invalid(`${fieldName} must be at least ${min} characters`);
    }
    
    if (length > max) {
      return invalid(`${fieldName} must be less than ${max} characters`);
    }
    
    return valid();
  },

  /**
   * Validate trimmed string length (after removing whitespace)
   */
  trimmedLength: (fieldName: string, min: number, max: number): Validator<string> => (value) => {
    const trimmed = value?.trim() || '';
    const length = trimmed.length;
    
    if (length < min) {
      return invalid(`${fieldName} must be at least ${min} characters`);
    }
    
    if (length > max) {
      return invalid(`${fieldName} must be less than ${max} characters`);
    }
    
    return valid();
  },

  /**
   * Validate email format (simple regex)
   */
  email: (value: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return invalid('Please enter a valid email address');
    }
    return valid();
  },

  /**
   * Validate URL format
   */
  url: (value: string): ValidationResult => {
    try {
      new URL(value);
      return valid();
    } catch {
      return invalid('Please enter a valid URL');
    }
  },

  /**
   * Validate number range
   */
  numberRange: (fieldName: string, min: number, max: number): Validator<number> => (value) => {
    if (value < min || value > max) {
      return invalid(`${fieldName} must be between ${min} and ${max}`);
    }
    return valid();
  },
};

/**
 * Pre-configured validators for common form fields
 */
export const formValidators = {
  sectionTitle: compose(
    validators.required('Section title'),
    validators.trimmedLength('Section title', 1, 200)
  ),

  sectionDescription: validators.length('Section description', 0, 1000),

  questionPrompt: compose(
    validators.required('Question prompt'),
    validators.trimmedLength('Question prompt', 1, 500)
  ),

  answerContent: validators.length('Answer content', 0, 10000),
};

/**
 * Validate an object with multiple fields
 */
export function validateObject<T extends Record<string, any>>(
  obj: T,
  schema: { [K in keyof T]?: Validator<T[K]> }
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(schema)) {
    if (validator && obj[field] !== undefined) {
      const result = validator(obj[field]);
      if (!result.isValid) {
        errors[field as keyof T] = result.error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
}

/**
 * Helper to create form validation hook
 */
export function createFormValidator<T extends Record<string, any>>(
  schema: { [K in keyof T]?: Validator<T[K]> }
) {
  return (data: T) => validateObject(data, schema);
}