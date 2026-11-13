import { supabase } from './client';

export type BucketName = 'teamflow-reports' | 'teamflow-backups' | 'teamflow-assets';

export async function uploadFile(
  bucket: BucketName,
  path: string,
  file: Blob | File,
  contentType?: string
): Promise<{ path: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: contentType || file.type,
      });

    if (error) {
      console.error(`Storage upload error in ${bucket}/${path}:`, error.message);
      return { path: '', error: error.message };
    }

    return { path: data.path };
  } catch (err: any) {
    console.error('Storage upload exception:', err);
    return { path: '', error: err.message || 'Unknown upload error' };
  }
}

export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      console.error(`Failed to get signed URL for ${bucket}/${path}:`, error.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Exception getting signed URL:', err);
    return null;
  }
}

export async function deleteFile(bucket: BucketName, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`Failed to delete ${bucket}/${path}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception deleting file:', err);
    return false;
  }
}

export async function downloadFile(bucket: BucketName, path: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) {
      console.error(`Failed to download ${bucket}/${path}:`, error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Exception downloading file:', err);
    return null;
  }
}

