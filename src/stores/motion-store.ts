import { create } from "zustand";
import { getTotalFrames } from "@/lib/motion";
import type { MotionData, MotionKeyframe, PlaybackState } from "@/types/motion";

interface MotionSnapshot {
  readonly motionData: MotionData;
  readonly currentFrame: number;
  readonly selectedKeyframeId: string | null;
}

interface MotionState extends MotionSnapshot {
  playbackState: PlaybackState;
  undoStack: readonly MotionSnapshot[];
  redoStack: readonly MotionSnapshot[];
  setCurrentFrame: (frame: number, recordHistory?: boolean) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  addKeyframe: () => void;
  ensureKeyframeAt: (frame: number) => void;
  removeSelectedKeyframe: () => void;
  updateSelectedKeyframeFrame: (frame: number) => void;
  selectKeyframe: (keyframeId: string | null) => void;
  setPlaybackSettings: (fps: number, duration: number) => void;
  replaceMotion: (motionData: MotionData, currentFrame: number) => void;
  resetMotion: (fps: number) => void;
  undo: () => void;
  redo: () => void;
}

const initialMotionData: MotionData = {
  version: 1,
  timeline: { fps: 30, duration: 4, keyframes: [{ id: "intro-keyframe", frame: 0 }, { id: "pose-keyframe", frame: 30 }] }
};

function createInitialMotionData(fps = 30): MotionData {
  return { version: 1, timeline: { fps, duration: 4, keyframes: [] } };
}

function snapshot(state: MotionSnapshot): MotionSnapshot {
  return { motionData: { ...state.motionData, timeline: { ...state.motionData.timeline, keyframes: state.motionData.timeline.keyframes.map((keyframe) => ({ ...keyframe })) } }, currentFrame: state.currentFrame, selectedKeyframeId: state.selectedKeyframeId };
}

function withHistory(state: MotionState, update: MotionSnapshot): Partial<MotionState> {
  return { ...update, undoStack: [...state.undoStack, snapshot(state)].slice(-100), redoStack: [] };
}

function clampFrame(frame: number, fps: number, duration: number): number {
  return Math.min(getTotalFrames(fps, duration), Math.max(0, Math.round(frame)));
}

