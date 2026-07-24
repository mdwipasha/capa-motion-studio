import { downloadBinaryFile } from "@/lib/file-transfer";
import { buildBinaryFbx, type FbxExportInput } from "@/features/project/exporters/fbx-builder";
import type { FileExporter } from "@/types/transfer";

export const fbxExporter: FileExporter<FbxExportInput> = {
  id: "fbx",
  label: "Autodesk FBX Binary 7.4 (.fbx)",
  export: async (document, fileName) => {
    downloadBinaryFile(fileName, buildBinaryFbx(document), "application/octet-stream");
    return { ok: true, message: `Exported ${fileName}.` };
  }
};
