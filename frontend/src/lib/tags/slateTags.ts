import type { Editor, TLShape, TLShapeId } from 'tldraw';

/**
 * Determine a clean, human-friendly shape type identifier.
 * Example: 'rectangle', 'circle', 'triangle', 'star', 'arrow', 'text'
 */
export function getShapeTypeName(shape: TLShape): string {
  if (shape.type === 'geo') {
    const geo = (shape.props as any)?.geo;
    if (geo === 'ellipse') return 'circle';
    if (typeof geo === 'string' && geo.trim()) return geo.toLowerCase();
    return 'rectangle';
  }
  if (shape.type === 'image') return 'image';
  if (shape.type === 'text' || (shape.type as string) === 'rich-text') return 'text';
  if (shape.type === 'draw') return 'drawing';
  if (shape.type === 'arrow') return 'arrow';
  if (shape.type === 'line') return 'line';
  if (shape.type === 'note') return 'note';
  if ((shape.type as string) === 'ai-draft') return 'draft';
  return (shape.type as string) || 'shape';
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
      tags.add(tag.trim().toLowerCase());
    }
  }
  return tags;
}

/**
 * Creates a unique descriptive Slate tag within the current canvas.
 * Example: '@rectangle1', '@rectangle2', '@circle1', '@star1'
 */
export function createSlateTag(editor?: Editor, shape?: TLShape): string {
  const existingTags = editor ? getExistingTags(editor) : new Set<string>();
  const typeName = shape ? getShapeTypeName(shape) : 'shape';
  
  // Assign sequential number: @rectangle1, @rectangle2, ...
  let index = 1;
  let tag = `@${typeName}${index}`;
  while (existingTags.has(tag.toLowerCase())) {
    index++;
    tag = `@${typeName}${index}`;
  }

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
 * Resolve a tag string (e.g. '@rectangle1', '@SL-7XK29') to the corresponding tldraw shape.
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
 * Assigns a unique descriptive tag to a shape or returns existing tag.
 */
export function tagShape(editor: Editor, shapeId: TLShapeId | string): string | null {
  const shape = editor.getShape(shapeId as TLShapeId);
  if (!shape) return null;

  // If shape already has a clean tag (and not an old legacy @SL- tag), reuse it
  const existingTag = (shape.meta as any)?.slateTag || (shape.meta as any)?.tag;
  if (
    existingTag &&
    typeof existingTag === 'string' &&
    existingTag.trim() &&
    !existingTag.trim().toUpperCase().startsWith('@SL-')
  ) {
    return existingTag.trim();
  }

  // Generate new clean descriptive tag (e.g. @rectangle1, @circle1)
  const newTag = createSlateTag(editor, shape);

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
}

/**
 * Focus on a shape by ID or tag, and trigger temporary highlight without aggressive zooming.
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

  // 2. If the shape is outside the current viewport, gently pan to center it without changing zoom
  const bounds = editor.getShapePageBounds(shape.id);
  if (bounds) {
    const viewport = editor.getViewportPageBounds();
    if (!viewport.contains(bounds)) {
      editor.centerOnPoint(bounds.center, {
        animation: { duration: options.duration ?? 250 },
      });
    }
  }

  // 3. Trigger highlight overlay
  if (options.onHighlight) {
    options.onHighlight(shape.id);
  }

  return true;
}
