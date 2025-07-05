import { BaseService } from './base';
import type {
  Question,
  DatabaseQuestion,
  CreateQuestionInput,
  UpdateQuestionInput,
  ServiceResponse,
} from '@/types/database';

/**
 * Question Service - Handles all question-related database operations
 * 
 * Design principles:
 * 1. Single responsibility - only question operations
 * 2. Input validation before database calls
 * 3. Consistent error handling via BaseService
 * 4. Type-safe operations throughout
 */
export class QuestionService extends BaseService {
  
  /**
   * Get questions for a specific section
   */
  async getQuestionsBySection(sectionId: string): Promise<ServiceResponse<Question[]>> {
    try {
      if (!sectionId?.trim()) {
        return this.failure({
          message: 'Section ID is required',
          code: 'VALIDATION_ERROR',
        });
      }

      const { data, error } = await this.supabase
        .from('questions')
        .select('*')
        .eq('section_id', sectionId)
        .order('order_idx', { ascending: true });

      if (error) {
        return this.failure(this.handleError(error));
      }

      const questions: Question[] = (data || []).map(this.transformDatabaseQuestion);
      return this.success(questions);
    } catch (error) {
      return this.failure(this.handleError(error));
    }
  }

  /**
   * Create a new question
   */
  async createQuestion(input: CreateQuestionInput): Promise<ServiceResponse<Question>> {
    try {
      const validationError = this.validateCreateInput(input);
      if (validationError) {
        return this.failure(validationError);
      }

      // Get next order_idx if not provided
      const orderIdx = input.order_idx ?? await this.getNextOrderIndex(input.section_id);

      const { data, error } = await this.supabase
        .from('questions')
        .insert({
          section_id: input.section_id,
          prompt: input.prompt.trim(),
          order_idx: orderIdx,
        })
        .select()
        .single();

      if (error) {
        return this.failure(this.handleError(error));
      }

      const question = this.transformDatabaseQuestion(data);
      return this.success(question);
    } catch (error) {
      return this.failure(this.handleError(error));
    }
  }

  /**
   * Update an existing question
   */
  async updateQuestion(id: string, input: UpdateQuestionInput): Promise<ServiceResponse<Question>> {
    try {
      if (!id?.trim()) {
        return this.failure({
          message: 'Question ID is required',
          code: 'VALIDATION_ERROR',
        });
      }

      const validationError = this.validateUpdateInput(input);
      if (validationError) {
        return this.failure(validationError);
      }

      // Build update object (only include defined fields)
      const updateData: Partial<DatabaseQuestion> = {};
      if (input.prompt !== undefined) {
        updateData.prompt = input.prompt.trim();
      }
      if (input.order_idx !== undefined) {
        updateData.order_idx = input.order_idx;
      }

      const { data, error } = await this.supabase
        .from('questions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return this.failure(this.handleError(error));
      }

      if (!data) {
        return this.failure({
          message: 'Question not found',
          code: 'NOT_FOUND',
        });
      }

      const question = this.transformDatabaseQuestion(data);
      return this.success(question);
    } catch (error) {
      return this.failure(this.handleError(error));
    }
  }

  /**
   * Delete a question (cascades to answers via DB constraints)
   */
  async deleteQuestion(id: string): Promise<ServiceResponse<void>> {
    try {
      if (!id?.trim()) {
        return this.failure({
          message: 'Question ID is required',
          code: 'VALIDATION_ERROR',
        });
      }

      const { error } = await this.supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) {
        return this.failure(this.handleError(error));
      }

      return this.success(undefined);
    } catch (error) {
      return this.failure(this.handleError(error));
    }
  }

  /**
   * Update multiple questions' order in a single transaction
   */
  async updateQuestionOrder(updates: { id: string; order_idx: number }[]): Promise<ServiceResponse<void>> {
    try {
      if (!updates?.length) {
        return this.failure({
          message: 'No questions to update',
          code: 'VALIDATION_ERROR',
        });
      }

      // Validate all updates have required fields
      for (const update of updates) {
        if (!update.id?.trim() || typeof update.order_idx !== 'number') {
          return this.failure({
            message: 'Invalid update data: id and order_idx are required',
            code: 'VALIDATION_ERROR',
          });
        }
      }

      // Update each question's order individually (safer than upsert for partial updates)
      for (const { id, order_idx } of updates) {
        const { error } = await this.supabase
          .from('questions')
          .update({ order_idx })
          .eq('id', id);

        if (error) {
          return this.failure(this.handleError(error));
        }
      }

      return this.success(undefined);
    } catch (error) {
      return this.failure(this.handleError(error));
    }
  }

  // Private helper methods

  /**
   * Transform database question to domain question
   */
  private transformDatabaseQuestion(dbQuestion: DatabaseQuestion): Question {
    return {
      id: dbQuestion.id,
      section_id: dbQuestion.section_id,
      prompt: dbQuestion.prompt,
      order_idx: dbQuestion.order_idx,
    };
  }

  /**
   * Get the next available order index for a section
   */
  private async getNextOrderIndex(sectionId: string): Promise<number> {
    const { data } = await this.supabase
      .from('questions')
      .select('order_idx')
      .eq('section_id', sectionId)
      .order('order_idx', { ascending: false })
      .limit(1);

    return (data?.[0]?.order_idx || 0) + 1;
  }

  /**
   * Validate create question input
   */
  private validateCreateInput(input: CreateQuestionInput) {
    const requiredError = this.validateRequired(input, ['section_id', 'prompt']);
    if (requiredError) return requiredError;

    return this.validateLength(input.prompt, 'Prompt', 500);
  }

  /**
   * Validate update question input
   */
  private validateUpdateInput(input: UpdateQuestionInput) {
    // At least one field must be provided
    if (!input.prompt && input.order_idx === undefined) {
      return {
        message: 'At least one field must be provided for update',
        code: 'VALIDATION_ERROR',
      };
    }

    if (input.prompt) {
      const promptError = this.validateLength(input.prompt, 'Prompt', 500);
      if (promptError) return promptError;
    }

    return null;
  }
}

// Export singleton instance
export const questionService = new QuestionService();