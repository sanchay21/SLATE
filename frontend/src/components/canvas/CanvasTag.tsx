import { useState } from 'react';
import { Tag as TagIcon, Check, Copy } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CanvasTagProps {
  tag: string;
  shapeName?: string;
  isSelected?: boolean;
  onClick: () => void;
}

export function CanvasTag({ tag, shapeName, isSelected, onClick }: CanvasTagProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all duration-150 select-none',
        isSelected
          ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-sm'
          : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800 hover:border-blue-200 hover:shadow-sm'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <TagIcon size={13} className={isSelected ? 'text-blue-600' : 'text-neutral-400 group-hover:text-blue-500'} />
        <span className="font-mono font-semibold tracking-tight text-blue-600 truncate">
          {tag}
        </span>
        {shapeName && (
          <span className="text-[11px] text-neutral-400 truncate max-w-[80px]">
            {shapeName}
          </span>
        )}
      </div>

      <button
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy tag'}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-200/60 text-neutral-500 hover:text-neutral-700 transition-opacity"
      >
        {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
      </button>
    </div>
  );
}
