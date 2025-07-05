import { supabase } from '@/lib/supabase';
import type { ServiceResponse, ServiceError } from '@/types/database';
import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Base service class following Supabase best practices
 * 
 * Design principles:
 * 1. Consistent error handling across all services
 * 2. Type-safe operations with proper input validation
 * 3. Centralized logging and monitoring
 * 4. Standardized response format
 */
export abstract class BaseService {
  protected supabase = supabase;

  /**
   * Transform Supabase errors into standardized service errors
   */
  protected handleError(error: PostgrestError | Error | unknown): ServiceError {
    if (error && typeof error === 'object' && 'message' in error) {
      const pgError = error as PostgrestError;
      
      // Log error for monitoring (in production, send to monitoring service)
      console.error('Service Error:', {
        message: pgError.message,
        code: pgError.code,
        details: pgError.details,
        hint: pgError.hint,
      });

      return {
        message: this.getUserFriendlyMessage(pgError),
        code: pgError.code,
        details: pgError.details,
      };
    }

    // Handle unknown errors
    console.error('Unknown Service Error:', error);
    return {
      message: 'An unexpected error occurred. Please try again.',
      details: error,
    };
  }

  /**
   * Convert technical error messages to user-friendly ones
   */
  private getUserFriendlyMessage(error: PostgrestError): string {
    // Common Supabase/PostgreSQL error mappings
    switch (error.code) {
      case '23505': // unique_violation
        return 'This item already exists. Please choose a different name.';
      case '23503': // foreign_key_violation
        return 'Cannot perform this action due to existing dependencies.';
      case '42501': // insufficient_privilege
        return 'You do not have permission to perform this action.';
      case 'PGRST116': // No rows found
        return 'The requested item was not found.';
      case 'PGRST301': // No rows returned
        return 'No data was returned for this operation.';
      default:
        return error.message || 'An error occurred while processing your request.';
    }
  }

  /**
   * Create a successful service response
   */
  protected success<T>(data: T): ServiceResponse<T> {
    return {
      data,
      error: null,
    };
  }

  /**
   * Create an error service response
   */
  protected failure<T>(error: ServiceError): ServiceResponse<T> {
    return {
      data: null,
      error,
    };
  }

  /**
   * Validate required fields
   */
  protected validateRequired(
    data: Record<string, unknown>,
    requiredFields: string[]
  ): ServiceError | null {
    const missingFields = requiredFields.filter(
      (field) => !data[field] || (typeof data[field] === 'string' && !data[field].trim())
    );

    if (missingFields.length > 0) {
      return {
        message: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'VALIDATION_ERROR',
        details: { missingFields },
      };
    }

    return null;
  }

  /**
   * Validate string length constraints
   */
  protected validateLength(
    value: string,
    fieldName: string,
    maxLength: number,
    minLength = 1
  ): ServiceError | null {
    if (value.length < minLength) {
      return {
        message: `${fieldName} must be at least ${minLength} characters`,
        code: 'VALIDATION_ERROR',
      };
    }

    if (value.length > maxLength) {
      return {
        message: `${fieldName} must be less than ${maxLength} characters`,
        code: 'VALIDATION_ERROR',
      };
    }

    return null;
  }
}