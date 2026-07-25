import { create } from "zustand";
import type { RuntimeStatus } from "@/types/release";

type ReleaseView = "help" | "about" | "models" | "shortcuts";

interface ReleaseState {
  isOpen: boolean;
  view: ReleaseView;
  runtime: RuntimeStatus | null;
  runtimeProgress: number;
  runtimeAction: "idle" | "downloading" | "ready" | "failed";
  modelProgress: number;
  modelAction: "idle" | "downloading" | "ready" | "failed";
  notice: string | null;
  open: (view: ReleaseView) => void;
  close: () => void;
  setRuntime: (runtime: RuntimeStatus) => void;
  setRuntimeAction: (action: ReleaseState["runtimeAction"], progress: number) => void;
  setModelAction: (action: ReleaseState["modelAction"], progress: number) => void;
  setNotice: (notice: string | null) => void;
}

export const useReleaseStore = create<ReleaseState>((set) => ({
  isOpen: false,
  view: "help",
  runtime: null,
  runtimeProgress: 0,
  runtimeAction: "idle",
  modelProgress: 0,
  modelAction: "idle",
  notice: null,
  open: (view) => set({ isOpen: true, view }),
  close: () => set({ isOpen: false }),
  setRuntime: (runtime) => set({ runtime }),
  setRuntimeAction: (runtimeAction, runtimeProgress) => set({ runtimeAction, runtimeProgress }),
  setModelAction: (modelAction, modelProgress) => set({ modelAction, modelProgress }),
  setNotice: (notice) => set({ notice })
}));
