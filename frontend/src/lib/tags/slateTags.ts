import type { Editor, TLShape, TLShapeId } from 'tldraw';

const TAG_PREFIX = '@SL-';
const TAG_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded easily confused chars: 0, O, 1, I

/**
 * Generate a 5-character alphanumeric ID string.
 * Example: '7XK29', 'A92KF'
 */
function generateRandomTagCode(): string {
  let result = '';
  const length = 5;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * TAG_CHARACTERS.length);
    result += TAG_CHARACTERS[randomIndex];
  }
  return result;
}

/**
 * Collect all existing slate tags from the editor shapes.
 */
export function getExistingTags(editor: Editor): Set<string> {
  const tags = new Set<string>();
  const shapes = editor.getCurrentPageShapes();
  for (const shape of shapes) {
    const tag = (shape.meta as any)?.slateTag || (shape.meta as any)?.tag;
    if (typeof tag === 'string' && tag.trim()) {
      tags.add(tag.trim());
    }
  }
  return tags;
}

/**
 * Creates a unique Slate tag within the current canvas.
 * Example: '@SL-7XK29'
 */
export function createSlateTag(editor?: Editor): string {
  const existingTags = editor ? getExistingTags(editor) : new Set<string>();
  let attempts = 0;
  let tag = '';

  do {
    tag = `${TAG_PREFIX}${generateRandomTagCode()}`;
    attempts++;
  } while (existingTags.has(tag) && attempts < 1000);

  return tag;
}

/**
 * Get tag for a specific shape if it has one.
 */
export function getTagForShape(editor: Editor, shapeId: TLShapeId | string): string | undefined {
  const shape = editor.getShape(shapeId as TLShapeId);
  if (!shape || !shape.meta) return undefined;
  return (shape.meta as any).slateTag || (shape.meta as any).tag || undefined;
}

/**
 * Resolve a tag string (e.g. '@SL-7XK29') to the corresponding tldraw shape.
 */
export function resolveTagToShape(editor: Editor, tag: string): TLShape | undefined {
  if (!tag) return undefined;
  const normalizedTag = tag.trim().toLowerCase();
  const shapes = editor.getCurrentPageShapes();
  
  return shapes.find((shape) => {
    const shapeTag = (shape.meta as any)?.slateTag || (shape.meta as any)?.tag;
    return typeof shapeTag === 'string' && shapeTag.trim().toLowerCase() === normalizedTag;
  });
}

/**
 * Assigns a unique tag to a shape or returns existing tag.
 */
export function tagShape(editor: Editor, shapeId: TLShapeId | string): string | null {
  const shape = editor.getShape(shapeId as TLShapeId);
  if (!shape) return null;

  // If shape already has a tag, reuse it
  const existingTag = (shape.meta as any)?.slateTag || (shape.meta as any)?.tag;
  if (existingTag && typeof existingTag === 'string' && existingTag.trim()) {
    return existingTag.trim();
  }

  // Generate new unique tag
  const newTag = createSlateTag(editor);

  editor.updateShape({
    id: shape.id,
    type: shape.type,
    meta: {
      ...shape.meta,
      slateTag: newTag,
    },
  });

  return newTag;
}

/**
 * Get all tagged shapes on the current page.
 */
export function getAllTaggedShapes(editor: Editor): { shape: TLShape; tag: string }[] {
  const shapes = editor.getCurrentPageShapes();
  const tagged: { shape: TLShape; tag: string }[] = [];

  for (const shape of shapes) {
    const tag = (shape.meta as any)?.slateTag || (shape.meta as any)?.tag;
    if (typeof tag === 'string' && tag.trim()) {
      tagged.push({ shape, tag: tag.trim() });
    }
  }

  return tagged;
}

/**
 * Options for focusing a tagged shape.
 */
export interface FocusShapeOptions {
  onHighlight?: (shapeId: TLShapeId) => void;
  onNotFound?: (tag: string) => void;
  duration?: number;
  inset?: number;
}

/**
 * Focus and zoom on a shape by ID or tag, and trigger temporary highlight.
 */
export function focusTaggedShape(
  editor: Editor,
  target: { shapeId?: TLShapeId | string; tag?: string },
  options: FocusShapeOptions = {}
): boolean {
  let shape: TLShape | undefined;

  if (target.shapeId) {
    shape = editor.getShape(target.shapeId as TLShapeId);
  } else if (target.tag) {
    shape = resolveTagToShape(editor, target.tag);
  }

  if (!shape) {
    if (options.onNotFound) {
      options.onNotFound(target.tag || (target.shapeId as string) || 'Shape');
    }
    return false;
  }

  // 1. Select the shape
  editor.select(shape.id);

  // 2. Get bounds and zoom to shape
  const bounds = editor.getShapePageBounds(shape.id);
  if (bounds) {
    editor.zoomToBounds(bounds, {
      animation: { duration: options.duration ?? 250 },
      inset: options.inset ?? 80,
    });
  } else {
    editor.zoomToSelection();
  }

  // 3. Trigger highlight overlay
  if (options.onHighlight) {
    options.onHighlight(shape.id);
  }

  return true;
}
