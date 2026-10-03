import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { getSupabase } from '@/lib/supabase';

export type FileSource = 'document' | 'camera' | 'gallery';

export interface FileUploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

export async function pickFile(source: FileSource = 'document'): Promise<{
  uri: string;
  name: string;
  type: string;
  size: number;
} | null> {
  try {
    if (source === 'document') {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return null;
      }

      const file = result.assets[0];
      return {
        uri: file.uri,
        name: file.name || 'document',
        type: file.mimeType || 'application/pdf',
        size: file.size || 0,
      };
    } else if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission not granted');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: asset.fileSize || 0,
      };
    } else {
      // gallery
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission not granted');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: asset.fileSize || 0,
      };
    }
  } catch (error) {
    console.error('[FileUpload] Failed to pick file:', error);
    throw error;
  }
}

export async function uploadToSupabase(
  fileUri: string,
  fileName: string,
  userId: string,
  folder: string = 'medical-records',
): Promise<FileUploadResult> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    // Read file as blob
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const fileExt = fileName.split('.').pop();
    const filePath = `${folder}/${userId}/${Date.now()}_${fileName}`;

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('medical-records')
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('medical-records').getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
      size: blob.size,
      type: blob.type,
    };
  } catch (error) {
    console.error('[FileUpload] Failed to upload to Supabase:', error);
    throw error;
  }
}

