'use client';

import { useState, useRef } from 'react';
import {
  Upload, Sparkles, Loader2, Pencil, ArrowRight, Tag,
  ImageOff, ScanSearch, ImageIcon, Check, RefreshCw,
  Languages, Shuffle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFeatureCalloutStore } from '@/stores/featureCalloutStore';
import type { PipelineStage } from '@/types/featureCallout';

/** 管线阶段配置 */
const STAGE_CONFIG: Record<PipelineStage, { label: string; step: number }> = {
  idle: { label: '等待上传', step: 0 },
  removing_bg: { label: '自动抠图', step: 1 },
  analyzing: { label: '识别卖点', step: 2 },
  generating_scene: { label: 'AI 生成', step: 3 },
  compositing: { label: '渲染画布', step: 4 },
  done: { label: '完成', step: 5 },
  error: { label: '出错了', step: -1 },
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  regen_scene: RefreshCw,
  edit_copy: Pencil,
  multilingual: Languages,
  ab_variant: Shuffle,
};

export default function FeatureCalloutPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const {
    stage,
    stageMessage,
    calloutData,
    cutoutImage,
    finalImage,
    editableActions,
    error,
    runPipeline,
    updateSellingPoint,
    updateMainTitle,
    regenerate,
    reset,
  } = useFeatureCalloutStore();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setPreview(base64);
      await runPipeline(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAction = async (actionId: string) => {
    switch (actionId) {
      case 'regen_scene':
      case 'edit_copy':
        await regenerate();
        break;
      default:
        alert(`🚧 功能开发中: ${actionId}`);
    }
  };

  const handleReset = () => {
    reset();
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isProcessing = ['removing_bg', 'analyzing', 'generating_scene', 'compositing'].includes(stage);
  const currentStep = STAGE_CONFIG[stage]?.step ?? 0;

  return (
    <div className="flex flex-col gap-4 p-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Tag className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">AI 卖点图</h3>
          <p className="text-[11px] text-muted-foreground">上传产品图，AI 直出成品图</p>
        </div>
      </div>

      {/* Upload area */}
      {stage === 'idle' && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-8 transition-all hover:border-primary/40 hover:bg-primary/5"
        >
          <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-sm text-muted-foreground group-hover:text-foreground">
            上传产品裸图
          </span>
          <span className="text-[10px] text-muted-foreground/60">支持 JPG、PNG</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Progress */}
      {stage !== 'idle' && (
        <div className="flex flex-col gap-3">
          {/* Step indicators */}
          <div className="flex items-center justify-between px-1">
            {[
              { s: 1, label: '抠图' },
              { s: 2, label: '识别' },
              { s: 3, label: 'AI 生图' },
              { s: 4, label: '渲染' },
              { s: 5, label: '完成' },
            ].map(({ s, label }) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-all',
                    currentStep >= s
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {currentStep > s ? '✓' : s}
                </div>
                <span className={cn(
                  'text-[9px]',
                  currentStep >= s ? 'text-foreground' : 'text-muted-foreground/50'
                )}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Status message */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/5 border border-primary/10 p-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-primary font-medium">{stageMessage}</span>
            </div>
          )}

          {/* Preview thumbnails */}
          {(preview || cutoutImage || finalImage) && (
            <div className="grid grid-cols-2 gap-2">
              {preview && (
                <div className="rounded-lg overflow-hidden border bg-muted/20">
                  <img src={preview} alt="原图" className="w-full h-20 object-contain" />
                  <div className="text-[9px] text-center text-muted-foreground py-0.5">原图</div>
                </div>
              )}
              {cutoutImage && (
                <div className="rounded-lg overflow-hidden border bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHJlY3Qgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI2UwZTBlMCIvPjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNlMGUwZTAiLz48L3N2Zz4=')]">
                  <img src={cutoutImage} alt="抠图" className="w-full h-20 object-contain" />
                  <div className="text-[9px] text-center text-muted-foreground py-0.5 bg-background/80">抠图</div>
                </div>
              )}
              {finalImage && (
                <div className="col-span-2 rounded-lg overflow-hidden border">
                  <img src={finalImage} alt="AI 成品" className="w-full object-contain" />
                  <div className="text-[9px] text-center text-primary py-0.5 bg-primary/5 font-medium">✨ AI 直出成品</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {stage === 'error' && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs text-destructive">{error}</p>
          <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs" onClick={handleReset}>
            重试
          </Button>
        </div>
      )}

      {/* Selling points editor */}
      {calloutData && !isProcessing && (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-muted-foreground">
            识别到：<span className="text-foreground font-medium">{calloutData.product.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground shrink-0">标题</span>
            <input
              type="text"
              value={calloutData.mainTitle}
              onChange={(e) => updateMainTitle(e.target.value)}
              className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              AI 提炼的卖点（可编辑后重新生成）
            </span>
            {calloutData.sellingPoints.map((sp, i) => {
              const target = calloutData.subParts.find((p) => p.id === sp.targetId);
              return (
                <div
                  key={sp.id}
                  className="group flex items-start gap-2.5 rounded-xl border bg-card/50 p-2.5 transition-all hover:border-primary/30"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={sp.headline}
                      onChange={(e) => updateSellingPoint(sp.id, { headline: e.target.value })}
                      className="font-semibold text-sm bg-transparent border-none outline-none w-full"
                    />
                    <input
                      type="text"
                      value={sp.subtitle}
                      onChange={(e) => updateSellingPoint(sp.id, { subtitle: e.target.value })}
                      className="text-xs text-muted-foreground bg-transparent border-none outline-none w-full"
                    />
                    {target && (
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40" />
                        <span className="text-[9px] text-muted-foreground/50">{target.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Regenerate button */}
          {stage === 'done' && (
            <Button className="gap-2 font-bold" onClick={() => regenerate()}>
              <Sparkles className="h-4 w-4" />
              修改文案后重新 AI 生成
            </Button>
          )}
        </div>
      )}

      {/* Editable Actions */}
      {stage === 'done' && editableActions.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            💡 接下来你可以
          </span>
          {editableActions.map((action) => {
            const Icon = ACTION_ICONS[action.id] || Sparkles;
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="flex items-center gap-3 rounded-xl border bg-card/30 p-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{action.label}</div>
                  <div className="text-[10px] text-muted-foreground">{action.description}</div>
                </div>
              </button>
            );
          })}

          <Button variant="ghost" size="sm" className="mt-1 text-xs text-muted-foreground" onClick={handleReset}>
            ↺ 重新开始
          </Button>
        </div>
      )}
    </div>
  );
}
