import { useEditor, useValue } from 'tldraw';
import type { TLShape } from 'tldraw';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { cn } from '../../lib/utils';
import { Layers, Image as ImageIcon, ArrowUp, ArrowDown, Lock, Unlock, Trash2 } from 'lucide-react';

export function RightSidebar() {
  const editor = useEditor();
  const [activeTab, setActiveTab] = useState<'layers' | 'assets'>('layers');
  const [assets, setAssets] = useState<{name: string, url: string}[]>([]);

  // Get current shapes for the layers panel
  const shapes = useValue('shapes', () => {
    // Return all shapes except presence/cursors
    return editor.getCurrentPageShapes().sort((a, b) => {
      // Sort by z-index if available, otherwise by index
      return a.index < b.index ? -1 : 1;
    });
  }, [editor]);
  
  const selectedShapeIds = useValue('selectedShapeIds', () => editor.getSelectedShapeIds(), [editor]);

  // Load assets from Supabase
  useEffect(() => {
    if (activeTab === 'assets') {
      loadAssets();
    }
  }, [activeTab]);

  const loadAssets = async () => {
    try {
      const { data, error } = await supabase.storage.from('canvas-assets').list();
      if (error) throw error;
      
      const loadedAssets = data
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(file => {
          const { data: { publicUrl } } = supabase.storage.from('canvas-assets').getPublicUrl(file.name);
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
    <div className="pointer-events-auto z-50 flex flex-col w-64 bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden h-full">
      {/* Tabs */}
      <div className="flex border-b border-neutral-200">
        <button 
          className={cn("flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2", activeTab === 'layers' ? "bg-neutral-50 text-blue-600 border-b-2 border-blue-600" : "text-neutral-500 hover:bg-neutral-50")}
          onClick={() => setActiveTab('layers')}
        >
          <Layers size={16} /> Layers
        </button>
        <button 
          className={cn("flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2", activeTab === 'assets' ? "bg-neutral-50 text-blue-600 border-b-2 border-blue-600" : "text-neutral-500 hover:bg-neutral-50")}
          onClick={() => setActiveTab('assets')}
        >
          <ImageIcon size={16} /> Assets
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'layers' && (
          <div className="flex flex-col gap-1">
            {[...shapes].reverse().map(shape => {
              const isSelected = selectedShapeIds.includes(shape.id);
              const isLocked = shape.isLocked;
              return (
                <div 
                  key={shape.id}
                  onClick={() => {
                    editor.select(shape.id);
                    editor.zoomToSelection();
                  }}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg text-sm cursor-pointer transition-colors",
                    isSelected ? "bg-blue-50 text-blue-700" : "hover:bg-neutral-100 text-neutral-700"
                  )}
                >
                  <div className="flex flex-col truncate flex-1">
                    <span className="truncate">{getShapeName(shape)}</span>
                    {((shape.meta as any)?.slateTag || (shape.meta as any)?.tag) && (
                      <span className="text-xs font-mono font-medium text-blue-600 truncate">
                        {(shape.meta as any).slateTag || (shape.meta as any).tag}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); editor.bringForward([shape.id]); }}
                        className="p-1 hover:bg-blue-200 rounded" title="Bring Forward"
                      ><ArrowUp size={14} /></button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); editor.sendBackward([shape.id]); }}
                        className="p-1 hover:bg-blue-200 rounded" title="Send Backward"
                      ><ArrowDown size={14} /></button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); editor.toggleLock([shape.id]); }}
                        className="p-1 hover:bg-blue-200 rounded" title="Toggle Lock"
                      >
                        {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); editor.deleteShapes([shape.id]); }}
                        className="p-1 hover:bg-red-200 text-red-600 rounded" title="Delete"
                      ><Trash2 size={14} /></button>
                    </div>
                  )}
                  {!isSelected && isLocked && <Lock size={12} className="text-neutral-400" />}
                </div>
              );
            })}
            {shapes.length === 0 && <div className="text-center p-4 text-neutral-400 text-sm">No shapes yet</div>}
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset, i) => (
              <div 
                key={i} 
                className="group relative aspect-square bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 hover:border-blue-400 cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => handleAssetDragStart(e, asset.url)}
              >
                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate text-center">{asset.name.substring(0, 15)}</p>
                </div>
              </div>
            ))}
            {assets.length === 0 && (
              <div className="col-span-2 text-center p-4 text-neutral-400 text-sm">
                No assets uploaded.<br/>Drag images onto canvas.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
