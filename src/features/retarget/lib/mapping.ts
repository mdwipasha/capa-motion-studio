import r6Mapping from "@/features/retarget/mapping/r6.json";
import r15Mapping from "@/features/retarget/mapping/r15.json";
import type { RigBoneMapping } from "@/types/retarget";
import type { RigType } from "@/types/project";

const mappings: Readonly<Record<RigType, RigBoneMapping>> = { R6: r6Mapping as RigBoneMapping, R15: r15Mapping as RigBoneMapping };

export function getRigMapping(rigType: RigType): RigBoneMapping {
  return mappings[rigType];
}
