import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { uploadToSupabase, pickFile, type FileSource } from '@/services/storage/fileUpload';
import type { MedicalRecord, MedicalRecordType } from '@/types/medical-record';

export function useMedicalRecords() {
  const { user } = useAuth();
  const supabase = getSupabase();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canUseSupabase = Boolean(supabase && user);

  const fetchRecords = useCallback(
    async (filterByType?: MedicalRecordType) => {
      if (!supabase || !user) {
        setRecords([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('medical_records')
          .select('*')
          .eq('user_id', user.id)
          .order('record_date', { ascending: false })
          .order('created_at', { ascending: false });

        if (filterByType) {
          query = query.eq('record_type', filterByType);
        }

        const { data, error: queryError } = await query;

        if (queryError && queryError.code !== '42P01') {
          throw new Error(queryError.message);
        }

        setRecords(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch medical records');
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, user],
  );

  const addRecord = useCallback(
    async (record: {
      record_type: MedicalRecordType;
      title: string;
      description?: string | null;
      doctor_name?: string | null;
      hospital_clinic_name?: string | null;
      record_date?: string | null;
      tags?: string[] | null;
      is_important?: boolean;
      fileSource?: FileSource;
    }) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      let fileUrl: string | null = null;
      let fileType: string | null = null;
      let fileSize: number | null = null;
      let extractedText: string | null = null;

      // Upload file if provided
      if (record.fileSource) {
        try {
          const file = await pickFile(record.fileSource);
          if (file) {
            const uploadResult = await uploadToSupabase(file.uri, file.name, user.id);
            fileUrl = uploadResult.url;
            fileType = uploadResult.type;
            fileSize = uploadResult.size;

            // TODO: OCR extraction using AI/OCR service
            // For now, we'll leave extracted_text as null
            // extractedText = await extractTextFromFile(uploadResult.url);
          }
        } catch (uploadError) {
          console.error('[MedicalRecords] Failed to upload file:', uploadError);
          throw new Error('Failed to upload file. Please try again.');
        }
      }

      const { data, error: insertError } = await supabase
        .from('medical_records')
        .insert({
          ...record,
          user_id: user.id,
          file_url: fileUrl,
          file_type: fileType,
          file_size_bytes: fileSize,
          extracted_text: extractedText,
        })
        .select()
        .single();

      if (insertError && insertError.code !== '42P01') {
        throw new Error(insertError.message);
      }

      if (data) {
        await fetchRecords();
        return data;
      }

      return null;
    },
    [supabase, user, fetchRecords],
  );

  const updateRecord = useCallback(
    async (recordId: string, updates: Partial<MedicalRecord>) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      const { error: updateError } = await supabase
        .from('medical_records')
        .update(updates)
        .eq('id', recordId)
        .eq('user_id', user.id);

      if (updateError && updateError.code !== '42P01') {
        throw new Error(updateError.message);
      }

      await fetchRecords();
    },
    [supabase, user, fetchRecords],
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      if (!supabase || !user) {
        throw new Error('Supabase not configured or user not authenticated');
      }

      // Get record to delete file from storage
      const { data: record } = await supabase
        .from('medical_records')
        .select('file_url')
        .eq('id', recordId)
        .eq('user_id', user.id)
        .single();

      // Delete from database
      const { error: deleteError } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordId)
        .eq('user_id', user.id);

      if (deleteError && deleteError.code !== '42P01') {
        throw new Error(deleteError.message);
      }

      // Delete file from storage if exists
      if (record?.file_url) {
        try {
          const filePath = record.file_url.split('/').slice(-2).join('/');
          await supabase.storage.from('medical-records').remove([filePath]);
        } catch (storageError) {
          console.warn('[MedicalRecords] Failed to delete file from storage:', storageError);
        }
      }

      await fetchRecords();
    },
    [supabase, user, fetchRecords],
  );

  useEffect(() => {
    if (canUseSupabase) {
      fetchRecords();
    }
  }, [canUseSupabase, fetchRecords]);

  return {
    records,
    isLoading,
    error,
    supabaseReady: canUseSupabase,
    refresh: fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord,
  };
}

