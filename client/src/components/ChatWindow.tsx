

import React, { useState, useRef, useEffect } from "react";
import Header from "./Header";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import TypingIndicator from "./TypingIndicator";



const BASE_URL = "https://ss-chatbot-service-431223872160.asia-southeast1.run.app";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  // optional structured table data parsed from API responses
  table?: Array<Record<string, any>>;
}

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasUserMessages = messages.some((msg) => msg.sender === "user");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    
 console.log(content);
    try {
      const response = await fetch(`${BASE_URL}/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: content,
      });

      console.log(response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      let data: string;

      if (contentType?.includes("application/json")) {
        const jsonData = await response.json();

        
        if (
          jsonData &&
          (jsonData.msg === "Success" || jsonData.data) &&
          typeof jsonData.data === "string"
        ) {
          
          try {
            const parsed = JSON.parse(jsonData.data);
            if (Array.isArray(parsed)) {
              data = ""; 
              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "",
                sender: "assistant",
                timestamp: new Date(),
                table: parsed,
              };

              setMessages((prev) => [...prev, assistantMessage]);
              setIsTyping(false);
              return;
            }
          } catch (e) {
            
            data = JSON.stringify(jsonData);
          }
        }

       
        data = jsonData.reply || JSON.stringify(jsonData);
      } else {
        data = await response.text();
      }

      
      await new Promise((res) => setTimeout(res, 500));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: `Error: ${error.message || "Please try again."}`,
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  
  const handleSummarize = async (message: Message) => {
    try {
      setSummarizingId(message.id);

      let body: string;
      let contentType = "text/plain";

      if (message.table && message.table.length > 0) {
        body = JSON.stringify(message.table);
        contentType = "application/json";
      } else {
        body = message.content || "";
        contentType = "text/plain";
      }

      const resp = await fetch(`${BASE_URL}/generate_summary/`, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body,
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const html = await resp.text();

    
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err: any) {
      console.error("Error generating summary:", err);
      alert(`Failed to generate summary: ${err?.message || err}`);
    } finally {
      setSummarizingId(null);
    }
  };

  if (!hasUserMessages) {
    return (
      <div className="flex flex-col h-screen max-w-full mx-auto bg-white shadow-lg">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-center mb-12 max-w-3xl">
            <img
              src="/images/logo.jpeg"
              alt="StratSync Logo"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to StratSync
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Your AI co-pilot for customer success and growth. Ask me anything to get started!
            </p>
          </div>
          <div className="w-full max-w-3xl">
            <InputBar
              onSendMessage={handleSendMessage}
              isDisabled={isTyping}
              isCentered
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-full mx-auto bg-white shadow-lg">
      <Header />
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSummarize={() => handleSummarize(message)}
              isSummarizing={summarizingId === message.id}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <InputBar onSendMessage={handleSendMessage} isDisabled={isTyping} />
    </div>
  );
};

export default ChatWindow;
