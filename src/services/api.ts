import type { GalleryImage } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new ApiError(response.status, errorData.message || `HTTP ${response.status}`);
  }
  return response.json();
};

const api = {
  async getGallery(): Promise<GalleryImage[]> {
    const response = await fetch(`${API_BASE_URL}/gallery`);
    return handleResponse(response);
  },

  async addGallery(record: Omit<GalleryImage, 'id' | 'timestamp'>): Promise<GalleryImage> {
    const response = await fetch(`${API_BASE_URL}/gallery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return handleResponse(response);
  },

  async updateGallery(id: string, data: Partial<GalleryImage>): Promise<GalleryImage> {
    const response = await fetch(`${API_BASE_URL}/gallery/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async deleteGallery(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/gallery/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new ApiError(response.status, '删除失败');
    }
  },

  async batchDeleteGallery(ids: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/gallery/batch-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    if (!response.ok) {
      throw new ApiError(response.status, '批量删除失败');
    }
  },

  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  }
};

export { ApiError };
export default api;
