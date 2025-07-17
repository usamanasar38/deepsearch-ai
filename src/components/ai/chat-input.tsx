"use client";

import {
  AIInput,
  AIInputSubmit,
  AIInputSubmitProps,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "@/components/ui/kibo-ui/ai/input";
import { ChatRequestOptions } from "ai";

type ChatInputProps = {
  value: string;
  status: AIInputSubmitProps["status"];
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
};

export const ChatInput = ({
  value,
  status,
  handleInputChange,
  handleSubmit,
}: ChatInputProps) => {
  return (
    <AIInput className="mx-auto max-w-2xl" onSubmit={handleSubmit}>
      <AIInputTextarea autoFocus onChange={handleInputChange} value={value} />
      <AIInputToolbar>
        <AIInputTools>
          {/* <AIInputButton>
                <PlusIcon size={16} />
            </AIInputButton>
            <AIInputButton>
                <MicIcon size={16} />
            </AIInputButton>
            <AIInputButton>
                <GlobeIcon size={16} />
                <span>Search</span>
            </AIInputButton>
            <AIInputModelSelect onValueChange={setModel} value={model}>
                <AIInputModelSelectTrigger>
                <AIInputModelSelectValue />
                </AIInputModelSelectTrigger>
                <AIInputModelSelectContent>
                {models.map((model) => (
                    <AIInputModelSelectItem
                    key={model.id}
                    value={model.id}
                    >
                    {model.name}
                    </AIInputModelSelectItem>
                ))}
                </AIInputModelSelectContent>
            </AIInputModelSelect> */}
        </AIInputTools>
        <AIInputSubmit disabled={!value} status={status} />
      </AIInputToolbar>
    </AIInput>
  );
};
