import type { VideoOperation } from './types';

const VIDEO_OPERATIONS_KEY = 'video-operations';

/**
 * localStorage utilities for persisting video operations
 */
export const videoOperationsStorage = {
  /**
   * Get all stored video operations
   */
  getAll(): VideoOperation[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(VIDEO_OPERATIONS_KEY);
      if (!stored) return [];

      const operations = JSON.parse(stored) as VideoOperation[];
      // Convert timestamp strings back to Date objects
      return operations.map(op => ({
        ...op,
        timestamp: new Date(op.timestamp),
      }));
    } catch {
      return [];
    }
  },

  /**
   * Store a video operation
   */
  store(operation: VideoOperation): void {
    if (typeof window === 'undefined') return;

    try {
      const existing = this.getAll();
      const updated = [operation, ...existing.filter(op => op.id !== operation.id)];
      localStorage.setItem(VIDEO_OPERATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to store video operation:', error);
    }
  },

  /**
   * Update an existing operation
   */
  update(operationId: string, updates: Partial<VideoOperation>): void {
    if (typeof window === 'undefined') return;

    try {
      const existing = this.getAll();
      const updated = existing.map(op =>
        op.id === operationId ? { ...op, ...updates } : op
      );
      localStorage.setItem(VIDEO_OPERATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update video operation:', error);
    }
  },

  /**
   * Remove a completed or failed operation
   */
  remove(operationId: string): void {
    if (typeof window === 'undefined') return;

    try {
      const existing = this.getAll();
      const filtered = existing.filter(op => op.id !== operationId);
      localStorage.setItem(VIDEO_OPERATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove video operation:', error);
    }
  },

  /**
   * Get pending/processing operations that need polling
   */
  getPending(): VideoOperation[] {
    return this.getAll().filter(op => !op.operation.done);
  },

  /**
   * Clear all stored operations (for cleanup)
   */
  clear(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(VIDEO_OPERATIONS_KEY);
    } catch (error) {
      console.error('Failed to clear video operations:', error);
    }
  },
};