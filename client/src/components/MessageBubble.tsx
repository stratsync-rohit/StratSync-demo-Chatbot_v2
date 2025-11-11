import React from "react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  table?: Array<Record<string, any>>;

  originalRequestPayload?: any;
  // if false, the summarize action should be disabled and a hint shown
  canSummarize?: boolean;
}

interface MessageBubbleProps {
  message: Message;

  onSummarize?: () => void;

  isSummarizing?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onSummarize,
  isSummarizing,
}) => {
  const isUser = message.sender === "user";
  // compute disabled state for the Summarize button
  const summarizeDisabled = !!isSummarizing || message.canSummarize === false;

  const renderTable = (rows: Array<Record<string, any>>) => {
    if (!rows || rows.length === 0) return null;

    // Collect all column keys (some rows may have different keys)
    const colSet = new Set<string>();
    rows.forEach((row) => Object.keys(row).forEach((k) => colSet.add(k)));
    const columns = Array.from(colSet);

    return (
      <div className="overflow-x-auto">
        {/* Use auto table layout and min-content sizing so each column takes only
      as much width as its content. The wrapper provides horizontal scrolling
      when the combined width exceeds the container. */}
        <table className="min-w-min table-auto">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  // Make header sticky so it stays visible while scrolling
                  className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b sticky top-0 z-10 bg-gray-100 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-2 text-sm text-gray-800 align-top border-b whitespace-nowrap"
                  >
                    {row[col] !== undefined && row[col] !== null
                      ? String(row[col])
                      : ""}
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
        className={`${
          message.table
            ? "w-auto w-max-fits max-h-[60vh] overflow-y-auto inline-block"
            : "max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl"
        } ${isUser ? "order-first" : ""}`}
      >
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? "bg-gray-100 text-grey rounded-br-md"
              : "bg-gray-100 text-gray-900 rounded-bl-md"
          }`}
        >
          {message.table ? (
            // For table messages we allow the table to take the full available width
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
                // disable when already summarizing or when message explicitly cannot be summarized
                disabled={summarizeDisabled}
                className={`text-xs px-3 py-1 rounded-full border ${
                  summarizeDisabled
                    ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                    : "bg-white text-black border-cyan-500 hover:bg-cyan-50"
                }`}
              >
                {isSummarizing ? "Summarizing..." : "Summarize"}
              </button>

              {/* helper hint when summarization is not available */}
              {message.canSummarize === false && (
                <div className="text-xs text-red-500 mt-1">
                  Sorry, I couldn’t find any matching data. You can try <br />asking
                  in a different way or use another prompt.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isUser}
    </div>
  );
};

export default MessageBubble;
