/**
 * 电商卖点图 — 全管线类型定义
 */

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SubPart {
  id: string;
  description: string;
  bbox: BBox;
}

export interface SellingPoint {
  id: string;
  targetId: string;
  headline: string;
  subtitle: string;
}

export interface FeatureCalloutJSON {
  product: {
    name: string;
    category: string;
    bbox: BBox;
  };
  subParts: SubPart[];
  mainTitle: string;
  sellingPoints: SellingPoint[];
  /** AI 生成的场景 prompt（由 VLM 分析后返回） */
  scenePrompt?: string;
}

/** editableActions — 生成完成后推荐的后续操作 */
export interface EditableAction {
  id: string;
  icon: string;
  label: string;
  description: string;
  type: 'regenerate_scene' | 'edit_copy' | 'switch_layout' | 'multilingual' | 'ab_variant' | 'custom';
}

/** 管线阶段 */
export type PipelineStage =
  | 'idle'
  | 'removing_bg'
  | 'analyzing'
  | 'generating_scene'
  | 'compositing'
  | 'done'
  | 'error';
