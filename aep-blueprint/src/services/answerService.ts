import { BaseService } from './base';
import type { 
  Answer, 
  DatabaseAnswer,
  ServiceResponse
} from '@/types/database';

/**
 * Service for managing answers with proper validation and error handling
 */
export class AnswerService extends BaseService {
  private static instance: AnswerService;

  static getInstance(): AnswerService {
    if (!AnswerService.instance) {
      AnswerService.instance = new AnswerService();
    }
    return AnswerService.instance;
  }

  /**
   * Get answer by question ID
   */
  async getAnswerByQuestionId(questionId: string): Promise<ServiceResponse<Answer | null>> {
    try {
      if (!questionId?.trim()) {
        return this.failure({
          message: 'Question ID is required',
          code: 'VALIDATION_ERROR',
        });
      }

      const { data, error } = await this.supabase
        .from('answers')
        .select('*')
        .eq('question_id', questionId)
        .maybeSingle();

      if (error) {
        return this.failure(this.handleError(error));
      }

      if (!data) {
        return this.success(null);
      }
      
      const answer = this.transformDatabaseAnswer(data);
      return this.success(answer);
    } catch (error) {
      return this.failure(this.handleError(error));
    }
  }

  /**
   * Create or update an answer
   */
  async upsertAnswer(
    questionId: string,
    input: Partial<Answer>
  ): Promise<ServiceResponse<Answer>> {
    try {
      // Validate input
      if (!questionId?.trim()) {
        return this.failure({
          message: 'Question ID is required',
          code: 'VALIDATION_ERROR',
        });
      }

      // Validate content
      if (!input.content && !input.chart_config && !input.media_urls && !input.interactive_data) {
        return this.failure({
          message: 'Answer must have some content',
          code: 'VALIDATION_ERROR',
        });
      }

      // Validate status
      if (input.status && !['draft', 'final'].includes(input.status)) {
        return this.failure({
          message: 'Status must be either "draft" or "final"',
          code: 'VALIDATION_ERROR',
        });
      }

      // Validate content type
      if (input.content_type && !['text', 'chart', 'media', 'interactive'].includes(input.content_type)) {
        return this.failure({
          message: 'Content type must be one of: text, chart, media, interactive',
          code: 'VALIDATION_ERROR',
        });
      }

      // Prepare data for upsert
      const answerData = {
        question_id: questionId,
        content: input.content ? JSON.stringify(input.content) : null,
        status: input.status || 'draft',
        content_type: input.content_type || 'text',
        chart_config: input.chart_config ? JSON.stringify(input.chart_config) : null,
        media_urls: input.media_urls || null,
        interactive_data: input.interactive_data ? JSON.stringify(input.interactive_data) : null,
      };

      const { data, error } = await this.supabase
        .from('answers')
        .upsert(answerData, {
          onConflict: 'question_id',
        })
        .select()
        .single();

      if (error) {
        return this.failure(this.handleError(error));
      }

      const answer = this.transformDatabaseAnswer(data);
      return this.success(answer);
    } catch (error) {
      return this.failure(this.handleError(error));
    }
  }

  /**
   * Delete an answer
   */
  async deleteAnswer(questionId: string): Promise<ServiceResponse<void>> {
    try {
      if (!questionId?.trim()) {
        return this.failure({
          message: 'Question ID is required',
          code: 'VALIDATION_ERROR',
        });
      }

      const { error } = await this.supabase
        .from('answers')
        .delete()
        .eq('question_id', questionId);

      if (error) {
        return this.failure(this.handleError(error));
      }

      return this.success(undefined);
    } catch (error) {
      return this.failure(this.handleError(error));
    }
  }

  /**
   * Transform database answer to domain answer
   */
  private transformDatabaseAnswer(dbAnswer: DatabaseAnswer): Answer {
    return {
      id: dbAnswer.id,
      question_id: dbAnswer.question_id,
      content: dbAnswer.content ? JSON.parse(dbAnswer.content as string) : null,
      status: dbAnswer.status,
      content_type: dbAnswer.content_type,
      chart_config: dbAnswer.chart_config ? JSON.parse(dbAnswer.chart_config as string) : null,
      media_urls: dbAnswer.media_urls || null,
      interactive_data: dbAnswer.interactive_data ? JSON.parse(dbAnswer.interactive_data as string) : null,
    };
  }
}

// Export singleton instance
export const answerService = AnswerService.getInstance();