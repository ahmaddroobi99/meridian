import type { CategoryNode } from "./types";

export const TAXONOMY: CategoryNode[] = [
  { id: "foundation-models", label: "Foundation Models", keywords: ["foundation model", "frontier model", "pretrained"] },
  { id: "llms", label: "LLMs", parent: "foundation-models", keywords: ["llm", "language model", "gpt", "claude", "llama", "gemini", "grok", "qwen", "mistral", "tokenizer", "context window"] },
  { id: "vlms", label: "VLMs", parent: "foundation-models", keywords: ["vlm", "vision-language", "vision language", "multimodal image", "clip", "siglip"] },
  { id: "video-models", label: "Video Models", parent: "foundation-models", keywords: ["video generation", "video model", "sora", "runway", "kling", "world video"] },
  { id: "audio-models", label: "Audio Models", parent: "foundation-models", keywords: ["speech", "tts", "asr", "audio model", "whisper", "voice"] },
  { id: "multimodal", label: "Multimodal Models", parent: "foundation-models", keywords: ["multimodal", "any-to-any", "omni"] },
  { id: "world-models", label: "World Models", parent: "foundation-models", keywords: ["world model", "generative world", "simulation model"] },

  { id: "agents", label: "Agents", keywords: ["agent", "agentic", "tool use", "function calling"] },
  { id: "ai-agents", label: "AI Agents", parent: "agents", keywords: ["ai agent", "autonomous agent", "agent loop"] },
  { id: "agentic-systems", label: "Agentic Systems", parent: "agents", keywords: ["agentic", "orchestration", "multi-step"] },
  { id: "tool-use", label: "Tool Use", parent: "agents", keywords: ["tool use", "function call", "mcp", "tool calling"] },
  { id: "computer-use", label: "Computer Use", parent: "agents", keywords: ["computer use", "browser agent", "gui agent", "operator"] },
  { id: "multi-agent", label: "Multi-Agent Systems", parent: "agents", keywords: ["multi-agent", "swarm", "agent team"] },
  { id: "autonomous-coding", label: "Autonomous Coding", parent: "agents", keywords: ["coding agent", "swe-bench", "codegen", "cursor", "devin", "copilot"] },

  { id: "machine-learning", label: "Machine Learning", keywords: ["machine learning", "neural net", "backprop"] },
  { id: "deep-learning", label: "Deep Learning", parent: "machine-learning", keywords: ["deep learning", "transformer", "attention", "cnn", "resnet"] },
  { id: "rl", label: "Reinforcement Learning", parent: "machine-learning", keywords: ["reinforcement learning", "rlhf", "ppo", "grpo", "reward model", "policy gradient"] },
  { id: "representation", label: "Representation Learning", parent: "machine-learning", keywords: ["embedding", "representation", "contrastive"] },
  { id: "ssl", label: "Self-Supervised Learning", parent: "machine-learning", keywords: ["self-supervised", "masked modeling", "pretrain"] },
  { id: "generative", label: "Generative AI", parent: "machine-learning", keywords: ["generative", "diffusion", "gan", "flow matching", "vae"] },

  { id: "computer-vision", label: "Computer Vision", keywords: ["computer vision", "image recognition", "visual"] },
  { id: "detection", label: "Object Detection", parent: "computer-vision", keywords: ["object detection", "yolo", "detr", "bounding box"] },
  { id: "segmentation", label: "Segmentation", parent: "computer-vision", keywords: ["segmentation", "sam", "mask"] },
  { id: "vision-3d", label: "3D Vision", parent: "computer-vision", keywords: ["3d vision", "nerf", "gaussian splat", "point cloud"] },
  { id: "depth", label: "Depth", parent: "computer-vision", keywords: ["depth estimation", "stereo", "monocular depth"] },
  { id: "slam", label: "SLAM", parent: "computer-vision", keywords: ["slam", "visual odometry", "mapping"] },
  { id: "lidar", label: "LiDAR", parent: "computer-vision", keywords: ["lidar", "point cloud"] },
  { id: "sensor-fusion", label: "Sensor Fusion", parent: "computer-vision", keywords: ["sensor fusion", "kalman", "imu"] },
  { id: "video-understanding", label: "Video Understanding", parent: "computer-vision", keywords: ["video understanding", "action recognition", "temporal"] },

  { id: "robotics", label: "Robotics", keywords: ["robot", "robotics", "manipulator"] },
  { id: "embodied", label: "Embodied AI", parent: "robotics", keywords: ["embodied", "physical ai", "embodiment"] },
  { id: "vla", label: "VLA", parent: "robotics", keywords: ["vla", "vision-language-action", "rt-2", "rt-1", "openvla", "pi0"] },
  { id: "robot-foundation", label: "Robot Foundation Models", parent: "robotics", keywords: ["robot foundation", "generalist robot"] },
  { id: "manipulation", label: "Manipulation", parent: "robotics", keywords: ["manipulation", "gripper", "dexterous"] },
  { id: "navigation", label: "Navigation", parent: "robotics", keywords: ["navigation", "path planning", "mobile robot"] },
  { id: "sim-to-real", label: "Sim-to-Real", parent: "robotics", keywords: ["sim-to-real", "sim2real", "isaac", "mujoco"] },

  { id: "infra", label: "AI Infrastructure", keywords: ["inference", "serving", "training cluster"] },
  { id: "gpus", label: "GPUs", parent: "infra", keywords: ["gpu", "h100", "h200", "b200", "blackwell", "hopper"] },
  { id: "cpus", label: "CPUs", parent: "infra", keywords: ["cpu inference", "amx"] },
  { id: "npus", label: "NPUs", parent: "infra", keywords: ["npu", "neural engine", "qualcomm"] },
  { id: "cuda", label: "CUDA", parent: "infra", keywords: ["cuda", "kernel", "cutlass", "triton"] },
  { id: "inference", label: "Inference", parent: "infra", keywords: ["inference", "vllm", "tensorrt", "llama.cpp", "kv cache", "speculative decoding"] },
  { id: "training", label: "Training", parent: "infra", keywords: ["training", "fsdp", "deepspeed", "megatron", "pretraining"] },
  { id: "quantization", label: "Quantization", parent: "infra", keywords: ["quantization", "int8", "int4", "awq", "gptq", "gguf"] },
  { id: "compilation", label: "Model Compilation", parent: "infra", keywords: ["compile", "torch.compile", "xla", "mlir"] },
  { id: "distributed", label: "Distributed Computing", parent: "infra", keywords: ["distributed", "kubernetes", "ray", "pipeline parallel"] },

  { id: "hardware", label: "AI Hardware", keywords: ["accelerator", "asic", "chip"] },
  { id: "nvidia", label: "NVIDIA", parent: "hardware", keywords: ["nvidia", "tensor core", "nvlink"] },
  { id: "amd", label: "AMD", parent: "hardware", keywords: ["amd", "instinct", "rocm", "mi300"] },
  { id: "tpu", label: "Google TPU", parent: "hardware", keywords: ["tpu", "ironwood", "trillium"] },
  { id: "apple-silicon", label: "Apple Silicon", parent: "hardware", keywords: ["apple silicon", "m4", "mlx", "ane"] },
  { id: "asic", label: "Custom ASICs", parent: "hardware", keywords: ["asic", "trainium", "inferentia", "groq", "cerebras", "sambanova"] },
  { id: "edge-ai", label: "Edge AI", parent: "hardware", keywords: ["edge ai", "on-device", "mobile npu"] },
  { id: "accelerators", label: "AI Accelerators", parent: "hardware", keywords: ["accelerator", "wafer scale"] },

  { id: "scientific", label: "Scientific AI", keywords: ["ai for science", "scientific ml"] },
  { id: "sciml", label: "Scientific Machine Learning", parent: "scientific", keywords: ["sciml", "scientific machine learning"] },
  { id: "pinn", label: "Physics-Informed ML", parent: "scientific", keywords: ["physics-informed", "pinn", "neural pde"] },
  { id: "ai-for-science", label: "AI for Science", parent: "scientific", keywords: ["alphafold", "weather model", "scientific discovery"] },
  { id: "climate", label: "Climate AI", parent: "scientific", keywords: ["climate", "earth system", "weather"] },
  { id: "comp-physics", label: "Computational Physics", parent: "scientific", keywords: ["computational physics", "molecular dynamics"] },
  { id: "materials", label: "Materials AI", parent: "scientific", keywords: ["materials", "crystal", "gno"] },
  { id: "drug", label: "Drug Discovery", parent: "scientific", keywords: ["drug discovery", "molecule", "protein design"] },

  { id: "safety", label: "AI Safety", keywords: ["safety", "alignment", "responsible ai"] },
  { id: "alignment", label: "Alignment", parent: "safety", keywords: ["alignment", "constitutional", "rlhf"] },
  { id: "interpretability", label: "Interpretability", parent: "safety", keywords: ["interpretability", "mech interp", "sae", "circuit"] },
  { id: "evaluation", label: "Evaluation", parent: "safety", keywords: ["benchmark", "eval", "leaderboard", "swe-bench"] },
  { id: "robustness", label: "Robustness", parent: "safety", keywords: ["robustness", "adversarial", "jailbreak"] },
  { id: "ai-security", label: "AI Security", parent: "safety", keywords: ["ai security", "prompt injection", "exfiltration"] },
  { id: "agent-safety", label: "Agent Safety", parent: "safety", keywords: ["agent safety", "containment", "sandbox"] },

  { id: "industry", label: "AI Industry", keywords: ["funding", "startup", "regulation"] },
  { id: "startups", label: "Startups", parent: "industry", keywords: ["startup", "founded", "spinout"] },
  { id: "funding", label: "Funding", parent: "industry", keywords: ["funding", "series a", "series b", "valuation", "raised"] },
  { id: "products", label: "Products", parent: "industry", keywords: ["product", "launch", "ga release"] },
  { id: "regulation", label: "Regulation", parent: "industry", keywords: ["regulation", "eu ai act", "policy", "copyright"] },
  { id: "jobs", label: "Jobs", parent: "industry", keywords: ["hiring", "layoffs", "talent"] },
  { id: "market", label: "Market Trends", parent: "industry", keywords: ["market", "capex", "datacenter"] },
];

