import axios from 'axios';
import { 
  AnalysisResult, 
  PreviewRequest, 
  PreviewResponse, 
  ConvertRequest 
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeExcel = async (file: File): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<AnalysisResult>('/analyze-excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const previewSlide = async (request: PreviewRequest): Promise<PreviewResponse> => {
  const response = await api.post<PreviewResponse>('/preview-slide', request);
  return response.data;
};

export const convertToPptx = async (request: ConvertRequest): Promise<Blob> => {
  const response = await api.post('/convert-to-pptx', request, {
    responseType: 'blob',
  });
  return response.data;
};