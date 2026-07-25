import { create } from "zustand";
import type { AiToolTab } from "@/types/ai-tools";

interface AiToolsState {
  isOpen: boolean;
  activeTab: AiToolTab;
  open: (tab?: AiToolTab) => void;
  close: () => void;
  setTab: (tab: AiToolTab) => void;
}

export const useAiToolsStore = create<AiToolsState>((set) => ({
  isOpen: false,
  activeTab: "text",
  open: (activeTab = "text") => set({ isOpen: true, activeTab }),
  close: () => set({ isOpen: false }),
  setTab: (activeTab) => set({ activeTab })
}));