export const ROOT_CATEGORIES = TAXONOMY.filter((c) => !c.parent);

export const CATEGORY_BY_ID = Object.fromEntries(TAXONOMY.map((c) => [c.id, c]));

export const LEARNING_PATHS: { id: string; title: string; steps: string[] }[] = [
  {
    id: "llm-systems",
    title: "LLM systems engineer",
    steps: ["llms", "cuda", "inference", "quantization", "distributed"],
  },
  {
    id: "agents",
    title: "Agent systems",
    steps: ["llms", "tool-use", "ai-agents", "autonomous-coding", "agent-safety"],
  },
  {
    id: "physical-ai",
    title: "Physical AI",
    steps: ["vlms", "computer-vision", "vla", "robotics", "embodied", "sim-to-real"],
  },
  {
    id: "gpu",
    title: "GPU / CUDA",
    steps: ["gpus", "cuda", "training", "inference", "compilation"],
  },
  {
    id: "open-source",
    title: "Open models",
    steps: ["llms", "quantization", "inference", "oss"],
  },
];

export const CONFERENCES = [
  "NeurIPS",
  "ICML",
  "ICLR",
  "CVPR",
  "ICCV",
  "ECCV",
  "ACL",
  "EMNLP",
  "AAAI",
  "IJCAI",
  "RSS",
  "CoRL",
];
