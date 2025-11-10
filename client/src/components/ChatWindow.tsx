import React, { useState, useRef, useEffect } from "react";
import Header from "./Header";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import TypingIndicator from "./TypingIndicator";

const BASE_URL = "http://136.110.18.214:8000";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
 
  table?: Array<Record<string, any>>;
  originalRequestPayload?: any;
}

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

  const [summaryHtml, setSummaryHtml] = useState<string | null>(null);
  const [summaryBlobUrl, setSummaryBlobUrl] = useState<string | null>(null);
  const [summaryForId, setSummaryForId] = useState<string | null>(null);
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

    console.log("Rohit Query:", content);
    try {
      const response = await fetch(`${BASE_URL}/process_user_query/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: content }),
      });

      console.log("Rohit test", response.status);
      console.log("Rohit Response:", response.json);

      if (!response.ok) {
        
        const errText = await response.text();
        console.error("Server error response:", errText);
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const contentType = response.headers.get("content-type");
      let data: string;

      if (contentType?.includes("application/json")) {
        const jsonData = await response.json();

        // If the API returns a payload with `data` that itself is a JSON string
        // which decodes to an array, treat that as a table response.
        if (
          jsonData &&
          (jsonData.msg === "Success" || jsonData.data) &&
          typeof jsonData.data === "string"
        ) {
          try {
            const parsed = JSON.parse(jsonData.data);
            if (Array.isArray(parsed)) {
              // store the parsed table in the message and also save the response
              // payload so summarizer can access it later
              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "",
                sender: "assistant",
                timestamp: new Date(),
                table: parsed,
                originalRequestPayload: { query: content, response: parsed, raw: jsonData },
              };

              setMessages((prev) => [...prev, assistantMessage]);
              setIsTyping(false);
              return;
            }
          } catch (e) {
            // fall back to stringifying the JSON payload
            data = JSON.stringify(jsonData);
          }
        }

        // Prefer a `reply` field, otherwise stringify the full JSON
        data = jsonData.reply || jsonData.data || JSON.stringify(jsonData);
        // For debugging/consistency, keep the full json in originalRequestPayload
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: typeof data === "string" ? data : JSON.stringify(data),
          sender: "assistant",
          timestamp: new Date(),
          originalRequestPayload: { query: content, response: data, raw: jsonData },
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // non-json response
        data = await response.text();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data,
          sender: "assistant",
          timestamp: new Date(),
          originalRequestPayload: { query: content, response: data },
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
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

      const orig = message.originalRequestPayload;

      const queryStr = orig && typeof orig.query === "string" ? orig.query : message.content || "";

      // Build dataToSend from what we saved on the message when the assistant
      // response arrived. Prefer a saved `response`, then `message.table`, then
      // the message text content, and finally fall back to the original query.
      let dataToSend: any;
      if (orig && orig.response !== undefined) {
        dataToSend = orig.response;
      } else if (message.table && Array.isArray(message.table) && message.table.length > 0) {
        dataToSend = message.table;
      } else if (message.content && message.content.trim() !== "") {
        dataToSend = message.content;
      } else {
        dataToSend = queryStr;
      }

      const payload: any = {
        query: queryStr,
   
        data: typeof dataToSend === "string" ? dataToSend : JSON.stringify(dataToSend),
      };
     console.log("Rohit generate_summary payload:", payload);
      // console.log("Rohit generate_summary request payload:", payload);
      const resp = await fetch(`${BASE_URL}/generate_summary/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

     
     
      const bodyText = await resp.text();
      console.log("Rohit generate_summary raw response:", bodyText);

      if (!resp.ok) {
        console.error("generate_summary server error:", bodyText);
        throw new Error(`HTTP ${resp.status}: ${bodyText}`);
      }

    
      let html = bodyText;
      try {
        const maybeJson = JSON.parse(bodyText);
        if (maybeJson && typeof maybeJson === "object") {
          if (typeof maybeJson.data === "string" && maybeJson.data.trim() !== "") {
            html = maybeJson.data;
            console.log("Rohit generate_summary response data (from json.data):", maybeJson.data);
          } else if (typeof maybeJson.msg === "string") {
            console.log("Rohit generate_summary response msg:", maybeJson.msg);
          }
        }
      } catch (e) {
       
      }

      
      
      try {
       
        html = html.replace(/^```(?:html)?\s*/i, "");
        
        html = html.replace(/\s*```\s*$/i, "");
      } catch (e) {
        
      }

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
     
      if (summaryBlobUrl) {
        try {
          URL.revokeObjectURL(summaryBlobUrl);
        } catch (e) {
          /* ignore */
        }
      }
  setSummaryBlobUrl(url);
  setSummaryHtml(html);
 
  setSummaryForId(message.id);
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
              Your AI co-pilot for customer success and growth. Ask me anything
              to get started!
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
            <div key={message.id}>
              <MessageBubble
                message={message}
                onSummarize={() => handleSummarize(message)}
                isSummarizing={summarizingId === message.id}
              />

              {summaryForId === message.id && summaryHtml && (
                <div className="mt-2 p-1 bg-white border rounded">
                  

                  <iframe
                    title={`summary-${message.id}`}
                    srcDoc={summaryHtml}
                    className="w-full h-[80vh] border-0"

                  />
                </div>
              )}
            </div>
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
