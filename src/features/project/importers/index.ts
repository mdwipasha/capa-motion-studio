import { fbxImporter } from "@/features/project/importers/fbx-importer";
import { rmaImporter } from "@/features/project/importers/rma-importer";
import type { FileImporter } from "@/types/transfer";

export const importers: readonly FileImporter[] = [rmaImporter, fbxImporter];

export function getImporter(file: File): FileImporter | undefined {
  return importers.find((importer) => importer.canImport(file));
}
