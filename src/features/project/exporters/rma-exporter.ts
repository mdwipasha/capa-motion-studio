import { downloadTextFile } from "@/lib/file-transfer";
import type { RmaProjectFile } from "@/types/rma";
import type { FileExporter } from "@/types/transfer";

export const rmaExporter: FileExporter<RmaProjectFile> = {
  id: "rma",
  label: "CapaMotion Project (.rma)",
  export: async (document, fileName) => {
    downloadTextFile(fileName, `${JSON.stringify(document, null, 2)}\n`);
    return { ok: true, message: `Saved ${fileName}.` };
  }
};
