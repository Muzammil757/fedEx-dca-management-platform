"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  FileText,
  Clock,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
}

const suggestedQuestions = [
  "What are the high-risk accounts this month?",
  "Show me cases approaching SLA breach",
  "What's the recovery probability for Acme Logistics?",
  "Suggest strategies for negotiation cases",
];

export function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your Recovery Intelligence Assistant. I can analyze your portfolio data and provide AI-driven suggestions for debt recovery. Ask me about high-risk accounts, SLA breaches, recovery strategies, or any case-specific insights.",
      timestamp: new Date(),
      sources: ["Knowledge Base: Recovery Strategies", "Case Database"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate RAG response (in production, this would call backend API)
    setTimeout(() => {
      const responses: Record<string, { content: string; sources: string[] }> = {
        "high-risk": {
          content: "Based on current portfolio analysis, here are the high-risk accounts:\n\n1. **FastTrack Deliveries** - $234,000 - 42% recovery probability\n2. **Harbor Logistics** - $98,700 - 61% recovery probability\n3. **Metro Express** - $156,000 - 38% recovery probability\n\nThese accounts show declining payment patterns and require immediate intervention.",
          sources: ["Case Database", "Risk Analysis Model", "Payment History"],
        },
        "sla": {
          content: "Currently tracking 312 cases at SLA breach risk. Key pressure points:\n\n• Negotiation Stage: 14 cases exceeding 14-day average\n• Payment Plan Stage: 8 cases at critical threshold\n• Legal Review: 3 cases approaching 20-day limit\n\nRecommended actions: Immediate escalation for 5 cases in negotiation stage.",
          sources: ["SLA Monitoring System", "Workflow Analytics"],
        },
        "strategy": {
          content: "AI-suggested strategies for negotiation cases:\n\n1. **Structured Settlement Offer** - Propose 15% upfront payment with extended terms\n2. **Multi-tiered Payment Plan** - Based on historical recovery rates for similar accounts\n3. **Escalation Protocol** - Move to legal review if no response within 72 hours\n\nCurrent success rate with AI-suggested strategies: 68%",
          sources: ["Recovery Strategy Database", "Historical Outcome Analysis"],
        },
      };

      let responseContent = "I can help you analyze recovery cases, identify risks, and suggest strategies. Try asking about high-risk accounts, SLA status, or recovery recommendations.";
      let responseSources = ["Knowledge Base"];

      const lowerInput = input.toLowerCase();
      if (lowerInput.includes("high-risk") || lowerInput.includes("risk")) {
        responseContent = responses["high-risk"].content;
        responseSources = responses["high-risk"].sources;
      } else if (lowerInput.includes("sla") || lowerInput.includes("breach")) {
        responseContent = responses["sla"].content;
        responseSources = responses["sla"].sources;
      } else if (lowerInput.includes("strategy") || lowerInput.includes("suggestion")) {
        responseContent = responses["strategy"].content;
        responseSources = responses["strategy"].sources;
      } else if (lowerInput.includes("acme") || lowerInput.includes("logistics")) {
        responseContent = "**Acme Logistics Corp** (DCA-2024-3847)\n\n• Amount: $125,000\n• Recovery Probability: 78%\n• Risk Factors: Market downturn, Payment delay history\n• AI Suggestion: Propose structured 15% settlement\n• Estimated Resolution: 14 days\n\nThis case has a favorable recovery probability. Consider prioritizing for immediate action.";
        responseSources = ["Case Database", "AI Prediction Model"];
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
        sources: responseSources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
  };

  return (
    <Card className="bg-white border-[#2563EB] shadow-sm h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-[#2563EB]" style={{ backgroundColor: "#F8FAFC" }}>
        <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: "#0F172A" }}>
          <Bot className="h-5 w-5" style={{ color: "#2563EB" }} />
          Recovery Intelligence Assistant
        </CardTitle>
        <p className="text-xs" style={{ color: "#334155" }}>
          RAG-powered AI for portfolio insights & recommendations
        </p>
      </CardHeader>

      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback
                    className={
                      message.role === "user"
                        ? "bg-[#F8FAFC] text-[#2563EB]"
                        : "bg-[#2563EB] text-white"
                    }
                    style={{ border: message.role === "user" ? "1px solid #2563EB" : "none" }}
                  >
                    {message.role === "user" ? "U" : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[80%] space-y-2 ${
                    message.role === "user" ? "text-right" : ""
                  }`}
                >
                  <div
                    className={`inline-block px-4 py-2 rounded-2xl text-sm ${
                      message.role === "user"
                        ? "bg-[#2563EB] text-white"
                        : "bg-[#F8FAFC] text-[#0F172A]"
                    }`}
                  >
                    {message.content.split("\n").map((line, i) => (
                      <p key={i} className={line.startsWith("•") || line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("**") ? "text-left" : ""}>
                        {line}
                      </p>
                    ))}
                  </div>
                  {message.sources && message.role === "assistant" && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] flex items-center gap-1" style={{ color: "#334155" }}>
                        <Sparkles className="h-3 w-3" style={{ color: "#2563EB" }} /> Sources:
                      </span>
                      {message.sources.map((source, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[9px] font-medium bg-[#F8FAFC] border-[#2563EB]/20"
                          style={{ color: "#2563EB" }}
                        >
                          {source}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-[#2563EB] text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-[#F8FAFC] px-4 py-3 rounded-2xl flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#2563EB" }} />
                  <span className="text-sm" style={{ color: "#334155" }}>
                    Analyzing portfolio data...
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {messages.length <= 2 && (
          <div className="px-4 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#334155" }}>
              Suggested Questions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium bg-white"
                  style={{ color: "#2563EB", borderColor: "#2563EB" }}
                  onClick={() => handleQuestionClick(question)}
                >
                  <MessageSquare className="h-3 w-3 mr-1.5" style={{ color: "#2563EB" }} />
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-[#2563EB]" style={{ backgroundColor: "#F8FAFC" }}>
          <div className="flex gap-2">
            <Input
              placeholder="Ask about cases, risks, or strategies..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="text-white"
              style={{ backgroundColor: "#2563EB" }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#1d4ed8"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2563EB"}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
