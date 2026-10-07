import {
  Tldraw,
  DefaultContextMenu,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  DefaultContextMenuContent,
  useEditor,
  useValue,
  AssetRecordType,
  exportAs,
} from 'tldraw';
import type { TLShapeId, Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import { CustomUI } from './CustomUI';
import { AiDraftShapeUtil } from './shapes/AiDraftShape';
import { RichTextShapeUtil } from './shapes/RichTextShape';
import { TagHighlight } from './TagHighlight';
import { tagShape } from '../../lib/tags/slateTags';
import {
  fileToAssetData,
  uploadAssetToSupabase,
  openSvgOrImagePicker,
} from '../../lib/assets/slateAssetHelper';

import { useYjsStore } from '../../hooks/useYjsStore';
import { useState, useEffect } from 'react';

const shapeUtils = [AiDraftShapeUtil, RichTextShapeUtil];

interface CanvasProps {
  user?: any;
  onTagCreated?: (tag: string) => void;
  onEditorReady?: (editor: Editor) => void;
  highlightedShapeId?: TLShapeId | null;
  onClearHighlight?: () => void;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  onSignOut?: () => void;
}

export function Canvas({
  user,
  onTagCreated,
  onEditorReady,
  highlightedShapeId: externalHighlightedShapeId,
  onClearHighlight,
  isChatOpen,
  onToggleChat,
  onSignOut,
}: CanvasProps) {
  const [internalHighlightedShapeId, setInternalHighlightedShapeId] = useState<TLShapeId | null>(
    null
  );

  const activeHighlightedShapeId = externalHighlightedShapeId ?? internalHighlightedShapeId;

  // Hash the user ID to a persistent color
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080', '#008080'];
  const userColor = user ? colors[user.id.charCodeAt(0) % colors.length] : '#000000';

  const storeWithStatus = useYjsStore({
    roomId: 'slate-canvas-room',
    hostUrl: 'ws://localhost:1234',
    shapeUtils,
    userInfo: user
      ? {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          color: userColor,
        }
      : undefined,
  });

  const handleMount = (editor: Editor) => {
    onEditorReady?.(editor);

    // Register high-fidelity asset handler for pasted/dropped image and SVG files
    (editor as any).registerExternalAssetHandler?.('file', async ({ file, assetId }: any) => {
      const isSvg = file.type === 'image/svg+xml' || file.name?.toLowerCase().endsWith('.svg');

      let src = '';
      let w = 400;
      let h = 400;

      if (isSvg) {
        try {
          const text = await file.text();
          const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
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
          src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
        } catch {
          const res = await fileToAssetData(file);
          src = res.src;
          w = res.w;
          h = res.h;
        }
      } else {
        const res = await fileToAssetData(file);
        src = res.src;
        w = res.w;
        h = res.h;
      }

      // Constrain initial display size while preserving exact aspect ratio
      const maxDim = 600;
      if (w > maxDim || h > maxDim) {
        const scale = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      // Background cloud upload to Supabase
      uploadAssetToSupabase(file).catch(() => {});

      return {
        id: assetId || AssetRecordType.createId(),
        type: 'image',
        typeName: 'asset',
        props: {
          name: file.name || (isSvg ? 'vector.svg' : 'image.png'),
          src,
          w,
          h,
          fileSize: file.size,
          mimeType: isSvg ? 'image/svg+xml' : file.type || 'image/png',
          isAnimated: file.type === 'image/gif',
        },
        meta: {},
      };
    });

    // Prevent duplicate tags when duplicating/cloning shapes
    editor.sideEffects.registerBeforeCreateHandler('shape', (shape: any) => {
      const tag = shape.meta?.slateTag || shape.meta?.tag;
      if (tag) {
        const existingShapes = editor.getCurrentPageShapes();
        const isDuplicate = existingShapes.some((s: any) => {
          const sTag = s.meta?.slateTag || s.meta?.tag;
          return s.id !== shape.id && sTag === tag;
        });

        if (isDuplicate) {
          return {
            ...shape,
            meta: {
              ...shape.meta,
              slateTag: undefined,
              tag: undefined,
            },
          };
        }
      }
      return shape;
    });
  };

  const CustomContextMenu = (props: any) => {
    const editor = useEditor();

    // Dynamically and reactively find the target shape under the pointer or selection
    const targetShape = useValue(
      'contextMenuTargetShape',
      () => {
        const currentPagePoint = editor.inputs.getCurrentPagePoint();

        // 1. Check shape directly under the pointer when right-clicking
        const shapeAtPoint = editor.getShapeAtPoint(currentPagePoint, {
          hitInside: true,
          hitLabels: true,
          margin: editor.getHitTestMargin(),
        });

        if (shapeAtPoint) {
          return shapeAtPoint;
        }

        // 2. If nothing under pointer, fallback to selected shape if only 1 is selected
        const selectedShapes = editor.getSelectedShapes();
        if (selectedShapes.length === 1) {
          return selectedShapes[0];
        }

        return null;
      },
      [editor]
    );

    // Ensure the targeted shape is selected immediately when context menu mounts
    useEffect(() => {
      if (targetShape && !editor.getSelectedShapeIds().includes(targetShape.id)) {
        editor.select(targetShape.id);
      }
    }, [targetShape, editor]);

    return (
      <DefaultContextMenu {...props}>
        <TldrawUiMenuGroup id="slate-actions">
          {targetShape && (
            <TldrawUiMenuItem
              id="tag"
              label="Tag"
              readonlyOk={false}
              onSelect={() => {
                editor.select(targetShape.id);
                const tag = tagShape(editor, targetShape.id);
                setInternalHighlightedShapeId(targetShape.id);
                if (tag && onTagCreated) {
                  onTagCreated(tag);
                }
              }}
            />
          )}
          <TldrawUiMenuItem
            id="upload-svg"
            label="Upload SVG / Image..."
            readonlyOk={false}
            onSelect={() => {
              const point = editor.inputs.getCurrentPagePoint();
              openSvgOrImagePicker(editor, undefined, point);
            }}
          />
          <TldrawUiMenuItem
            id="export-png"
            label={targetShape ? "Export Shape as PNG" : "Export Canvas as PNG"}
            readonlyOk={true}
            onSelect={() => {
              const ids = targetShape
                ? [targetShape.id]
                : Array.from(editor.getCurrentPageShapeIds());
              if (ids.length > 0) {
                exportAs(editor, ids, { format: 'png', scale: 2 });
              }
            }}
          />
          <TldrawUiMenuItem
            id="export-svg"
            label={targetShape ? "Export Shape as SVG" : "Export Canvas as SVG"}
            readonlyOk={true}
            onSelect={() => {
              const ids = targetShape
                ? [targetShape.id]
                : Array.from(editor.getCurrentPageShapeIds());
              if (ids.length > 0) {
                exportAs(editor, ids, { format: 'svg' });
              }
            }}
          />
        </TldrawUiMenuGroup>
        <DefaultContextMenuContent />
      </DefaultContextMenu>
    );
  };

  return (
    <div className="absolute inset-0 h-full w-full bg-neutral-50">
      <Tldraw
        hideUi={true}
        shapeUtils={shapeUtils}
        store={storeWithStatus}
        components={{ ContextMenu: CustomContextMenu }}
        onMount={handleMount}
      >
        <CustomUI
          onHighlightShape={(id) => setInternalHighlightedShapeId(id)}
          user={user}
          isChatOpen={isChatOpen}
          onToggleChat={onToggleChat}
          onSignOut={onSignOut}
        />
        <TagHighlight
          shapeId={activeHighlightedShapeId}
          onComplete={() => {
            setInternalHighlightedShapeId(null);
            onClearHighlight?.();
          }}
        />
      </Tldraw>
    </div>
  );
}
