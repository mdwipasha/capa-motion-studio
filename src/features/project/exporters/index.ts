import { fbxExporter } from "@/features/project/exporters/fbx-exporter";
import { rmaExporter } from "@/features/project/exporters/rma-exporter";

export const exporters = { rma: rmaExporter, fbx: fbxExporter } as const;
