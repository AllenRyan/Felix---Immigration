"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import {
  STARTER_PROMPTS,
  PLACEHOLDER_INPUT,
  GREETING,
  CREATE_SESSION_ENDPOINT,
  getThemeConfig,
} from "@/lib/config";
import { ErrorOverlay } from "./ErrorOverlay";
import type { ColorScheme } from "@/hooks/useColorScheme";

export type FactAction = {
  type: "save";
  factId: string;
  factText: string;
};

type ChatKitPanelProps = {
  workflowId: string;
  knowledgeBaseId?: string | null;
  theme: ColorScheme;
  onWidgetAction: (action: FactAction) => Promise<void>;
  onResponseEnd: () => void;
  onThemeRequest: (scheme: ColorScheme) => void;
};

type ErrorState = {
  script: string | null;
  session: string | null;
  integration: string | null;
  retryable: boolean;
};

const isBrowser = typeof window !== "undefined";
const isDev = process.env.NODE_ENV !== "production";

const createInitialErrors = (): ErrorState => ({
  script: null,
  session: null,
  integration: null,
  retryable: false,
});

export function ChatKitPanel({
  workflowId,
  knowledgeBaseId,
  theme,
  onWidgetAction,
  onResponseEnd,
  onThemeRequest,
}: ChatKitPanelProps) {
  const processedFacts = useRef(new Set<string>());
  const [errors, setErrors] = useState<ErrorState>(() => createInitialErrors());
  const [isInitializingSession, setIsInitializingSession] = useState(true);
  const isMountedRef = useRef(true);
  const initTimeoutRef = useRef<number | undefined>(undefined);
  const [scriptStatus, setScriptStatus] = useState<
    "pending" | "ready" | "error"
  >(() =>
    isBrowser && window.customElements?.get("openai-chatkit")
      ? "ready"
      : "pending"
  );
  const [widgetInstanceKey, setWidgetInstanceKey] = useState(0);
  const previousWorkflowIdRef = useRef(workflowId);
  const missingWorkflowMessage =
    "Add at least one workflow via NEXT_PUBLIC_CHATKIT_WORKFLOW_ID or NEXT_PUBLIC_CHATKIT_WORKFLOWS in your .env.local file.";

  const setErrorState = useCallback((updates: Partial<ErrorState>) => {
    setErrors((current) => ({ ...current, ...updates }));
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (initTimeoutRef.current) {
        window.clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  // Listen for ChatKit widget connection events
  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const handleChatKitReady = (event: Event) => {
      if (isDev) {
        console.info("[ChatKitPanel] ChatKit ready event received", event);
      }
      if (initTimeoutRef.current) {
        window.clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = undefined;
      }
      if (isMountedRef.current && isInitializingSession) {
        setIsInitializingSession(false);
      }
    };

    const handleChatKitError = (event: Event) => {
      if (isDev) {
        console.error("[ChatKitPanel] ChatKit error event received", event);
      }
      const detail = (event as CustomEvent)?.detail;
      if (isMountedRef.current) {
        const message = formatFriendlyErrorMessage(
          typeof detail === "string" ? detail : "ChatKit widget error"
        );
        setErrorState({
          integration: message,
          retryable: true,
        });
        setIsInitializingSession(false);
      }
    };

    // Listen for potential ChatKit custom events
    window.addEventListener('chatkit-ready', handleChatKitReady);
    window.addEventListener('chatkit-connected', handleChatKitReady);
    window.addEventListener('chatkit-error', handleChatKitError);

    return () => {
      window.removeEventListener('chatkit-ready', handleChatKitReady);
      window.removeEventListener('chatkit-connected', handleChatKitReady);
      window.removeEventListener('chatkit-error', handleChatKitError);
    };
  }, [isInitializingSession, setErrorState]);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    let timeoutId: number | undefined;

    const handleLoaded = () => {
      if (!isMountedRef.current) {
        return;
      }
      setScriptStatus("ready");
      setErrorState({ script: null });
    };

    const handleError = (event: Event) => {
      console.error("Failed to load chatkit.js for some reason", event);
      if (!isMountedRef.current) {
        return;
      }
      setScriptStatus("error");
      const detail = (event as CustomEvent<unknown>)?.detail ?? "unknown error";
      setErrorState({
        script: formatFriendlyErrorMessage(`Error: ${detail}`),
        retryable: false,
      });
      setIsInitializingSession(false);
    };

    window.addEventListener("chatkit-script-loaded", handleLoaded);
    window.addEventListener(
      "chatkit-script-error",
      handleError as EventListener
    );

    if (window.customElements?.get("openai-chatkit")) {
      handleLoaded();
    } else if (scriptStatus === "pending") {
      timeoutId = window.setTimeout(() => {
        if (!window.customElements?.get("openai-chatkit")) {
          handleError(
            new CustomEvent("chatkit-script-error", {
              detail:
                "ChatKit web component is unavailable. Verify that the script URL is reachable.",
            })
          );
        }
      }, 5000);
    }

    return () => {
      window.removeEventListener("chatkit-script-loaded", handleLoaded);
      window.removeEventListener(
        "chatkit-script-error",
        handleError as EventListener
      );
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [scriptStatus, setErrorState]);

  const isWorkflowConfigured = Boolean(
    workflowId && !workflowId.startsWith("wf_replace")
  );

  useEffect(() => {
    if (!isWorkflowConfigured && isMountedRef.current) {
      setErrorState({
        session: missingWorkflowMessage,
        retryable: false,
      });
      setIsInitializingSession(false);
    }
  }, [isWorkflowConfigured, setErrorState]);

  const handleResetChat = useCallback(() => {
    // Clear any pending initialization timeout
    if (initTimeoutRef.current) {
      window.clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = undefined;
    }
    processedFacts.current.clear();
    if (isBrowser) {
      setScriptStatus(
        window.customElements?.get("openai-chatkit") ? "ready" : "pending"
      );
    }
    setIsInitializingSession(true);
    setErrors(createInitialErrors());
    setWidgetInstanceKey((prev) => prev + 1);
  }, []);

  // Reset the widget whenever the workflow changes so we don't show stale conversations
  useEffect(() => {
    const workflowChanged =
      previousWorkflowIdRef.current && previousWorkflowIdRef.current !== workflowId;

    if (isDev) {
      console.info("[ChatKitPanel] Workflow effect", {
        previous: previousWorkflowIdRef.current,
        current: workflowId,
        changed: workflowChanged,
      });
    }

    if (workflowChanged) {
      if (isDev) {
        console.info("[ChatKitPanel] Workflow changed - resetting ChatKit", {
          from: previousWorkflowIdRef.current,
          to: workflowId,
        });
      }
      handleResetChat();
    }

    previousWorkflowIdRef.current = workflowId;
  }, [workflowId, handleResetChat]);

  const getClientSecret = useCallback(
    async (currentSecret: string | null) => {
      if (isDev) {
        console.info("[ChatKitPanel] getClientSecret invoked", {
          currentSecretPresent: Boolean(currentSecret),
          workflowId,
          endpoint: CREATE_SESSION_ENDPOINT,
        });
      }

      if (!isWorkflowConfigured) {
        const detail = missingWorkflowMessage;
        if (isMountedRef.current) {
          setErrorState({ session: detail, retryable: false });
          setIsInitializingSession(false);
        }
        throw new Error(detail);
      }

      if (isMountedRef.current) {
        if (!currentSecret) {
          setIsInitializingSession(true);
        }
        setErrorState({ session: null, integration: null, retryable: false });
      }

      try {
        const response = await fetch(CREATE_SESSION_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workflow: { id: workflowId },
            knowledgeBaseId,
            chatkit_configuration: {
              // enable attachments
              file_upload: {
                enabled: true,
              },
            },
          }),
        });

        const raw = await response.text();

        if (isDev) {
          console.info("[ChatKitPanel] createSession response", {
            status: response.status,
            ok: response.ok,
            bodyPreview: raw.slice(0, 1600),
          });
        }

        let data: Record<string, unknown> = {};
        if (raw) {
          try {
            data = JSON.parse(raw) as Record<string, unknown>;
          } catch (parseError) {
            console.error(
              "Failed to parse create-session response",
              parseError
            );
          }
        }

        if (!response.ok) {
          const detail = formatFriendlyErrorMessage(
            extractErrorDetail(data, response.statusText)
          );
          console.error("Create session request failed", {
            status: response.status,
            body: data,
          });
          throw new Error(detail);
        }

        const clientSecret = data?.client_secret as string | undefined;
        if (!clientSecret) {
          throw new Error("Missing client secret in response");
        }

        if (isMountedRef.current) {
          setErrorState({ session: null, integration: null });
        }

        if (isDev) {
          console.info("[ChatKitPanel] Client secret obtained, waiting for widget to initialize...");
        }

        // Set a timeout to detect if widget never initializes
        if (!currentSecret && isMountedRef.current) {
          // Clear any existing timeout
          if (initTimeoutRef.current) {
            window.clearTimeout(initTimeoutRef.current);
          }

          initTimeoutRef.current = window.setTimeout(() => {
            if (isMountedRef.current && isInitializingSession) {
              console.error("[ChatKitPanel] Widget initialization timeout - possible domain allowlist issue");
              setErrorState({
                integration: "ChatKit failed to initialize. Please ensure http://localhost:3000 is added to your domain allowlist at https://platform.openai.com/settings/organization/security/domain-allowlist",
                retryable: true
              });
              setIsInitializingSession(false);
            }
          }, 15000); // 15 second timeout
        }

        return clientSecret;
      } catch (error) {
        console.error("Failed to create ChatKit session", error);
        const detail = formatFriendlyErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to start ChatKit session."
        );
        if (isMountedRef.current) {
          setErrorState({ session: detail, retryable: false });
          setIsInitializingSession(false);
        }
        throw error instanceof Error ? error : new Error(detail);
      }
    },
    [isWorkflowConfigured, setErrorState, workflowId, knowledgeBaseId]
  );

  const chatkit = useChatKit({
    api: { getClientSecret },
    theme: {
      colorScheme: theme,
      ...getThemeConfig(theme),
    },
    startScreen: {
      greeting: GREETING,
      prompts: STARTER_PROMPTS,
    },
    composer: {
      placeholder: PLACEHOLDER_INPUT,
      attachments: {
        // Enable attachments
        enabled: true,
      },
    },
    threadItemActions: {
      feedback: false,
    },
    onClientTool: async (invocation: {
      name: string;
      params: Record<string, unknown>;
    }) => {
      if (invocation.name === "switch_theme") {
        const requested = invocation.params.theme;
        if (requested === "light" || requested === "dark") {
          if (isDev) {
            console.debug("[ChatKitPanel] switch_theme", requested);
          }
          onThemeRequest(requested);
          return { success: true };
        }
        return { success: false };
      }

      if (invocation.name === "record_fact") {
        const id = String(invocation.params.fact_id ?? "");
        const text = String(invocation.params.fact_text ?? "");
        if (!id || processedFacts.current.has(id)) {
          return { success: true };
        }
        processedFacts.current.add(id);
        void onWidgetAction({
          type: "save",
          factId: id,
          factText: text.replace(/\s+/g, " ").trim(),
        });
        return { success: true };
      }

      return { success: false };
    },
    onResponseEnd: () => {
      onResponseEnd();
    },
    onResponseStart: () => {
      // Widget is ready and able to process responses
      if (isDev) {
        console.info("[ChatKitPanel] Widget is ready - first response started");
      }
      // Clear initialization timeout since widget is working
      if (initTimeoutRef.current) {
        window.clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = undefined;
      }
      if (isMountedRef.current) {
        setIsInitializingSession(false);
        setErrorState({ integration: null, retryable: false });
      }
    },
    onThreadChange: () => {
      processedFacts.current.clear();
      // Widget successfully loaded if thread change occurs
      if (isDev) {
        console.info("[ChatKitPanel] Thread changed - widget is functional");
      }
      if (initTimeoutRef.current) {
        window.clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = undefined;
      }
      if (isMountedRef.current && isInitializingSession) {
        setIsInitializingSession(false);
      }
    },
    onError: ({ error }: { error: unknown }) => {
      // Note that Chatkit UI handles errors for your users.
      // Thus, your app code doesn't need to display errors on UI.
      console.error("[ChatKitPanel] ChatKit error", error);
      if (initTimeoutRef.current) {
        window.clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = undefined;
      }
      if (isMountedRef.current) {
        const message = formatFriendlyErrorMessage(
          error instanceof Error
            ? error.message
            : "ChatKit initialization failed"
        );
        setErrorState({
          integration: message,
          retryable: true,
        });
        setIsInitializingSession(false);
      }
    },
  });

  // Detect when ChatKit control becomes available (widget initialized)
  useEffect(() => {
    if (chatkit.control && isInitializingSession && isMountedRef.current) {
      if (isDev) {
        console.info("[ChatKitPanel] ChatKit control detected - widget initialized");
      }
      // Clear timeout since widget is ready
      if (initTimeoutRef.current) {
        window.clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = undefined;
      }
      setIsInitializingSession(false);
    }
  }, [chatkit.control, isInitializingSession]);

  const activeError = errors.session ?? errors.integration;
  const blockingError = errors.script ?? activeError;

  if (isDev) {
    console.debug("[ChatKitPanel] render state", {
      isInitializingSession,
      hasControl: Boolean(chatkit.control),
      scriptStatus,
      hasError: Boolean(blockingError),
      workflowId,
    });
  }

  return (
    <div className="relative pb-8 flex h-[90vh] w-full rounded-2xl flex-col overflow-hidden bg-white shadow-sm transition-colors dark:bg-slate-900">
      <ChatKit
        key={widgetInstanceKey}
        control={chatkit.control}
        className={
          blockingError || isInitializingSession
            ? "pointer-events-none opacity-0"
            : "block h-full w-full"
        }
      />
      <ErrorOverlay
        error={blockingError}
        fallbackMessage={
          blockingError || !isInitializingSession
            ? null
            : "Loading assistant session..."
        }
        onRetry={blockingError && errors.retryable ? handleResetChat : null}
        retryLabel="Restart chat"
      />
      {isDev && isInitializingSession && !blockingError && (
        <div className="absolute bottom-4 left-4 bg-blue-500/90 text-white text-xs px-3 py-2 rounded-md shadow-lg font-mono">
          <div>Initializing ChatKit...</div>
          <div className="mt-1 text-blue-100">
            Workflow: {workflowId.slice(0, 20)}...
          </div>
          <div className="mt-1 text-blue-100">
            Control: {chatkit.control ? "✓" : "waiting..."}
          </div>
          <div className="mt-1 text-blue-100">
            Script: {scriptStatus}
          </div>
        </div>
      )}
    </div>
  );
}

function extractErrorDetail(
  payload: Record<string, unknown> | undefined,
  fallback: string
): string {
  if (!payload) {
    return fallback;
  }

  const error = payload.error;
  if (typeof error === "string") {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  const details = payload.details;
  if (typeof details === "string") {
    return details;
  }

  if (details && typeof details === "object" && "error" in details) {
    const nestedError = (details as { error?: unknown }).error;
    if (typeof nestedError === "string") {
      return nestedError;
    }
    if (
      nestedError &&
      typeof nestedError === "object" &&
      "message" in nestedError &&
      typeof (nestedError as { message?: unknown }).message === "string"
    ) {
      return (nestedError as { message: string }).message;
    }
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  return fallback;
}

function formatFriendlyErrorMessage(detail: string): string {
  if (!detail) {
    return "Unexpected error occurred. Please try again.";
  }

  const normalized = detail.toLowerCase();
  const isRateLimit =
    normalized.includes("rate limit") ||
    normalized.includes("limit reached") ||
    normalized.includes("too many requests");

  if (isRateLimit) {
    return `OpenAI rate limit reached. Please wait about a minute and try again.\n(${detail})`;
  }

  return detail;
}
