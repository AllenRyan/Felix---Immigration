"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatKitPanel, type FactAction } from "@/components/ChatKitPanel";
import { AppSidebar } from "@/components/AppSidebar";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { useColorScheme } from "@/hooks/useColorScheme";
import { WORKFLOW_ID, WORKFLOW_OPTIONS, getWorkflowByKnowledgeBase, type Conversation } from "@/lib/config";

export default function App() {
  const { scheme, setScheme } = useColorScheme();
  const [workflowId, setWorkflowId] = useState(WORKFLOW_ID);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [activeKnowledgeBase, setActiveKnowledgeBase] = useState<string | null>(null);

  const handleWidgetAction = useCallback(async (action: FactAction) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[ChatKitPanel] widget action", action);
    }
  }, []);

  const handleResponseEnd = useCallback(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[ChatKitPanel] response end");
    }
  }, []);

  const handleNewConversation = useCallback(() => {
    // Create a new conversation
    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      title: "New Conversation",
      timestamp: new Date(),
      workflowId: WORKFLOW_OPTIONS[0]?.id ?? WORKFLOW_ID,
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setWorkflowId(newConversation.workflowId ?? WORKFLOW_ID);
    setShowChat(true);
  }, []);

  const handleConversationSelect = useCallback((id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (conversation) {
      setActiveConversationId(id);
      setWorkflowId(conversation.workflowId ?? WORKFLOW_ID);
      setShowChat(true);
    }
  }, [conversations]);

  const handleDeleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setShowChat(false);
    }
  }, [activeConversationId]);

  const handleKnowledgeBaseSelect = useCallback((knowledgeBaseId: string) => {
    // Map knowledge base to workflow
    const workflow = getWorkflowByKnowledgeBase(knowledgeBaseId);
    if (!workflow) {
      console.error(`Cannot find workflow for knowledge base: ${knowledgeBaseId}`);
      return;
    }

    // Always create new conversation (like home screen does)
    if (process.env.NODE_ENV !== "production") {
      console.log("[App] Creating new conversation for", knowledgeBaseId, {
        workflowId: workflow.id
      });
    }

    const kbTitles: Record<string, string> = {
      "past-assessments": "PAST ASSESSMENTS",
      "visa-regulations": "VISA REGULATIONS",
      "legal-precedents": "LEGAL PRECEDENTS",
      "general-visa-info": "GENERAL VISA INFO",
    };

    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      title: kbTitles[knowledgeBaseId] || "New Conversation",
      timestamp: new Date(),
      workflowId: workflow.id,
    };

    setActiveKnowledgeBase(knowledgeBaseId);
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setWorkflowId(workflow.id);
    setShowChat(true);
  }, []);

  const handleActionClick = useCallback((actionId: string) => {
    // Action cards map directly to knowledge bases
    handleKnowledgeBaseSelect(actionId);
  }, [handleKnowledgeBaseSelect]);

  const handleThemeToggle = useCallback(() => {
    setScheme(scheme === "dark" ? "light" : "dark");
  }, [scheme, setScheme]);

  const handleBackToHome = useCallback(() => {
    setShowChat(false);
    setActiveKnowledgeBase(null);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[App] Conversation history updated", conversations);
    }
  }, [conversations]);

  const configuredWorkflows = WORKFLOW_OPTIONS;
  const selectedWorkflow =
    configuredWorkflows.find((option) => option.id === workflowId) ??
    configuredWorkflows[0];

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950">
      {/* Sidebar */}
      <AppSidebar
        theme={scheme}
        onThemeToggle={handleThemeToggle}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {!showChat ? (
          <WelcomeScreen onActionClick={handleActionClick} />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Header with Back Button */}
            <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={handleBackToHome}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Back to home"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Home
              </button>
              {activeKnowledgeBase && (
                <div className="flex-1">
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {activeKnowledgeBase === "past-assessments" && "Past Assessments"}
                    {activeKnowledgeBase === "visa-regulations" && "Visa Regulations"}
                    {activeKnowledgeBase === "legal-precedents" && "Legal Precedents"}
                    {activeKnowledgeBase === "general-visa-info" && "General Visa Info"}
                  </h1>
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-6 overflow-hidden">
              <div className="h-full max-w-6xl mx-auto">
                <ChatKitPanel
                  key={`${activeConversationId ?? "default"}-${activeKnowledgeBase ?? "none"}`}
                  workflowId={selectedWorkflow?.id ?? workflowId}
                  knowledgeBaseId={activeKnowledgeBase}
                  theme={scheme}
                  onWidgetAction={handleWidgetAction}
                  onResponseEnd={handleResponseEnd}
                  onThemeRequest={setScheme}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
