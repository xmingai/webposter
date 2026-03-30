import { create } from 'zustand';

export type Tool = 'select' | 'text' | 'shape' | 'upload' | 'removeBg' | 'upscale' | 'eraser';

interface CanvasState {
  activeTool: Tool;
  selectedObjectId: string | null;
  zoom: number;
  history: string[];
  historyIndex: number;
  setTool: (tool: Tool) => void;
  setSelectedObject: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  pushHistory: (json: string) => void;
  undo: () => string | null;
  redo: () => string | null;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  activeTool: 'select',
  selectedObjectId: null,
  zoom: 100,
  history: [],
  historyIndex: -1,

  setTool: (tool) => set({ activeTool: tool }),
  setSelectedObject: (id) => set({ selectedObjectId: id }),
  setZoom: (zoom) => set({ zoom }),

  pushHistory: (json) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(json);
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return null;
    const newIndex = historyIndex - 1;
    set({ historyIndex: newIndex });
    return history[newIndex];
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return null;
    const newIndex = historyIndex + 1;
    set({ historyIndex: newIndex });
    return history[newIndex];
  },
}));
