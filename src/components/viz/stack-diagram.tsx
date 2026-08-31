import type { ItemRecord } from "@/lib/intelligence/types";

const STACKS: Record<string, string[]> = {
  agents: ["Goal", "Planner", "Tool use", "Runtime", "Observation", "Memory"],
  "ai-agents": ["Goal", "Planner", "Tool use", "Runtime", "Observation", "Memory"],
  vlms: ["Image / video", "Vision encoder", "Projector", "Language model", "Reasoning", "Action"],
  multimodal: ["Text", "Image", "Audio", "Video", "Fusion", "Output"],
  robotics: ["Sensors", "Perception", "VLA / policy", "Planner", "Controller", "Actuators"],
  vla: ["Camera", "Language", "Action tokens", "Robot API", "World"],
  embodied: ["Body", "Sensors", "Policy", "Environment", "Reward / feedback"],
  cuda: ["Model", "CUDA kernels", "Tensor cores", "HBM", "Inference runtime"],
  inference: ["Weights", "Quantization", "KV cache", "Scheduler", "Tokens out"],
  gpus: ["Host", "PCIe / NVLink", "GPU SM", "Tensor cores", "HBM"],
  safety: ["Policy", "Eval", "Monitoring", "Containment", "Incident response"],
  llms: ["Data", "Pretrain", "Post-train", "Align", "Serve", "Eval"],
};

export function StackDiagram({ item }: { item: ItemRecord }) {
  const key = item.categories.find((c) => STACKS[c]) ?? "llms";
  const steps = STACKS[key] ?? STACKS.llms!;
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface p-4">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-subtle">System stack</p>
      <ol className="flex min-w-max items-center gap-0">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center">
            <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-center">
              <span className="block font-mono text-xs tabular-nums text-subtle">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-sm">{step}</span>
            </div>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border-strong" aria-hidden />}
          </li>
        ))}
      </ol>
    </div>
  );
}
