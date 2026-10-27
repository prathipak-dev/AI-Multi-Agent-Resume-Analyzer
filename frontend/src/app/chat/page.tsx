"use client";
import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { MessageSquare, Send, Bot, User, Sparkles, Cpu, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "How can I improve my resume ATS score?",
  "Prepare me for a Full Stack interview",
  "What skills should I learn for AI/ML roles?",
  "How do I negotiate salary as a fresher?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI Career Coach & Mock Interview Simulator powered by Groq AI. I can help you with:\n\n• Resume & ATS optimization tips\n• Mock technical interviews (DSA, System Design)\n• Skill gap analysis and learning roadmaps\n• Career strategy and salary negotiation\n\nWhat would you like to work on today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmapContext, setRoadmapContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load advisor context once for rich answers
  useEffect(() => {
    api.get("/advisor/roadmap")
      .then(res => setRoadmapContext(res.data))
      .catch(() => setRoadmapContext(null));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent | null, promptOverride?: string) => {
    if (e) e.preventDefault();
    const userText = promptOverride || input.trim();
    if (!userText) return;

    const userMsg: Message = { role: "user", content: userText };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // First attempt real Groq AI advisor response
      const chatRes = await api.post("/advisor/chat", { message: userText });
      if (chatRes.data?.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: chatRes.data.reply }]);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback to local contextual response
    }

    try {
      const res = await api.get(`/advisor/roadmap`);
      const data = res.data;


      // Craft personalized response based on question type
      let reply = "";
      const lowerQ = userText.toLowerCase();

      if (lowerQ.includes("interview") || lowerQ.includes("question")) {
        const questions = data.interview_questions || [];
        if (questions.length > 0) {
          const q = questions[Math.floor(Math.random() * questions.length)];
          reply = `📌 **Mock Interview Question — ${q.category || "Technical"}**\n\n**Q: ${q.question}**\n\n**STAR Answer Framework:**\n${q.answer}`;
        } else {
          reply = `Great question about interviews! For ${data.target_domain || "Full Stack"} roles, focus on:\n\n1. **System Design**: Explain your architecture decisions with tradeoffs\n2. **DSA**: Practice LeetCode Medium problems on arrays, graphs, dynamic programming\n3. **Behavioral**: Use the STAR method (Situation, Task, Action, Result)\n4. **Project Deep-dives**: Be ready to explain every line of your resume\n\nWould you like a mock question on a specific topic?`;
        }
      } else if (lowerQ.includes("skill") || lowerQ.includes("learn") || lowerQ.includes("roadmap")) {
        const missing = data.missing_skills || [];
        const roadmap = data.learning_roadmap || [];
        reply = `Based on your profile targeting **${data.target_domain || "Full Stack"} Development**:\n\n🚨 **Priority Skills to Learn:**\n${missing.map((s: string) => `• ${s}`).join("\n") || "• Docker, TypeScript, PostgreSQL"}\n\n📅 **4-Week Roadmap:**\n${roadmap.slice(0, 2).map((w: any) => `**${w.week}**: ${w.topic} — ${w.action}`).join("\n") || "Week 1: FastAPI basics | Week 2: Database integration"}`;
      } else if (lowerQ.includes("resume") || lowerQ.includes("ats")) {
        const suggestions = data.improvement_suggestions || [];
        reply = `💡 **ATS Resume Optimization Tips:**\n\n${suggestions.slice(0, 4).map((s: string, i: number) => `${i + 1}. ${s}`).join("\n") || "1. Add measurable metrics\n2. Include relevant keywords\n3. Quantify achievements\n4. Use standard section headers"}\n\n🎯 Your current ATS score: ${data.skill_gap_score?.toFixed(0) || "–"}% domain match. Upload your resume for a detailed score!`;
      } else if (lowerQ.includes("salary") || lowerQ.includes("negotiate")) {
        reply = `💰 **Salary Negotiation Strategy for Freshers:**\n\n1. **Research market rates**: Use LinkedIn Salary, Glassdoor, Levels.fyi for your target role in your city\n2. **Anchor high**: Start 15-20% above your minimum acceptable\n3. **Justify with skills**: Reference your specific technical stack match to their JD\n4. **Consider total comp**: Base + ESOPs + learning + growth matters more than base alone\n5. **Never accept on the spot**: Always ask for 24-48 hours to review\n\nFor ${data.target_domain || "Full Stack"} roles in India, fresh graduates typically see ₹8-18L LPA depending on skills and company tier.`;
      } else {
        reply = `Thanks for your question about **"${userText}"**!\n\nBased on your ${data.target_domain || "Full Stack"} career path:\n\n${(data.improvement_suggestions || []).slice(0, 2).map((s: string) => `• ${s}`).join("\n") || "• Focus on practical projects\n• Build your GitHub portfolio"}\n\n**Next recommended action**: ${data.learning_roadmap?.[0]?.action || "Start building a full-stack project to demonstrate your skills"}\n\nWould you like more specific advice on any aspect of your career journey?`;
      }

      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      // Offline fallback
      const fallbackReplies: Record<string, string> = {
        default: `Regarding **"${userText}"**: In high-performance engineering roles, recruiters look for:\n\n1. **Quantifiable impact**: "Reduced API latency by 40%" beats "worked on API"\n2. **Tech stack depth**: Show you understand tradeoffs, not just syntax\n3. **System thinking**: Can you design, not just code?\n\nI can help you prepare mock interview questions, review your resume strategy, or build a learning roadmap. What would be most useful?`
      };
      setMessages(prev => [...prev, { role: "assistant", content: fallbackReplies.default }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Chat cleared! I'm ready to help you with career coaching, interview prep, or skill gap analysis. What would you like to explore?"
    }]);
  };

  return (
    <AuthGuard>
    <div className="flex min-h-[calc(100vh-73px)]">
      <Sidebar />
      <div className="flex-1 p-6 md:p-8 flex flex-col h-[calc(100vh-73px)] overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-indigo-400" /> AI Career Coach & Mock Interview Chatbot
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Real-time interactive career guidance powered by Groq Llama-3.3-70b.
              {roadmapContext && (
                <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                  ✓ Profile loaded: {roadmapContext.target_domain}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={clearChat}
            className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-200 glass-card border border-gray-800 flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Clear
          </button>
        </div>

        {/* Starter Prompts */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(null, prompt)}
                className="px-3 py-1.5 text-xs rounded-xl glass-card border border-indigo-500/20 text-indigo-300 hover:border-indigo-500/50 hover:text-indigo-200 transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Chat Stream Container */}
        <div className="flex-1 glass-card p-6 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">
          <div className="space-y-4 overflow-y-auto pr-2 flex-1">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-lg gradient-button flex items-center justify-center text-white shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl max-w-2xl whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-surface/80 border border-gray-800 text-gray-200 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-lg bg-surfaceHover border border-gray-700 flex items-center justify-center text-gray-300 shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 text-xs text-indigo-400 items-center">
                <Cpu className="h-4 w-4 animate-spin" /> AI Career Coach is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="mt-4 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for interview prep, resume suggestions, salary advice, or career tips..."
              className="flex-1 bg-surface border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="gradient-button text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}

