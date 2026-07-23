import { MousePointer2, Rotate3D } from "lucide-react";
import { PanelHeader } from "@/features/editor/components/PanelHeader";
import { useActiveProject } from "@/hooks/useActiveProject";
import { frameToTime, formatTime } from "@/lib/motion";
import { getBone, getRigDefinition } from "@/lib/rig";
import { useMotionStore } from "@/stores/motion-store";
import { useBoneRotation, usePoseStore } from "@/stores/pose-store";
import { useRigStore } from "@/stores/rig-store";
import type { BoneRotation } from "@/types/rig";

function VectorRow({ label, value, readOnly = false, onChange }: { readonly label: string; readonly value: BoneRotation; readonly readOnly?: boolean; readonly onChange?: (axis: keyof BoneRotation, value: number) => void }) {
  const axisClassNames: Record<keyof BoneRotation, string> = { x: "text-rose-300", y: "text-emerald-300", z: "text-blue-300" };
  return <div className="mt-2 grid grid-cols-3 gap-1">{(["x", "y", "z"] as const).map((axis) => <label className="flex items-center gap-1 rounded border border-white/8 bg-black/10 px-1.5 py-1 text-[11px]" key={axis}><span className={axisClassNames[axis]}>{axis.toUpperCase()}</span>{readOnly ? <span className="ml-auto text-slate-400">{value[axis]}</span> : <input aria-label={`${label} ${axis}`} className="min-w-0 flex-1 bg-transparent text-right text-slate-200 outline-none" onChange={(event) => onChange?.(axis, Number(event.target.value))} step="1" type="number" value={Math.round(value[axis])} />}</label>)}</div>;
}

function BoneInspector({ boneId }: { readonly boneId: string }) {
  const project = useActiveProject();
  const currentFrame = useMotionStore((state) => state.currentFrame);
  const setBoneRotation = usePoseStore((state) => state.setBoneRotation);
  const bone = getBone(getRigDefinition(project.rigType), boneId);
  const rotation = useBoneRotation(boneId);
  if (!bone) return null;
  const updateRotation = (axis: keyof BoneRotation, value: number): void => { if (Number.isFinite(value)) setBoneRotation(boneId, { ...rotation, [axis]: value }, currentFrame); };
  const position: BoneRotation = { x: bone.position[0], y: bone.position[1], z: bone.position[2] };
  const scale: BoneRotation = { x: bone.scale[0], y: bone.scale[1], z: bone.scale[2] };
  return <section className="border-t border-white/8 pt-5"><p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><Rotate3D size={13} />Selected Bone</p><div className="mt-3 rounded-lg border border-violet-400/20 bg-violet-400/5 p-3"><p className="text-xs font-medium text-violet-100">{bone.name}</p><p className="mt-1 text-[11px] text-slate-500">Frame {currentFrame} · Rotation gizmo active</p><p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Position</p><VectorRow label="Position" readOnly value={position} /><p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Rotation (degrees)</p><VectorRow label="Rotation" onChange={updateRotation} value={rotation} /><p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Scale</p><VectorRow label="Scale" readOnly value={scale} /></div></section>;
}

export function WorkspaceInspector() {
  const project = useActiveProject();
  const { fps, keyframes } = useMotionStore((state) => state.motionData.timeline);
  const selectedKeyframeId = useMotionStore((state) => state.selectedKeyframeId);
  const updateSelectedKeyframeFrame = useMotionStore((state) => state.updateSelectedKeyframeFrame);
  const selectedBoneId = useRigStore((state) => state.selectedBoneId);
  const selectedKeyframe = keyframes.find((keyframe) => keyframe.id === selectedKeyframeId);
  return <aside className="w-72 shrink-0 overflow-y-auto border-l border-white/10 bg-[#15161d]"><PanelHeader>Inspector</PanelHeader><div className="space-y-6 p-4"><section><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Project</p><dl className="mt-3 space-y-2.5 text-xs"><div className="flex justify-between gap-3"><dt className="text-slate-500">Name</dt><dd className="truncate text-slate-200">{project.name}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Rig</dt><dd className="text-slate-200">Roblox {project.rigType}</dd></div><div className="flex justify-between"><dt className="text-slate-500">FPS</dt><dd className="text-slate-200">{fps}</dd></div></dl></section>{selectedBoneId ? <BoneInspector boneId={selectedBoneId} /> : <section className="border-t border-white/8 pt-5"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Selection</p>{selectedKeyframe ? <div className="mt-3 space-y-3 rounded-lg border border-violet-400/20 bg-violet-400/5 p-3 text-xs"><p className="font-medium text-violet-200">Keyframe</p><label className="flex items-center justify-between gap-3 text-slate-500">Frame <input aria-label="Selected keyframe frame" className="timeline-number-input" min={0} onChange={(event) => updateSelectedKeyframeFrame(Number(event.target.value))} type="number" value={selectedKeyframe.frame} /></label><div className="flex justify-between"><span className="text-slate-500">Time</span><span className="text-slate-200">{formatTime(frameToTime(selectedKeyframe.frame, fps))}</span></div></div> : <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-white/10 p-3 text-xs text-slate-500"><MousePointer2 size={15} />Nothing selected</div>}</section>}</div></aside>;
}
