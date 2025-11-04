import axios from 'axios';
import type { Document, DocumentUploadResponse, DocumentListResponse, DocumentDeleteResponse } from '@/types/document';

const DOCUMENTS_API_URL = '/api/documents';

export async function uploadDocument(file: File): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axios.post<DocumentUploadResponse>(DOCUMENTS_API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: false,
  });

  return data;
}

export async function getDocuments(): Promise<DocumentListResponse> {
  const { data } = await axios.get<DocumentListResponse>(DOCUMENTS_API_URL, {
    withCredentials: false,
  });

  return data;
}

export async function deleteDocument(id: string): Promise<DocumentDeleteResponse> {
  const { data } = await axios.delete<DocumentDeleteResponse>(`${DOCUMENTS_API_URL}?id=${id}`, {
    withCredentials: false,
  });

  return data;
}

