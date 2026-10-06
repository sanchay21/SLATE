import {
  Tldraw,
  DefaultContextMenu,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  DefaultContextMenuContent,
  useEditor
} from 'tldraw';
import type { TLShapeId } from 'tldraw';
import 'tldraw/tldraw.css';
import { CustomUI } from './CustomUI';
import { AiDraftShapeUtil } from './shapes/AiDraftShape';
import { RichTextShapeUtil } from './shapes/RichTextShape';
import { TagHighlight } from './TagHighlight';
import { tagShape } from '../../lib/tags/slateTags';

import { useYjsStore } from '../../hooks/useYjsStore';
import { supabase } from '../../lib/supabaseClient';
import { useState } from 'react';

const shapeUtils = [AiDraftShapeUtil, RichTextShapeUtil];

export function Canvas({ user }: { user?: any }) {
  const [highlightedShapeId, setHighlightedShapeId] = useState<TLShapeId | null>(null);

  // Hash the user ID to a persistent color
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080', '#008080'];
  const userColor = user ? colors[user.id.charCodeAt(0) % colors.length] : '#000000';

  const storeWithStatus = useYjsStore({
    roomId: 'slate-canvas-room',
    hostUrl: 'ws://localhost:1234',
    shapeUtils,
    userInfo: user ? {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      color: userColor,
    } : undefined,
  });

  const handleAssetUpload = async (file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) {
        alert('File is too large. Maximum size is 10MB.');
        throw new Error('File too large');
      }
      
      const isImage = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
      if (!isImage) {
        alert('Only image files are supported');
        throw new Error('Unsupported file type');
      }

      const ext = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { error } = await supabase.storage
        .from('canvas-assets')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading asset:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('canvas-assets')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleMount = (editor: any) => {
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
    const selected = editor.getSelectedShapeIds();

    return (
      <DefaultContextMenu {...props}>
        {selected.length === 1 && (
          <TldrawUiMenuGroup id="tag-group">
            <TldrawUiMenuItem
              id="tag"
              label="Tag"
              readonlyOk={false}
              onSelect={() => {
                const shapeId = selected[0];
                if (shapeId) {
                  tagShape(editor, shapeId);
                  setHighlightedShapeId(shapeId);
                }
              }}
            />
          </TldrawUiMenuGroup>
        )}
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
        onAssetUpload={handleAssetUpload}
        components={{ ContextMenu: CustomContextMenu }}
        onMount={handleMount}
      >
        <CustomUI onHighlightShape={(id) => setHighlightedShapeId(id)} />
        <TagHighlight 
          shapeId={highlightedShapeId} 
          onComplete={() => setHighlightedShapeId(null)} 
        />
      </Tldraw>
    </div>
  );
}
