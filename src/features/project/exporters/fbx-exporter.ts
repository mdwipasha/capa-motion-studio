import type { FileExporter } from "@/types/transfer";

export const fbxExporter: FileExporter = {
  id: "fbx",
  label: "Autodesk FBX (.fbx)",
  export: async () => ({ ok: false, message: "FBX export is registered, but its writer will be added in a later iteration." })
};
