"use client";
import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, Sparkles, CheckCircle2, AlertCircle, Send, Languages, MapPin } from "lucide-react";

const SCENARIOS = [
  "IT Job Interview (Amaravati / Vizag)",
  "Office Team Meeting & Updates",
  "Everyday Spoken English",
  "College Seminar & Self-Intro"
];

export default function AmaravatiSpeakTutor() {
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [nativeLang, setNativeLang] = useState("Telugu");
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      reply: "Namaskaram! I am Kavya, your personal English coach for Amaravati Speak AI. Tell me about yourself and your career goals!",
      nativeExplanation: "నమస్కారం! నేను కావ్య, అమరావతి స్పీక్ AI కోచ్‌ని. మీ గురించి మరియు మీ కెరీర్ లక్ష్యాల గురించి ఇంగ్లీష్‌లో చెప్పండి!"
    }
  ]);

  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-IN";
        recognition.interimResults = false;
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          handleSend(transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, [scenario, nativeLang, messages]);

  const speakText = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition works best in Google Chrome or Microsoft Edge!");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = async (overrideText) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || loading) return;

    setErrorMsg("");
    const userMsg = { role: "user", content: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const historyForApi = updatedMessages.map((m) => ({
        role: m.role,
        content: m.role === "user" ? m.content : m.reply
      }));

      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyForApi,
          scenario,
          nativeLang
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Something went wrong connecting to the AI.");
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", ...data }]);
      if (data.reply) speakText(data.reply);
    } catch (err) {
      setErrorMsg("Network error. Please check your local server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white">Amaravati Speak AI</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <MapPin className="w-3 h-3" /> AP Edition
              </span>
            </div>
            <p className="text-xs text-slate-400">Telugu-to-English Spoken AI Coach • Powered by Kavya</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5">
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs sm:text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {SCENARIOS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm">
            <Languages className="w-4 h-4 text-amber-400" />
            <select
              value={nativeLang}
              onChange={(e) => setNativeLang(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none"
            >
              <option value="Telugu" className="bg-slate-900">Telugu</option>
              <option value="English" className="bg-slate-900">Simple English</option>
              <option value="Hindi" className="bg-slate-900">Hindi</option>
            </select>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {errorMsg && (
        <div className="max-w-3xl w-full mx-auto mt-4 px-4">
          <div className="bg-rose-950/70 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="text-xs underline ml-4">Dismiss</button>
          </div>
        </div>
      )}

      {/* Conversation Feed */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            {msg.role === "user" ? (
              <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-md shadow">
                <p className="text-sm sm:text-base">{msg.content}</p>
              </div>
            ) : (
              <div className="space-y-3 max-w-xl w-full">
                {msg.correctedSentence && (
                  <div className={`p-3.5 rounded-xl border text-sm ${
                    msg.hasMistake
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-100"
                      : "bg-emerald-950/40 border-emerald-500/40 text-emerald-100"
                  }`}>
                    <div className="flex items-center gap-2 font-semibold mb-1">
                      {msg.hasMistake ? (
                        <><AlertCircle className="w-4 h-4 text-amber-400" /> Better English Phrasing:</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Natural & Fluent!</>
                      )}
                    </div>
                    <p className="font-medium text-white mb-2">"{msg.correctedSentence}"</p>
                    {msg.nativeExplanation && (
                      <p className="text-xs sm:text-sm text-slate-200 bg-slate-900/80 p-2.5 rounded-lg leading-relaxed">
                        {msg.nativeExplanation}
                      </p>
                    )}
                  </div>
                )}

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-sm shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-slate-100 text-sm sm:text-base leading-relaxed">{msg.reply}</p>
                    <button
                      onClick={() => speakText(msg.reply)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 shrink-0"
                      title="Listen to Kavya"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  {!msg.correctedSentence && msg.nativeExplanation && (
                    <p className="mt-2.5 text-xs sm:text-sm text-amber-200/90 border-t border-slate-800 pt-2.5 leading-relaxed">
                      {msg.nativeExplanation}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-amber-400 animate-pulse">Kavya is analyzing your English...</div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input Bar */}
      <footer className="border-t border-slate-800 bg-slate-900 p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={toggleMic}
            className={`p-4 rounded-full transition-all shadow-lg shrink-0 ${
              isListening
                ? "bg-rose-600 animate-pulse text-white"
                : "bg-gradient-to-tr from-amber-500 to-indigo-600 hover:opacity-90 text-white"
            }`}
            title="Tap to Speak"
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isListening ? "Listening... Speak in English now!" : "Tap the mic to speak, or type in English..."}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />

          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-400"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}