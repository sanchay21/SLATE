import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Use the service role key from backend/.env
const supabaseUrl = 'https://ztxflddptqkyxdivhpzq.supabase.co';
const supabaseKey = 'sb_secret_WvpAvb2JDp1KzI7dmsRYzQ_xAj3yiPv';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const bucketName = 'canvas-assets';

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }
  
  const exists = buckets.find(b => b.name === bucketName);
  
  if (!exists) {
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (error) {
      console.error('Error creating bucket:', error);
    } else {
      console.log('Bucket created successfully:', data);
    }
  } else {
    console.log('Bucket already exists.');
    
    // Update bucket to make sure it's public and has right settings
    const { data, error } = await supabase.storage.updateBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 10485760 // 10MB
    });
    if (error) {
       console.error('Error updating bucket:', error);
    } else {
       console.log('Bucket updated:', data);
    }
  }
}

main();
