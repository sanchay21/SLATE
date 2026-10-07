import { useState, useRef, useEffect } from 'react';
import { useEditor, useValue, exportAs } from 'tldraw';
import type { TLExportType } from 'tldraw';
import { Download, ChevronDown, Image as ImageIcon, FileCode, FileText, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export type SlateExportFormat = TLExportType | 'json';

interface ExportMenuProps {
  className?: string;
}

export function ExportMenu({ className }: ExportMenuProps) {
  const editor = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [scale, setScale] = useState<number>(2);
  const [background, setBackground] = useState<boolean>(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedShapeIds = useValue(
    'selectedShapeIds',
    () => editor.getSelectedShapeIds(),
    [editor]
  );
  const allShapeIds = useValue(
    'allShapeIds',
    () => Array.from(editor.getCurrentPageShapeIds()),
    [editor]
  );

  const targetIds = selectedShapeIds.length > 0 ? selectedShapeIds : allShapeIds;
  const isSelection = selectedShapeIds.length > 0;
  const hasContent = targetIds.length > 0;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExport = async (format: SlateExportFormat) => {
    if (!hasContent || isExporting) return;

    setIsExporting(true);
    try {
      const exportName = isSelection
        ? `slate-selection-${Date.now()}`
        : `slate-canvas-${Date.now()}`;

      if (format === 'json') {
        const snapshot = editor.getSnapshot();
        const jsonStr = JSON.stringify(snapshot, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportName}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await exportAs(editor, targetIds, {
          format,
          name: exportName,
          scale,
          background,
        });
      }
      setIsOpen(false);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions: {
    format: SlateExportFormat;
    label: string;
    ext: string;
    icon: typeof ImageIcon;
    description: string;
  }[] = [
    {
      format: 'png',
      label: 'PNG Image',
      ext: '.png',
      icon: ImageIcon,
      description: 'High-res image, supports transparency',
    },
    {
      format: 'svg',
      label: 'SVG Vector',
      ext: '.svg',
      icon: FileCode,
      description: 'Lossless scalable vector graphic',
    },
    {
      format: 'jpeg',
      label: 'JPEG Image',
      ext: '.jpg',
      icon: ImageIcon,
      description: 'Standard compressed graphic',
    },
    {
      format: 'json',
      label: 'JSON Document',
      ext: '.json',
      icon: FileText,
      description: 'Full canvas data backup',
    },
  ];

  return (
    <div className={cn('relative inline-block text-left', className)} ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={!hasContent || isExporting}
        className={cn(
          'px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 text-xs font-medium active:scale-95 cursor-pointer select-none',
          isOpen
            ? 'bg-blue-50 text-blue-600 border border-blue-200/80 shadow-xs'
            : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent',
          (!hasContent || isExporting) && 'opacity-50 cursor-not-allowed'
        )}
        title={hasContent ? 'Export canvas or selection' : 'Canvas is empty'}
      >
        <Download size={14} className={isExporting ? 'animate-bounce' : ''} />
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        <ChevronDown
          size={12}
          className={cn('transition-transform duration-150', isOpen && 'rotate-180')}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-xl shadow-neutral-900/10 p-2 z-[9999] select-none animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header context info */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 border-b border-neutral-100">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Export Scope
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
              {isSelection ? `${selectedShapeIds.length} Selected` : `All (${allShapeIds.length})`}
            </span>
          </div>

          {/* Formats List */}
          <div className="flex flex-col gap-1">
            {exportOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.format}
                  onClick={() => handleExport(opt.format)}
                  disabled={isExporting}
                  className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-blue-50/70 text-left text-xs transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-md bg-neutral-100 group-hover:bg-blue-100/80 text-neutral-600 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                    <Icon size={14} />
                  </div>
                  <div className="flex flex-col flex-1 truncate">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-800 group-hover:text-blue-700">
                        {opt.label}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 font-normal">
                        {opt.ext}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 truncate">
                      {opt.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Export Settings (Scale & Background) */}
          <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between px-2 text-[11px] text-neutral-600">
            <div className="flex items-center gap-1">
              <span className="text-neutral-400">Scale:</span>
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={(e) => {
                    e.stopPropagation();
                    setScale(s);
                  }}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors',
                    scale === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setBackground(!background);
              }}
              className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
            >
              <div
                className={cn(
                  'w-3.5 h-3.5 rounded border flex items-center justify-center text-white text-[8px]',
                  background ? 'bg-blue-600 border-blue-600' : 'bg-white border-neutral-300'
                )}
              >
                {background && <Check size={10} />}
              </div>
              <span>BG</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
