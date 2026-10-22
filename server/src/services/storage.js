import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads/recordings');

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function uploadCallRecording({ callId, buffer, originalname, mimetype }) {
  const extension = originalname ? path.extname(originalname) : '.webm';
  const fileName = `${callId}_${Date.now()}${extension || '.webm'}`;

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'call-recordings';

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });

      const storagePath = `recordings/${fileName}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, buffer, {
          contentType: mimetype || 'audio/webm',
          upsert: true
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(storagePath);

        return {
          storageType: 'supabase',
          recording_path: storagePath,
          recording_url: publicData?.publicUrl || null
        };
      }
      console.warn('Supabase storage upload error, saving locally:', error?.message);
    } catch (err) {
      console.warn('Supabase storage exception, saving locally:', err.message);
    }
  }

  // Local file storage fallback
  ensureUploadsDir();
  const localFilePath = path.join(UPLOADS_DIR, fileName);
  fs.writeFileSync(localFilePath, buffer);

  const localUrl = `/api/recordings/${fileName}`;

  return {
    storageType: 'local',
    recording_path: `uploads/recordings/${fileName}`,
    recording_url: localUrl
  };
}
