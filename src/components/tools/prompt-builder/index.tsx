"use client";

import { createContext, useContext } from "react";
import { usePromptLogic } from "./use-prompt-logic";
import type { ToolPromptsProps } from "./use-prompt-logic";
import { ToolWrapper } from "@/components/tools/tool-wrapper";
import { IslandToolbar, StickyBottomBar } from "./island-toolbar";
import { LeftConfig } from "./left-config";
import { RightWorkspace } from "./right-workspace";

export type PromptStore = ReturnType<typeof usePromptLogic>;

export const PromptContext = createContext<PromptStore | null>(null);

export function usePrompt() {
  const ctx = useContext(PromptContext);
  if (!ctx) throw new Error("Missing PromptProvider. Component must be wrapped in it.");
  return ctx;
}

export function PromptBuilder(props: ToolPromptsProps) {
  const store = usePromptLogic(props);

  return (
    <PromptContext.Provider value={store}>
      <ToolWrapper
        title={props.dictionary.title}
        description={props.dictionary.description}
        dictionary={props.fullDictionary}
        isPublic={true}
      >
        <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-32">
          {/* TOP ISLAND TOOLBAR */}
          <div className="sticky top-20 z-40 mb-6 w-full">
            <IslandToolbar />
          </div>

          {/* TWO-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 xl:gap-8">
            <div className="lg:col-span-5 xl:col-span-4">
              <LeftConfig />
            </div>

            <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
              <RightWorkspace />
            </div>
          </div>

          <StickyBottomBar />
        </div>
      </ToolWrapper>
    </PromptContext.Provider>
  );
}
