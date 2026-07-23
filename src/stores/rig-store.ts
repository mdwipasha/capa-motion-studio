import { create } from "zustand";
import { getRigDefinition } from "@/lib/rig";
import type { RigDefinition } from "@/types/rig";
import type { RigType } from "@/types/project";

interface RigState {
  currentRig: RigDefinition | null;
  selectedBoneId: string | null;
  loadRig: (rigType: RigType) => void;
  selectBone: (boneId: string | null) => void;
}

export const useRigStore = create<RigState>((set) => ({
  currentRig: null,
  selectedBoneId: null,
  loadRig: (rigType) => set({ currentRig: getRigDefinition(rigType), selectedBoneId: null }),
  selectBone: (selectedBoneId) => set({ selectedBoneId })
}));
