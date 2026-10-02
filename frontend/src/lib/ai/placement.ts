import { Editor } from 'tldraw';
import type { AiContext } from './context';

export function getPlacementCoordinates(editor: Editor, context: AiContext) {
  const { bounds } = context.metadata;
  const padding = 100;
  
  // Default to the right of the selection
  const x = bounds.x + bounds.w + padding;
  const y = bounds.y;

  return { x, y };
}
