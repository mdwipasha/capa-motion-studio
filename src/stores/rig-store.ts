import { create } from "zustand";
import { getRigDefinition } from "@/lib/rig";
import type { RigDefinition } from "@/types/rig";
import type { RigType } from "@/types/project";

export type RigTransformMode = "translate" | "rotate" | "scale";

interface RigState {
  currentRig: RigDefinition | null;
  selectedBoneId: string | null;
  transformMode: RigTransformMode;
  loadRig: (rigType: RigType) => void;
  selectBone: (boneId: string | null) => void;
  setTransformMode: (mode: RigTransformMode) => void;
}

export const useRigStore = create<RigState>((set) => ({
  currentRig: null,
  selectedBoneId: null,
  transformMode: "rotate",
  loadRig: (rigType) => set({ currentRig: getRigDefinition(rigType), selectedBoneId: null }),
  selectBone: (selectedBoneId) => set({ selectedBoneId }),
  setTransformMode: (transformMode) => set({ transformMode })
}));
