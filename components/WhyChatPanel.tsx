"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  MessageSquare,
  BookOpen
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface WhyChatPanelProps {
  fullPageView?: boolean;
}

export default function WhyChatPanel({ fullPageView = false }: WhyChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial",
      role: "assistant",
      content:
        "Hello! I am your Campus OS Risk Intelligence Assistant. I have complete grounded context on your timetable, deadlines, attendance ledger, and the Demo Institute of Technology policy circular (2026).\n\nYou can ask me why any risk was flagged, how specific circular clauses apply, or test any hypothetical scenario live.",
      createdAt: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presets = [
    {
      title: "Why did my risk score rise to 75?",
      prompt: "Why is my current academic risk score calculated at 75? Break down the exact contributing factors."
    },
    {
      title: "Hackathon attendance rules",
      prompt: "What are the exact institutional policy rules for hackathon attendance condonation under Section 2?"
    },
    {
      title: "Late assignment penalties",
      prompt: "What penalties apply if I submit my DBMS assignment 24 to 48 hours past the deadline?"
    },
    {
      title: "Internal assessment minimum marks",
      prompt: "What are the minimum marks required in internal assessments to remain eligible for end-semester exams?"
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      createdAt: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get reply from agent");
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        createdAt: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      setError(err.message || "Failed to reach risk agent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${fullPageView ? "max-w-5xl mx-auto" : ""}`}>
      {/* Top Banner if Full Page */}
      {fullPageView && (
        <div className="card-panel-elevated rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-mono font-bold">
              <MessageSquare className="w-3.5 h-3.5" />
              LIVE WHY-CHAT & POLICY CONSULTATION
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Interrogate Risk Decisions & Regulations
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Ask any question about your risk score, debarment criteria, attendance condonation, or upcoming deadlines. Gemini reasons live using verified policy context.
            </p>
          </div>
          <div className="w-full md:w-64 h-36 rounded-2xl overflow-hidden border border-slate-200 relative flex-shrink-0 shadow-sm">
            <img
              src="/assets/policy_rag_vault.jpg"
              alt="Policy Vault"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Main Chat Suite */}
      <div
        className={`card-panel-elevated rounded-3xl p-6 sm:p-8 flex flex-col relative overflow-hidden ${
          fullPageView ? "h-[650px]" : "h-[540px]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight">
                Live "Why" Interrogation Console
              </h2>
              <p className="text-xs font-mono text-slate-500">
                GEMINI 3.6 FLASH // CONTINUOUS POLICY GROUNDED SESSION
              </p>
            </div>
          </div>

          <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Policy Engine Online
          </span>
        </div>

        {/* Messages Thread Container */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 font-sans text-xs sm:text-sm">
          {messages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs ${
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-indigo-700 border border-slate-200"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] p-4 rounded-2xl leading-relaxed shadow-xs ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-tr-none font-medium"
                      : "bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-none font-normal"
                  }`}
                >
                  <p className="whitespace-pre-line text-xs sm:text-sm">{msg.content}</p>
                  <span
                    className={`block text-[10px] mt-2 text-right ${
                      isUser ? "text-indigo-200" : "text-slate-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Loading Bubble */}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-indigo-700 border border-slate-200 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-2.5 rounded-tl-none text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Investigating institutional policies & reasoning live...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompt Pills */}
        <div className="py-3 flex flex-wrap gap-2 border-t border-slate-200">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(preset.prompt)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-900 border border-slate-200 hover:border-indigo-200 transition-all truncate max-w-[320px] cursor-pointer disabled:opacity-50"
            >
              {preset.title}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <div className="pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask why a risk was flagged, or query any college policy clause..."
              className="w-full pl-4 pr-24 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50 shadow-xs"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-xs hover:scale-[1.02]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
