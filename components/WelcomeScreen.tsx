"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTION_CARDS } from "@/lib/config";
import { FileText, Globe, Scale, Info } from "lucide-react";

const iconMap = {
  "file-text": FileText,
  globe: Globe,
  scale: Scale,
  info: Info,
};

const iconColorMap = {
  "file-text": "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  globe: "text-green-600 bg-green-50 dark:bg-green-950/30",
  scale: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
  info: "text-orange-600 bg-orange-50 dark:bg-orange-950/30",
};

type WelcomeScreenProps = {
  onActionClick: (actionId: string) => void;
};

export function WelcomeScreen({ onActionClick }: WelcomeScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 bg-white dark:bg-slate-950">
      {/* Welcome Header */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white">
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Welcome to Inspra AI
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Select a knowledge base to get started
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
        {ACTION_CARDS.map((action) => {
          const Icon = iconMap[action.icon as keyof typeof iconMap] || Info;
          const iconColorClass = iconColorMap[action.icon as keyof typeof iconColorMap];

          return (
            <Card
              key={action.id}
              className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              onClick={() => onActionClick(action.id)}
            >
              <CardHeader>
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${iconColorClass} mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">{action.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                  {action.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Text */}
      <p className="mt-12 text-center text-xs text-slate-500 dark:text-slate-400">
        Select a knowledge base above to start your conversation
      </p>
    </div>
  );
}
