import { downloadTextFile } from "@/lib/file-transfer";
import { buildAsciiFbx, type FbxExportInput } from "@/features/project/exporters/fbx-builder";
import type { FileExporter } from "@/types/transfer";

export const fbxExporter: FileExporter<FbxExportInput> = {
  id: "fbx",
  label: "Autodesk FBX (.fbx)",
  export: async (document, fileName) => {
    downloadTextFile(fileName, buildAsciiFbx(document), "application/octet-stream");
    return { ok: true, message: `Exported ${fileName}.` };
  }
};
