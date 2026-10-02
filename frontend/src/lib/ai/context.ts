import { Editor } from 'tldraw';

export interface AiContext {
  blob: Blob;
  metadata: {
    bounds: { x: number; y: number; w: number; h: number };
    shapeCount: number;
  };
}

export async function extractContext(editor: Editor, padding: number = 100): Promise<AiContext | null> {
  const selectedIds = editor.getSelectedShapeIds();
  if (selectedIds.length === 0) return null;

  // Get bounding box of selection
  const bounds = editor.getSelectionPageBounds();
  if (!bounds) return null;

  // Expand bounds by padding
  const expandedBounds = bounds.clone().expandBy(padding);

  const { blob } = await editor.toImage(selectedIds, {
    format: 'png',
    padding,
    background: true
  });

  return {
    blob,
    metadata: {
      bounds: { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h },
      shapeCount: selectedIds.length
    }
  };
}
