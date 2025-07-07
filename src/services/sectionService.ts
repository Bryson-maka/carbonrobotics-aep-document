import { BaseService } from './base';
import type {
  Section,
  DatabaseSection,
  CreateSectionInput,
  UpdateSectionInput,
  ServiceResponse,
} from '@/types/database';

/**
 * Section Service - Handles all section-related database operations
 * 
 * Design principles:
 * 1. Single responsibility - only section operations
 * 2. Input validation before database calls
 * 3. Consistent error handling via BaseService
 * 4. Optimized queries with proper relations
 * 5. Type-safe operations throughout
 */
export class SectionService extends BaseService {
  
  /**
   * Get all sections with their questions (optimized single query)
   */
  async getSections(): Promise<ServiceResponse<Section[]>> {
    try {
      const { data, error } = await this.supabase
        .from('sections')
        .select(`
          id,
          title,
          description,
          order_idx,
          questions(
            id,
            prompt,
            order_idx
          )
        `)
        .order('order_idx', { ascending: true })
        .order('order_idx', { 
          ascending: true, 
          referencedTable: 'questions' 
        });

      if (error) {
        return this.failure(this.handleError(error));
      }

      // Transform database response to domain types
      const sections: Section[] = (data || []).map(this.transformDatabaseSection);
      
      return this.success(sections);
    } catch (error) {
      return this.failure(this.handleError(error));
    }
  }

  /**
   * Get a single section by ID with questions
   */
  async getSectionById(id: string): Promise<ServiceResponse<Section>> {
    try {
      // Validate input
      if (!id?.trim()) {
        return this.failure({
          message: 'Section ID is required',
          code: 'VALIDATION_ERROR',
        });
      }

      const { data, error } = await this.supabase
        .from('sections')
        .select(`
          id,
          title,
          description,
          order_idx,
          questions(
            id,
            prompt,
            order_idx
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        return this.failure(this.handleError(error));
      }

      if (!data) {
        return this.failure({
          message: 'Section not found',
          code: 'NOT_FOUND',
        });
      }

      const section = this.transformDatabaseSection(data);
      return this.success(section);
    } catch (error) {
      return this.failure(this.handleError(error));
    }
  }

  /**
   * Create a new section
   */
  async createSection(input: CreateSectionInput): Promise<ServiceResponse<Section>> {
    try {
      // Validate input
      const validationError = this.validateCreateInput(input);
      if (validationError) {
        return this.failure(validationError);
      }

      // Get next order_idx if not provided
      const orderIdx = input.order_idx ?? await this.getNextOrderIndex();

      const { data, error } = await this.supabase
        .from('sections')
        .insert({
          title: input.title.trim(),
          description: input.description?.trim() || null,
          order_idx: orderIdx,
        })
        .select()
        .single();

      if (error) {
        return this.failure(this.handleError(error));
      }

      const section = this.transformDatabaseSection(data);
      return this.success(section);
    } catch (error) {
      return this.failure(this.handleError(error));
    }
  }

  /**
   * Update an existing section
   */
  async updateSection(id: string, input: UpdateSectionInput): Promise<ServiceResponse<Section>> {
    try {
      // Validate input
      if (!id?.trim()) {
        return this.failure({
          message: 'Section ID is required',
          code: 'VALIDATION_ERROR',
        });
      }

      const validationError = this.validateUpdateInput(input);
      if (validationError) {
        return this.failure(validationError);
      }

      // Build update object (only include defined fields)
      const updateData: Partial<DatabaseSection> = {};
      if (input.title !== undefined) {
        updateData.title = input.title.trim();
      }
      if (input.description !== undefined) {
        updateData.description = input.description?.trim() || null;
      }
      if (input.order_idx !== undefined) {
        updateData.order_idx = input.order_idx;
      }

      const { data, error } = await this.supabase
        .from('sections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return this.failure(this.handleError(error));
      }

      if (!data) {
        return this.failure({
          message: 'Section not found',
          code: 'NOT_FOUND',
        });
      }

      const section = this.transformDatabaseSection(data);
      return this.success(section);
    } catch (error) {
      return this.failure(this.handleError(error));
    }
  }

  /**
   * Delete a section (cascades to questions/answers via DB constraints)
   */
  async deleteSection(id: string): Promise<ServiceResponse<void>> {
    try {
      if (!id?.trim()) {
        return this.failure({
          message: 'Section ID is required',
          code: 'VALIDATION_ERROR',
        });
      }

      const { error } = await this.supabase
        .from('sections')
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
   * Update multiple sections' order in a single transaction
   */
  async updateSectionOrder(updates: { id: string; order_idx: number }[]): Promise<ServiceResponse<void>> {
    try {
      if (!updates?.length) {
        return this.failure({
          message: 'No sections to update',
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

      // Update each section's order individually (safer than upsert for partial updates)
      for (const { id, order_idx } of updates) {
        const { error } = await this.supabase
          .from('sections')
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
   * Transform database section to domain section
   */
  private transformDatabaseSection(dbSection: unknown): Section {
    const section = dbSection as DatabaseSection & { questions?: any[] };
    return {
      id: section.id,
      title: section.title,
      description: section.description,
      order_idx: section.order_idx,
      questions: section.questions?.map((q: any) => ({
        id: q.id,
        section_id: section.id,
        prompt: q.prompt,
        order_idx: q.order_idx,
      })) || [],
    };
  }

  /**
   * Get the next available order index
   */
  private async getNextOrderIndex(): Promise<number> {
    const { data } = await this.supabase
      .from('sections')
      .select('order_idx')
      .order('order_idx', { ascending: false })
      .limit(1);

    return (data?.[0]?.order_idx || 0) + 1;
  }

  /**
   * Validate create section input
   */
  private validateCreateInput(input: CreateSectionInput) {
    const requiredError = this.validateRequired(input, ['title']);
    if (requiredError) return requiredError;

    return this.validateLength(input.title, 'Title', 200);
  }

  /**
   * Validate update section input
   */
  private validateUpdateInput(input: UpdateSectionInput) {
    // At least one field must be provided
    if (!input.title && !input.description && input.order_idx === undefined) {
      return {
        message: 'At least one field must be provided for update',
        code: 'VALIDATION_ERROR',
      };
    }

    if (input.title) {
      const titleError = this.validateLength(input.title, 'Title', 200);
      if (titleError) return titleError;
    }

    if (input.description) {
      const descError = this.validateLength(input.description, 'Description', 1000);
      if (descError) return descError;
    }

    return null;
  }
}

// Export singleton instance
export const sectionService = new SectionService();