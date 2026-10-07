import { useEditor } from 'tldraw';
import type { TLShapeId } from 'tldraw';
import { useState, useEffect } from 'react';

export function TagModal({
  shapeId,
  onClose,
}: {
  shapeId: TLShapeId | string;
  onClose: () => void;
}) {
  const editor = useEditor();
  const shape = editor.getShape(shapeId as TLShapeId);
  const [tag, setTag] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (shape && shape.meta && typeof (shape.meta as any).tag === 'string') {
      setTag((shape.meta as any).tag);
    }
  }, [shape]);

  const handleSave = () => {
    if (!shape) return;
    if (!tag.trim()) {
      // Allow clearing the tag
      editor.updateShape({
        id: shape.id,
        type: shape.type,
        meta: { ...shape.meta, tag: undefined, slateTag: undefined },
      } as any);
      onClose();
      return;
    }

    const trimmedTag = tag.trim().startsWith('@') ? tag.trim() : `@${tag.trim()}`;

    // Validate uniqueness
    const allShapes = editor.getCurrentPageShapes();
    const isDuplicate = allShapes.some((s) => s.id !== shape.id && (s.meta as any)?.tag === trimmedTag);

    if (isDuplicate) {
      setError('This tag is already in use.');
      return;
    }

    editor.updateShape({
      id: shape.id,
      type: shape.type,
      meta: { ...shape.meta, tag: trimmedTag, slateTag: trimmedTag },
    } as any);
    onClose();
  };

  if (!shape) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-white rounded-lg shadow-xl border border-neutral-200 p-4 w-72 pointer-events-auto">
      <h3 className="text-sm font-semibold mb-3">Tag Element</h3>
      <div className="mb-3">
        <label className="text-xs text-neutral-500 mb-1 block">Tag</label>
        <input
          type="text"
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            setError('');
          }}
          placeholder="@my_tag"
          className="w-full border border-neutral-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') onClose();
            e.stopPropagation();
          }}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
