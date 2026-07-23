import type { FileImporter } from "@/types/transfer";

export const fbxImporter: FileImporter = {
  id: "fbx",
  label: "Autodesk FBX (.fbx)",
  extensions: [".fbx"],
  canImport: (file) => file.name.toLowerCase().endsWith(".fbx"),
  import: async () => ({ ok: false, message: "FBX import is registered, but its parser will be added in a later iteration." })
};
