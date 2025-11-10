import React from "react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  table?: Array<Record<string, any>>;
 
  originalRequestPayload?: any;
}

interface MessageBubbleProps {
  message: Message;
  
  onSummarize?: () => void;
  
  isSummarizing?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSummarize, isSummarizing }) => {
  const isUser = message.sender === "user";

  const renderTable = (rows: Array<Record<string, any>>) => {
    if (!rows || rows.length === 0) return null;

    // Collect all column keys (some rows may have different keys)
    const colSet = new Set<string>();
    rows.forEach((row) => Object.keys(row).forEach((k) => colSet.add(k)));
    const columns = Array.from(colSet);

    return (
      <div className="overflow-x-auto ">
        <table className="min-w-full border-collapse ">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-sm text-gray-800 align-top border-b">
                    {row[col] !== undefined && row[col] !== null ? String(row[col]) : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } items-start space-x-3`}
    >
      {!isUser && (
        <img
          src="/images/logo.jpeg"
          alt="Stratsync Logo"
          className="h-10 w-auto"
        />
      )}

      <div
        className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${
          isUser ? "order-first" : ""
        }`}
      >
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? "bg-gray-100 text-grey rounded-br-md"
              : "bg-gray-100 text-gray-900 rounded-bl-md"
          }`}
        >
          {message.table ? (
            
            renderTable(message.table)
          ) : (
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div
            className={`text-xs text-gray-500 ${
              isUser ? "text-right" : "text-left"
            }`}
          />

          {/* Show Summarize button for assistant messages */}
          {!isUser && (
            <div>
              <button
                onClick={onSummarize}
                disabled={!!isSummarizing}
                className={`text-xs px-3 py-1 rounded-full border border-cyan-500 ${
                  isSummarizing
                    ? "bg-white text-black border border-cyan-500 cursor-not-allowed"
                    : "bg-white text-black border-cyan-500"
                }`}
              >
                {isSummarizing ? "Summarizing..." : "Summarize"}
              </button>
            </div>
          )}
        </div>
      </div>

      {isUser}
    </div>
  );
};

export default MessageBubble;
