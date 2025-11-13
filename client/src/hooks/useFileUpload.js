import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const response = await api.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      toast.error(error.message || 'File upload failed');
      throw error;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading };
};

export default useFileUpload;

