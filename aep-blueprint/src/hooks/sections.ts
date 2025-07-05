import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { sectionService } from '@/services/sectionService';
import type {
  Section,
  CreateSectionInput,
  UpdateSectionInput,
  ServiceError,
} from '@/types/database';

/**
 * React Query hooks for sections - standardized patterns
 * 
 * Design principles:
 * 1. Consistent query keys for proper caching
 * 2. Optimistic updates for smooth UX
 * 3. Automatic error handling and recovery
 * 4. Proper invalidation strategies
 * 5. Type-safe throughout
 */

// Query Keys - centralized for consistency
export const sectionKeys = {
  all: ['sections'] as const,
  lists: () => [...sectionKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...sectionKeys.lists(), filters] as const,
  details: () => [...sectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sectionKeys.details(), id] as const,
};

/**
 * Hook to get all sections with their questions
 */
export function useSections(): UseQueryResult<Section[], ServiceError> {
  return useQuery({
    queryKey: sectionKeys.list(),
    queryFn: async () => {
      const response = await sectionService.getSections();
      if (response.error) {
        throw response.error;
      }
      return response.data!;
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

/**
 * Hook to get a single section by ID
 */
export function useSection(id: string): UseQueryResult<Section, ServiceError> {
  return useQuery({
    queryKey: sectionKeys.detail(id),
    queryFn: async () => {
      const response = await sectionService.getSectionById(id);
      if (response.error) {
        throw response.error;
      }
      return response.data!;
    },
    enabled: !!id, // Only run query if ID is provided
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new section with optimistic updates
 */
export function useCreateSection(): UseMutationResult<Section, ServiceError, CreateSectionInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSectionInput) => {
      const response = await sectionService.createSection(input);
      if (response.error) {
        throw response.error;
      }
      return response.data!;
    },
    onSuccess: (newSection) => {
      // Add to sections list cache
      queryClient.setQueryData<Section[]>(
        sectionKeys.list(), 
        (oldSections = []) => [...oldSections, newSection].sort((a, b) => a.order_idx - b.order_idx)
      );
      
      // Set individual section cache
      queryClient.setQueryData(sectionKeys.detail(newSection.id), newSection);
    },
    onError: (error) => {
      console.error('Failed to create section:', error);
    },
  });
}

/**
 * Hook to update a section with optimistic updates
 */
export function useUpdateSection(): UseMutationResult<
  Section, 
  ServiceError, 
  { id: string; input: UpdateSectionInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }) => {
      const response = await sectionService.updateSection(id, input);
      if (response.error) {
        throw response.error;
      }
      return response.data!;
    },
    onMutate: async ({ id, input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: sectionKeys.all });

      // Snapshot previous values
      const previousSections = queryClient.getQueryData<Section[]>(sectionKeys.list());
      const previousSection = queryClient.getQueryData<Section>(sectionKeys.detail(id));

      // Optimistically update sections list
      if (previousSections) {
        queryClient.setQueryData<Section[]>(
          sectionKeys.list(),
          previousSections.map(section => 
            section.id === id 
              ? { ...section, ...input }
              : section
          )
        );
      }

      // Optimistically update individual section
      if (previousSection) {
        queryClient.setQueryData(
          sectionKeys.detail(id),
          { ...previousSection, ...input }
        );
      }

      // Return context for rollback
      return { previousSections, previousSection };
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic updates
      if (context?.previousSections) {
        queryClient.setQueryData(sectionKeys.list(), context.previousSections);
      }
      if (context?.previousSection) {
        queryClient.setQueryData(sectionKeys.detail(id), context.previousSection);
      }
      console.error('Failed to update section:', error);
    },
    onSettled: (updatedSection, error, { id }) => {
      // Refresh data from server to ensure consistency
      if (!error && updatedSection) {
        queryClient.setQueryData(sectionKeys.detail(id), updatedSection);
        queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
      }
    },
  });
}

/**
 * Hook to delete a section with optimistic updates
 */
export function useDeleteSection(): UseMutationResult<void, ServiceError, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await sectionService.deleteSection(id);
      if (response.error) {
        throw response.error;
      }
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: sectionKeys.all });

      // Snapshot previous values
      const previousSections = queryClient.getQueryData<Section[]>(sectionKeys.list());

      // Optimistically remove from list
      if (previousSections) {
        queryClient.setQueryData<Section[]>(
          sectionKeys.list(),
          previousSections.filter(section => section.id !== id)
        );
      }

      // Remove individual section cache
      queryClient.removeQueries({ queryKey: sectionKeys.detail(id) });

      return { previousSections };
    },
    onError: (error, id, context) => {
      // Rollback optimistic updates
      if (context?.previousSections) {
        queryClient.setQueryData(sectionKeys.list(), context.previousSections);
      }
      console.error('Failed to delete section:', error);
    },
    onSettled: () => {
      // Refresh data from server
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
    },
  });
}

/**
 * Hook to update section order with optimistic updates
 */
export function useUpdateSectionOrder(): UseMutationResult<
  void, 
  ServiceError, 
  { id: string; order_idx: number }[]
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates) => {
      const response = await sectionService.updateSectionOrder(updates);
      if (response.error) {
        throw response.error;
      }
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: sectionKeys.all });

      // Snapshot previous values
      const previousSections = queryClient.getQueryData<Section[]>(sectionKeys.list());

      // Optimistically update order
      if (previousSections) {
        const updateMap = new Map(updates.map(u => [u.id, u.order_idx]));
        const updatedSections = previousSections
          .map(section => ({
            ...section,
            order_idx: updateMap.get(section.id) ?? section.order_idx,
          }))
          .sort((a, b) => a.order_idx - b.order_idx);

        queryClient.setQueryData(sectionKeys.list(), updatedSections);
      }

      return { previousSections };
    },
    onError: (error, updates, context) => {
      // Rollback optimistic updates
      if (context?.previousSections) {
        queryClient.setQueryData(sectionKeys.list(), context.previousSections);
      }
      console.error('Failed to update section order:', error);
    },
    onSettled: () => {
      // Refresh data from server
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
    },
  });
}