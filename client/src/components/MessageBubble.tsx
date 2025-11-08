import React from "react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === "user";

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
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        <div
          className={`mt-1 text-xs text-gray-500 ${
            isUser ? "text-right" : "text-left"
          }`}
        ></div>
      </div>

      {isUser}
    </div>
  );
};

export default MessageBubble;
