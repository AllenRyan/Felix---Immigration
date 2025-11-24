import { ColorScheme, StartScreenPrompt, ThemeOption } from "@openai/chatkit-react";

export type WorkflowOption = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  knowledgeBaseId?: string;
};

// Knowledge base to workflow label mapping
export const KNOWLEDGE_BASE_MAP: Record<string, string> = {
  "past-assessments": "Past Assessments",
  "visa-regulations": "Visa Regulations",
  "legal-precedents": "Legal Precedents",
  "general-visa-info": "General Visa Info",
};

const parseWorkflowOptionsFromEnv = (): WorkflowOption[] => {
  const raw = process.env.NEXT_PUBLIC_CHATKIT_WORKFLOWS;
  if (!raw) {
    return [];
  }

  /**
   * Accepts either:
   *   Label:workflowId
   *   Label|knowledgeBaseId:workflowId  (preferred for unambiguous KB mapping)
   */
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [rawLeft, rawId] = entry.split(":").map((value) => value.trim());
      const [rawLabel, rawKbId] = rawLeft.split("|").map((value) => value.trim());
      const id = rawId || rawLabel || "";
      const label = rawId ? rawLabel || rawId : rawLabel || id;
      const knowledgeBaseId = rawKbId || undefined;
      return { id, label, knowledgeBaseId };
    })
    // Keep only entries with a non-empty workflow id
    .filter((option) => Boolean(option.id));
};

// Optional KB-specific env overrides, e.g. NEXT_PUBLIC_CHATKIT_WORKFLOW_PAST_ASSESSMENTS=wf_xxx
const parseKbWorkflowOverrides = (): WorkflowOption[] => {
  // Next.js only exposes env vars that are accessed statically.
  const envOverrides: Record<string, string | undefined> = {
    "past-assessments": process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_PAST_ASSESSMENTS,
    "visa-regulations": process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_VISA_REGULATIONS,
    "legal-precedents": process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_LEGAL_PRECEDENTS,
    "general-visa-info": process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_GENERAL_VISA_INFO,
  };

  const results: WorkflowOption[] = [];

  for (const [kbId, workflowId] of Object.entries(envOverrides)) {
    const id = workflowId?.trim();
    if (id) {
      results.push({
        id,
        label: KNOWLEDGE_BASE_MAP[kbId] ?? kbId,
        knowledgeBaseId: kbId,
      });
    }
  }

  return results;
};

const fallbackWorkflowId =
  process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID?.trim() ?? "";

export const WORKFLOW_OPTIONS: WorkflowOption[] = (() => {
  // KB-specific overrides take precedence
  const kbOverrides = parseKbWorkflowOverrides();
  const options = parseWorkflowOptionsFromEnv();
  const combined = [...kbOverrides, ...options];
  if (combined.length > 0) {
    return combined;
  }
  if (options.length > 0) {
    return options;
  }
  if (fallbackWorkflowId) {
    return [{ id: fallbackWorkflowId, label: fallbackWorkflowId }];
  }
  return [];
})();

export const WORKFLOW_ID = WORKFLOW_OPTIONS[0]?.id ?? "";

export const CREATE_SESSION_ENDPOINT = "/api/create-session";

// Helper function to get workflow by knowledge base ID
export function getWorkflowByKnowledgeBase(kbId: string): WorkflowOption | null {
  // Prefer explicit knowledgeBaseId on the workflow option
  const workflow =
    WORKFLOW_OPTIONS.find(option => option.knowledgeBaseId === kbId) ||
    (() => {
      const label = KNOWLEDGE_BASE_MAP[kbId];
      if (!label) {
        console.warn(`No workflow mapping found for knowledge base: ${kbId}`);
        return null;
      }
      return WORKFLOW_OPTIONS.find(option => option.label === label) || null;
    })();

  if (!workflow) {
    console.warn(`No workflow found for KB: ${kbId}`);
    return null;
  }

  return workflow;
}

// Conversation history type
export type Conversation = {
  id: string;
  title: string;
  timestamp: Date;
  workflowId?: string;
  threadId?: string;
};

// Action cards shown on the start screen - mapped to knowledge bases
export const ACTION_CARDS = [
  {
    id: "past-assessments",
    label: "PAST ASSESSMENTS",
    description: "Access historical visa assessments and previous cases",
    icon: "file-text",
    knowledgeBase: "past-assessments",
  },
  {
    id: "visa-regulations",
    label: "VISA REGULATIONS",
    description: "Explore current visa regulations and requirements",
    icon: "globe",
    knowledgeBase: "visa-regulations",
  },
  {
    id: "legal-precedents",
    label: "LEGAL PRECEDENTS",
    description: "Research legal precedents and case law",
    icon: "scale",
    knowledgeBase: "legal-precedents",
  },
  {
    id: "general-visa-info",
    label: "GENERAL VISA INFO",
    description: "Get general information about visa processes",
    icon: "info",
    knowledgeBase: "general-visa-info",
  },
];

export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "What can you do?",
    prompt: "What can you do?",
    icon: "circle-question",
  },
];

export const PLACEHOLDER_INPUT = "Ask anything...";

export const GREETING = "How can I help you today?";

export const getThemeConfig = (theme: ColorScheme): ThemeOption => ({
  color: {
    grayscale: {
      hue: 220,
      tint: 6,
      shade: theme === "dark" ? -1 : -4,
    },
    accent: {
      primary: theme === "dark" ? "#f1f5f9" : "#0f172a",
      level: 1,
    },
  },
  radius: "round",
  // Add other theme options here
  // chatkit.studio/playground to explore config options
});
