import { parseRmaProject } from "@/lib/rma";
import type { FileImporter } from "@/types/transfer";
import type { RmaProjectFile } from "@/types/rma";

export const rmaImporter: FileImporter<RmaProjectFile> = {
  id: "rma",
  label: "CapaMotion Project (.rma)",
  extensions: [".rma"],
  canImport: (file) => file.name.toLowerCase().endsWith(".rma"),
  import: async (file) => {
    try {
      return { ok: true, message: `Opened ${file.name}.`, document: parseRmaProject(await file.text()) };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "Unable to open the project file." };
    }
  }
};
