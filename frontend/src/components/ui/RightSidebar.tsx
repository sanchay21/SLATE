import { useEditor, useValue, AssetRecordType, createShapeId } from 'tldraw';
import type { TLShape } from 'tldraw';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { cn } from '../../lib/utils';
import { Layers, Image as ImageIcon, ArrowUp, ArrowDown, Lock, Unlock, Trash2, X, Upload } from 'lucide-react';
import { openSvgOrImagePicker } from '../../lib/assets/slateAssetHelper';

export function RightSidebar() {
  const editor = useEditor();
  const [expandedTab, setExpandedTab] = useState<'layers' | 'assets' | null>(null);
  const [assets, setAssets] = useState<{ name: string; url: string }[]>([]);

  // Get current shapes for the layers panel
  const shapes = useValue('shapes', () => {
    return editor.getCurrentPageShapes().sort((a, b) => {
      return a.index < b.index ? -1 : 1;
    });
  }, [editor]);

  const selectedShapeIds = useValue('selectedShapeIds', () => editor.getSelectedShapeIds(), [editor]);

  // Load assets from Supabase
  useEffect(() => {
    if (expandedTab === 'assets') {
      loadAssets();
    }
  }, [expandedTab]);

  const loadAssets = async () => {
    try {
      const { data, error } = await supabase.storage.from('canvas-assets').list();
      if (error) throw error;

      const loadedAssets = data
        .filter((f) => f.name !== '.emptyFolderPlaceholder')
        .map((file) => {
          const {
            data: { publicUrl },
          } = supabase.storage.from('canvas-assets').getPublicUrl(file.name);
          return { name: file.name, url: publicUrl };
        });
      setAssets(loadedAssets);
    } catch (e) {
      console.error('Failed to load assets', e);
    }
  };

  const getShapeName = (shape: TLShape) => {
    if (shape.type === 'image') return 'Image';
    if (shape.type === 'text') return 'Text';
    if (shape.type === 'geo') return (shape.props as any).geo || 'Shape';
    if (shape.type === 'draw') return 'Drawing';
    if (shape.type === 'arrow') return 'Arrow';
    return shape.type;
  };

  const handleAssetDragStart = (e: React.DragEvent, url: string) => {
    e.dataTransfer.setData('text/uri-list', url);
    e.dataTransfer.setData('text/plain', url);
  };

  return (
    <div className="relative pointer-events-auto select-none">
      {/* Thin Compact Toolbar on the Right */}
      <div className="flex flex-col gap-0.5 rounded-xl border border-neutral-200/90 bg-white/95 backdrop-blur-md p-1 shadow-lg shadow-neutral-900/5">
        <button
          onClick={() => setExpandedTab(expandedTab === 'layers' ? null : 'layers')}
          className={cn(
            'relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 active:scale-95',
            expandedTab === 'layers'
              ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs border border-blue-200/70'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 border border-transparent'
          )}
          title="Layers"
        >
          <Layers size={16} strokeWidth={expandedTab === 'layers' ? 2.25 : 1.75} />
        </button>

        <button
          onClick={() => setExpandedTab(expandedTab === 'assets' ? null : 'assets')}
          className={cn(
            'relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 active:scale-95',
            expandedTab === 'assets'
              ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs border border-blue-200/70'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 border border-transparent'
          )}
          title="Assets"
        >
          <ImageIcon size={16} strokeWidth={expandedTab === 'assets' ? 2.25 : 1.75} />
        </button>
      </div>

      {/* Flyout Panel when Expanded */}
      {expandedTab && (
        <div className="absolute right-11 top-1/2 -translate-y-1/2 w-64 h-96 max-h-[calc(100vh-140px)] bg-white border border-neutral-200/90 rounded-xl shadow-xl shadow-neutral-900/10 overflow-hidden flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-200 bg-neutral-50/70">
            <span className="text-xs font-semibold text-neutral-800 capitalize flex items-center gap-1.5">
              {expandedTab === 'layers' ? <Layers size={14} /> : <ImageIcon size={14} />}
              {expandedTab}
            </span>
            <button
              onClick={() => setExpandedTab(null)}
              className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-md transition-colors"
              title="Close panel"
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-2">
            {expandedTab === 'layers' && (
              <div className="flex flex-col gap-1">
                {[...shapes].reverse().map((shape) => {
                  const isSelected = selectedShapeIds.includes(shape.id);
                  const isLocked = shape.isLocked;
                  return (
                    <div
                      key={shape.id}
                      onClick={() => {
                        editor.select(shape.id);
                      }}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'hover:bg-neutral-100 text-neutral-700'
                      )}
                    >
                      <div className="flex flex-col truncate flex-1">
                        <span className="truncate">{getShapeName(shape)}</span>
                        {((shape.meta as any)?.slateTag || (shape.meta as any)?.tag) && (
                          <span className="text-[10px] font-mono font-medium text-blue-600 truncate">
                            {(shape.meta as any).slateTag || (shape.meta as any).tag}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editor.bringForward([shape.id]);
                            }}
                            className="p-1 hover:bg-blue-200 rounded"
                            title="Bring Forward"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editor.sendBackward([shape.id]);
                            }}
                            className="p-1 hover:bg-blue-200 rounded"
                            title="Send Backward"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editor.toggleLock([shape.id]);
                            }}
                            className="p-1 hover:bg-blue-200 rounded"
                            title="Toggle Lock"
                          >
                            {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editor.deleteShapes([shape.id]);
                            }}
                            className="p-1 hover:bg-red-200 text-red-600 rounded"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                      {!isSelected && isLocked && (
                        <Lock size={12} className="text-neutral-400" />
                      )}
                    </div>
                  );
                })}
                {shapes.length === 0 && (
                  <div className="text-center p-4 text-neutral-400 text-xs">No shapes yet</div>
                )}
              </div>
            )}

            {expandedTab === 'assets' && (
              <div className="flex flex-col gap-2.5">
                {/* Direct Upload Button */}
                <button
                  onClick={() => {
                    openSvgOrImagePicker(editor, () => {
                      setTimeout(loadAssets, 600);
                    });
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium border border-blue-200/80 transition-colors shadow-xs cursor-pointer active:scale-[0.98]"
                  title="Upload SVG, PNG, JPG, WebP"
                >
                  <Upload size={13} />
                  <span>Upload SVG / Image</span>
                </button>

                {/* Assets Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {assets.map((asset, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        // Click to insert onto canvas at viewport center
                        const isSvg = asset.name.toLowerCase().endsWith('.svg');
                        const center = editor.getViewportPageBounds().center;
                        const assetId = AssetRecordType.createId();
                        const shapeId = createShapeId();

                        editor.run(() => {
                          editor.createAssets([
                            {
                              id: assetId,
                              typeName: 'asset',
                              type: 'image',
                              props: {
                                name: asset.name,
                                src: asset.url,
                                w: 400,
                                h: 400,
                                mimeType: isSvg ? 'image/svg+xml' : 'image/png',
                                isAnimated: false,
                              },
                              meta: {},
                            } as any,
                          ]);
                          editor.createShape({
                            id: shapeId,
                            type: 'image',
                            x: center.x - 200,
                            y: center.y - 200,
                            props: {
                              assetId,
                              w: 400,
                              h: 400,
                            },
                          });
                          editor.select(shapeId);
                        });
                      }}
                      className="group relative aspect-square bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 hover:border-blue-400 cursor-pointer active:scale-95 transition-transform"
                      draggable
                      onDragStart={(e) => handleAssetDragStart(e, asset.url)}
                      title="Click to place on canvas or drag"
                    >
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate text-center font-medium">
                          {asset.name.substring(0, 18)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {assets.length === 0 && (
                    <div className="col-span-2 text-center py-6 px-3 text-neutral-400 text-xs flex flex-col items-center gap-1">
                      <ImageIcon size={20} className="text-neutral-300 mb-1" />
                      <span>No assets uploaded yet.</span>
                      <span className="text-[10px] text-neutral-400">Click the button above to upload SVGs or images.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
