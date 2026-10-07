import { Editor, AssetRecordType, createShapeId } from 'tldraw';
import { supabase } from '../supabaseClient';

/**
 * Reads an image file as a full-color data URL and measures its exact natural dimensions.
 */
export async function fileToAssetData(file: File): Promise<{ src: string; w: number; h: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({
          src: dataUrl,
          w: img.naturalWidth || img.width || 800,
          h: img.naturalHeight || img.height || 600,
        });
      };
      img.onerror = () => {
        resolve({ src: dataUrl, w: 800, h: 600 });
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      resolve({ src: '', w: 800, h: 600 });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a file to Supabase storage bucket 'canvas-assets'.
 */
export async function uploadAssetToSupabase(file: File): Promise<string | null> {
  try {
    if (file.size > 15 * 1024 * 1024) {
      console.warn('File exceeds 15MB upload limit');
      return null;
    }

    const ext = file.name.split('.').pop() || (file.type === 'image/svg+xml' ? 'svg' : 'png');
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { error } = await supabase.storage.from('canvas-assets').upload(fileName, file, {
      contentType: file.type || (ext === 'svg' ? 'image/svg+xml' : 'image/png'),
      upsert: true,
    });

    if (error) {
      console.warn('Supabase asset upload error:', error);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('canvas-assets').getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.warn('Failed to upload asset to Supabase:', err);
    return null;
  }
}

/**
 * Inserts an SVG or raster image file directly onto the canvas with full RGB/vector fidelity.
 */
export async function insertImageOrSvgFile(
  editor: Editor,
  file: File,
  atPoint?: { x: number; y: number }
) {
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

  let src = '';
  let w = 400;
  let h = 400;

  if (isSvg) {
    const text = await file.text();
    // Parse SVG to extract exact dimensions or viewBox
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    if (svgEl) {
      const viewBox = svgEl.getAttribute('viewBox');
      const widthAttr = parseFloat(svgEl.getAttribute('width') || '');
      const heightAttr = parseFloat(svgEl.getAttribute('height') || '');

      if (!isNaN(widthAttr) && widthAttr > 0 && !isNaN(heightAttr) && heightAttr > 0) {
        w = widthAttr;
        h = heightAttr;
      } else if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(parseFloat);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          w = parts[2];
          h = parts[3];
        }
      }
    }

    // Direct Data URL with UTF-8 encoding for full color and SVG vector rendering
    src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
  } else {
    const assetData = await fileToAssetData(file);
    src = assetData.src;
    w = assetData.w;
    h = assetData.h;
  }

  // Constrain max initial display size while preserving exact aspect ratio
  const maxInitialDim = 500;
  let displayW = w;
  let displayH = h;
  if (displayW > maxInitialDim || displayH > maxInitialDim) {
    const scale = Math.min(maxInitialDim / displayW, maxInitialDim / displayH);
    displayW = Math.round(displayW * scale);
    displayH = Math.round(displayH * scale);
  }

  const assetId = AssetRecordType.createId();
  const asset = {
    id: assetId,
    typeName: 'asset' as const,
    type: 'image' as const,
    props: {
      name: file.name || (isSvg ? 'vector.svg' : 'image.png'),
      src,
      w: displayW,
      h: displayH,
      fileSize: file.size,
      mimeType: isSvg ? 'image/svg+xml' : file.type || 'image/png',
      isAnimated: file.type === 'image/gif',
    },
    meta: {},
  };

  const center = atPoint || editor.getViewportPageBounds().center;
  const shapeId = createShapeId();

  editor.run(() => {
    editor.createAssets([asset as any]);
    editor.createShape({
      id: shapeId,
      type: 'image',
      x: center.x - displayW / 2,
      y: center.y - displayH / 2,
      props: {
        assetId,
        w: displayW,
        h: displayH,
      },
    });
    editor.select(shapeId);
  });

  // Non-blocking upload to Supabase cloud storage
  uploadAssetToSupabase(file).catch(() => {});

  return shapeId;
}

/**
 * Triggers native system file picker for SVG and image files.
 */
export function openSvgOrImagePicker(
  editor: Editor,
  onComplete?: () => void,
  atPoint?: { x: number; y: number }
) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.svg,image/svg+xml,image/png,image/jpeg,image/webp,image/gif';
  input.multiple = true;
  input.style.display = 'none';

  input.onchange = async (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const offset = i * 24;
        const targetPoint = atPoint
          ? { x: atPoint.x + offset, y: atPoint.y + offset }
          : undefined;
        await insertImageOrSvgFile(editor, file, targetPoint);
      }
      onComplete?.();
    }
    input.remove();
  };

  document.body.appendChild(input);
  input.click();
}
