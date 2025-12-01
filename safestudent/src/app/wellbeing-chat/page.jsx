"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [error, setError] = useState(null);

  const handleFinish = useCallback((message) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: message,
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
    setStreamingMessage("");
  }, []);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: handleFinish,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin?callbackUrl=/chatbot";
    }
  }, [user, userLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a supportive AI assistant focused on wellbeing. Your role is to:
- Provide empathetic, non-judgmental responses
- Encourage positive coping strategies
- Recognize signs of distress and suggest professional help when appropriate
- Never provide medical advice or diagnosis
- Always maintain appropriate boundaries
- Keep responses brief and focused
- If user expresses thoughts of self-harm or harm to others, immediately direct them to emergency services

You must include a suggestion to seek professional help if the user mentions:
- Severe depression or anxiety
- Suicidal thoughts
- Self-harm
- Violence
- Substance abuse
- Eating disorders
- Trauma
- Persistent mental health struggles`,
            },
            ...messages.map((msg) => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text,
            })),
            { role: "user", content: inputMessage },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      handleStreamResponse(response);

      // Log the conversation to the database
      await fetch("/api/wellbeing-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputMessage }),
      });
    } catch (err) {
      console.error(err);
      setError("Failed to get response. Please try again.");
      setStreamingMessage("");
    } finally {
      setIsTyping(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <a
            href="/"
            className="text-gray-400 hover:text-white flex items-center"
          >
            <i className="fas fa-arrow-left mr-2" />
            Back to Home
          </a>
          <div className="text-gray-400">{user.email}</div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          <div className="p-4 border-b border-gray-700 bg-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center">
                <i className="fas fa-heart text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Wellbeing Chat</h1>
                <p className="text-sm text-gray-400">
                  Share your concerns in a safe, supportive space
                </p>
              </div>
            </div>
          </div>

          <div className="h-[60vh] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <i className="fas fa-comments text-4xl mb-2" />
                <p>Start a conversation about your wellbeing</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.sender === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.text}
                      </p>
                      <span
                        className={`text-xs mt-2 block ${
                          message.sender === "user"
                            ? "text-blue-200"
                            : "text-gray-400"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {streamingMessage && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-4 bg-gray-700 text-white">
                      <p className="text-sm whitespace-pre-wrap">
                        {streamingMessage}
                        <span className="animate-pulse">▊</span>
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border-t border-red-700">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-gray-700"
          >
            <div className="flex gap-2">
              <input
                type="text"
                name="message"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isTyping ? (
                  <i className="fas fa-spinner fa-spin" />
                ) : (
                  <i className="fas fa-paper-plane" />
                )}
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;