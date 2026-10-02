import { BaseBoxShapeUtil, HTMLContainer, T } from 'tldraw';
import type { RecordProps, TLBaseShape } from 'tldraw';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export type IAiDraftShape = TLBaseShape<
  'ai-draft',
  {
    w: number;
    h: number;
    text: string;
    isDraft: boolean;
  }
>;

export class AiDraftShapeUtil extends BaseBoxShapeUtil<IAiDraftShape> {
  static override type = 'ai-draft' as const;

  static override props: RecordProps<IAiDraftShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
    isDraft: T.boolean,
  };

  override getDefaultProps(): IAiDraftShape['props'] {
    return {
      w: 400,
      h: 300,
      text: '',
      isDraft: true,
    };
  }

  override component(shape: IAiDraftShape) {
    const isDraft = shape.props.isDraft;
    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          border: isDraft ? '2px dashed #3b82f6' : 'none',
          boxShadow: isDraft ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none',
          backgroundColor: isDraft ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
          borderRadius: 8,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'all',
          overflow: 'auto',
        }}
      >
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {(() => {
            const svgMatch = shape.props.text.match(/```(?:xml|svg)\n([\s\S]*?)\n```/i);
            if (svgMatch) {
              return (
                <div 
                  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                  dangerouslySetInnerHTML={{ __html: svgMatch[1] }} 
                />
              );
            }
            return (
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {shape.props.text}
              </ReactMarkdown>
            );
          })()}
        </div>
        {isDraft && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
            <button
              style={{ padding: '4px 12px', background: '#ef4444', color: '#fff', borderRadius: 4, cursor: 'pointer' }}
              onClick={() => this.editor.deleteShape(shape.id)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Discard
            </button>
            <button
              style={{ padding: '4px 12px', background: '#22c55e', color: '#fff', borderRadius: 4, cursor: 'pointer' }}
              onClick={() => {
                this.editor.updateShape({ id: shape.id, type: 'ai-draft', props: { isDraft: false } });
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Accept
            </button>
          </div>
        )}
      </HTMLContainer>
    );
  }

  override getIndicatorPath(shape: IAiDraftShape) {
    const path = new Path2D();
    path.rect(0, 0, shape.props.w, shape.props.h);
    return path;
  }
}

