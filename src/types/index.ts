export interface PreviewRecord {
  id: string;
  dataURL: string;
  timestamp: string | Date;
  name?: string;
  tags?: string[];
  sourceUrl?: string;
}

export interface GalleryImage {
  id: string;
  dataURL: string;
  name: string;
  tags: string[];
  sourceUrl: string;
  timestamp: string;
}

export type ConfirmType = 'warning' | 'success' | 'error' | 'info';

export interface ConfirmOptions {
  title?: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}