export const useMotionStore = create<MotionState>((set) => ({
  motionData: initialMotionData,
  currentFrame: 0,
  selectedKeyframeId: null,
  playbackState: "paused",
  undoStack: [],
  redoStack: [],
  setCurrentFrame: (frame, recordHistory = true) => set((state) => {
    const nextFrame = clampFrame(frame, state.motionData.timeline.fps, state.motionData.timeline.duration);
    if (nextFrame === state.currentFrame) return state;
    const update = { motionData: state.motionData, currentFrame: nextFrame, selectedKeyframeId: state.selectedKeyframeId };
    return recordHistory ? withHistory(state, update) : update;
  }),
  play: () => set((state) => ({ playbackState: "playing", currentFrame: state.currentFrame >= getTotalFrames(state.motionData.timeline.fps, state.motionData.timeline.duration) ? 0 : state.currentFrame })),
  pause: () => set({ playbackState: "paused" }),
  stop: () => set({ playbackState: "paused", currentFrame: 0 }),
  addKeyframe: () => set((state) => {
    if (state.motionData.timeline.keyframes.some((keyframe) => keyframe.frame === state.currentFrame)) return state;
    const keyframe: MotionKeyframe = { id: crypto.randomUUID(), frame: state.currentFrame };
    const keyframes = [...state.motionData.timeline.keyframes, keyframe].sort((left, right) => left.frame - right.frame);
    return withHistory(state, { motionData: { ...state.motionData, timeline: { ...state.motionData.timeline, keyframes } }, currentFrame: state.currentFrame, selectedKeyframeId: keyframe.id });
  }),
  ensureKeyframeAt: (frame) => set((state) => {
    const nextFrame = clampFrame(frame, state.motionData.timeline.fps, state.motionData.timeline.duration);
    if (state.motionData.timeline.keyframes.some((keyframe) => keyframe.frame === nextFrame)) return state;
    const keyframe: MotionKeyframe = { id: crypto.randomUUID(), frame: nextFrame };
    const keyframes = [...state.motionData.timeline.keyframes, keyframe].sort((left, right) => left.frame - right.frame);
    return withHistory(state, { motionData: { ...state.motionData, timeline: { ...state.motionData.timeline, keyframes } }, currentFrame: state.currentFrame, selectedKeyframeId: keyframe.id });
  }),
  removeSelectedKeyframe: () => set((state) => {
    if (!state.selectedKeyframeId) return state;
    const keyframes = state.motionData.timeline.keyframes.filter((keyframe) => keyframe.id !== state.selectedKeyframeId);
    if (keyframes.length === state.motionData.timeline.keyframes.length) return state;
    return withHistory(state, { motionData: { ...state.motionData, timeline: { ...state.motionData.timeline, keyframes } }, currentFrame: state.currentFrame, selectedKeyframeId: null });
  }),
  updateSelectedKeyframeFrame: (frame) => set((state) => {
    if (!state.selectedKeyframeId) return state;
    const nextFrame = clampFrame(frame, state.motionData.timeline.fps, state.motionData.timeline.duration);
    const selected = state.motionData.timeline.keyframes.find((keyframe) => keyframe.id === state.selectedKeyframeId);
    if (!selected || selected.frame === nextFrame || state.motionData.timeline.keyframes.some((keyframe) => keyframe.id !== selected.id && keyframe.frame === nextFrame)) return state;
    const keyframes = state.motionData.timeline.keyframes.map((keyframe) => keyframe.id === selected.id ? { ...keyframe, frame: nextFrame } : keyframe).sort((left, right) => left.frame - right.frame);
    return withHistory(state, { motionData: { ...state.motionData, timeline: { ...state.motionData.timeline, keyframes } }, currentFrame: state.currentFrame, selectedKeyframeId: state.selectedKeyframeId });
  }),
  selectKeyframe: (selectedKeyframeId) => set((state) => {
    const selected = state.motionData.timeline.keyframes.find((keyframe) => keyframe.id === selectedKeyframeId);
    return { selectedKeyframeId, currentFrame: selected ? selected.frame : state.currentFrame };
  }),
  setPlaybackSettings: (fps, duration) => set((state) => {
    const nextFps = Math.min(60, Math.max(1, Math.round(fps)));
    const nextDuration = Math.min(60, Math.max(1, Math.round(duration)));
    const totalFrames = getTotalFrames(nextFps, nextDuration);
    const keyframes = state.motionData.timeline.keyframes.filter((keyframe) => keyframe.frame <= totalFrames);
    return { motionData: { ...state.motionData, timeline: { fps: nextFps, duration: nextDuration, keyframes } }, currentFrame: Math.min(state.currentFrame, totalFrames), selectedKeyframeId: keyframes.some((keyframe) => keyframe.id === state.selectedKeyframeId) ? state.selectedKeyframeId : null };
  }),
  replaceMotion: (motionData, currentFrame) => set(() => ({
    motionData: snapshot({ motionData, currentFrame, selectedKeyframeId: null }).motionData,
    currentFrame: clampFrame(currentFrame, motionData.timeline.fps, motionData.timeline.duration),
    selectedKeyframeId: null,
    playbackState: "paused",
    undoStack: [],
    redoStack: []
  })),
  resetMotion: (fps) => set(() => ({
    motionData: createInitialMotionData(Math.min(60, Math.max(1, Math.round(fps)))),
    currentFrame: 0,
    selectedKeyframeId: null,
    playbackState: "paused",
    undoStack: [],
    redoStack: []
  })),
  undo: () => set((state) => {
    const previous = state.undoStack.at(-1);
    if (!previous) return state;
    return { ...snapshot(previous), playbackState: "paused", undoStack: state.undoStack.slice(0, -1), redoStack: [snapshot(state), ...state.redoStack].slice(0, 100) };
  }),
  redo: () => set((state) => {
    const next = state.redoStack[0];
    if (!next) return state;
    return { ...snapshot(next), playbackState: "paused", undoStack: [...state.undoStack, snapshot(state)].slice(-100), redoStack: state.redoStack.slice(1) };
  })
}));
