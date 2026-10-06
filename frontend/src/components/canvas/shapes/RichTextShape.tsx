import { BaseBoxShapeUtil, HTMLContainer, T } from 'tldraw';
import type { RecordProps, TLBaseShape } from 'tldraw';

export type IRichTextShape = TLBaseShape<
  'rich-text',
  {
    w: number;
    h: number;
    text: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    fontStyle: string;
    color: string;
    textAlign: 'left' | 'center' | 'right' | 'justify';
  }
>;

export class RichTextShapeUtil extends BaseBoxShapeUtil<IRichTextShape> {
  static override type = 'rich-text' as const;

  static override props: RecordProps<IRichTextShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
    fontFamily: T.string,
    fontSize: T.number,
    fontWeight: T.string,
    fontStyle: T.string,
    color: T.string,
    textAlign: T.string,
  };

  override canEdit = () => true;
  override canResize = () => true;

  override getDefaultProps(): IRichTextShape['props'] {
    return {
      w: 250,
      h: 100,
      text: 'Double click to edit...',
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      textAlign: 'left',
    };
  }

  override component(shape: IRichTextShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          fontFamily: shape.props.fontFamily,
          fontSize: `${shape.props.fontSize}px`,
          fontWeight: shape.props.fontWeight,
          fontStyle: shape.props.fontStyle,
          color: shape.props.color,
          textAlign: shape.props.textAlign,
          display: 'flex',
          alignItems: 'flex-start',
          pointerEvents: 'all',
          overflow: 'hidden',
        }}
      >
        {isEditing ? (
          <textarea
            autoFocus
            defaultValue={shape.props.text}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'transparent',
              resize: 'none',
              outline: 'none',
              font: 'inherit',
              color: 'inherit',
              textAlign: 'inherit',
              padding: 0,
              margin: 0,
            }}
            onChange={(e) => {
              this.editor.updateShape({
                id: shape.id,
                type: 'rich-text',
                props: { text: e.currentTarget.value },
              });
            }}
            onPointerDown={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          >
            {shape.props.text}
          </div>
        )}
      </HTMLContainer>
    );
  }

  override getIndicatorPath(shape: IRichTextShape) {
    const path = new Path2D();
    path.rect(0, 0, shape.props.w, shape.props.h);
    return path;
  }
}
