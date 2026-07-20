"use client";

import * as React from "react";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";
import { api } from "@/lib/api";

const GAP_ID_PATTERN = /\bgap-\d+\b/g;

function renderAnswer(content: string) {
  const parts = content.split(GAP_ID_PATTERN);
  const matches = content.match(GAP_ID_PATTERN) ?? [];
  const nodes: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    nodes.push(<React.Fragment key={`t-${i}`}>{part}</React.Fragment>);
    if (matches[i]) {
      nodes.push(
        <a
          key={`m-${i}`}
          href={`#${matches[i]}`}
          className="font-medium text-primary underline underline-offset-2"
        >
          {matches[i]}
        </a>
      );
    }
  });
  return nodes;
}

export function ChatDrawer({
  sessionId,
  suggestedQuestions,
}: {
  sessionId: string;
  suggestedQuestions: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      api.getChatHistory(sessionId).then(setMessages);
    }
  }, [open, sessionId]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(question: string) {
    if (!question.trim() || sending) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question, created_at: new Date().toISOString() },
    ]);
    try {
      const { answer } = await api.sendChatMessage(sessionId, question);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: answer, created_at: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            className="fixed bottom-20 right-4 z-30 size-12 rounded-full shadow-lg md:bottom-6 md:right-6"
            size="icon"
          >
            <MessageCircle className="size-5" />
          </Button>
        }
      />
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-primary" />
            Ask about this analysis
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-4">
          {messages.length === 0 && (
            <p className="mb-4 text-sm text-muted-foreground">
              Grounded only in this session&apos;s stored analysis — I won&apos;t re-run agents or
              analyze new data. Try one of these:
            </p>
          )}
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {m.role === "assistant" ? renderAnswer(m.content) : m.content}
              </div>
            ))}
            {sending && (
              <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                Thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="flex flex-wrap gap-1.5 border-t px-4 py-2.5">
          {suggestedQuestions.slice(0, 3).map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={sending}
              className="rounded-full border bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
