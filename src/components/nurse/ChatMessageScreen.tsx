import React, { useState, useEffect, useRef } from "react";
import ChatMessages from "../common/ChatMessages";
import InputSection from "../../components/patient/InputSection";
import { ChatMessage, Macro, QuickAnswer } from "../../types";
import useStompClient from "../../hooks/useStompClient";
import IconButton from "../patient/IconButton";

const useUserContext = () => ({
  nurseId: 1, // for testing
});

interface ChatScreenProps {
  messages: ChatMessage[];   // Passed from parent
  sendMessage: (destination: string, message: any) => Promise<void>;  // Passed from parent
  markMessageAsRead: (messageId: number) => void; // Passed from parent
  currentRoom: string;
  patientId: number;
  patientName: string;
  isConnected: boolean;  // Connection status from parent
  onBackClick: () => void;
  subscribeToRoom:(subscriptionPath: string) => void;
  fetchChatHistory:(patientId: number) => Promise<void>;
  updateMessages: (newMessage: ChatMessage) => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  sendMessage,
  markMessageAsRead,
  subscribeToRoom,
  fetchChatHistory,
  currentRoom,
  patientId,
  patientName,
  isConnected,
  onBackClick,
  updateMessages,  
}) => {

  {/* Set constants */}
  // Set nurse ID, hospital ID, patient 
  const { nurseId } = useUserContext();
  const hospitalId = 1;
  const [patient, setPatient] = useState(patientName);
  // Set nurseId as current userId
  const currentUserId = nurseId;

  {/* State Variables */}
  const [inputText, setInputText] = useState("");  // Input text
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);  // Initially empty
  const [isLoading, setIsLoading] = useState(true);  // Loading state for chat history
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);  // Pending messages, to contain failed messages
  const displayedMessages = [...messages, ...pendingMessages]  // Displayed messages, contains all messages and failed messages
  .sort((a, b) => {
    // Place failed messages at the bottom
    if (a.isFailed && !b.isFailed) return 1;
    if (!a.isFailed && b.isFailed) return -1;

    // Otherwise, sort by timestamp
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });  
  const [macros, setMacros] = useState<Macro[]>([]);  // Set macros
  const [quickAnswers, setQuickAnswers] = useState<QuickAnswer[]>([]);

  // History stack for undo functionality
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isComposing, setIsComposing] = useState(false);  // Check composing

  {/* Handlers and Utility Functions */}
  const handleCompositionStart = () => {
    setIsComposing(true);
  };
  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const updateInputHistory = (newText: string) => {
    // Only save the input text to history if it's changed
    if (newText !== inputText) {
      const updatedHistory = historyIndex === inputHistory.length - 1
        ? [...inputHistory, newText] // Append new text if we're at the end of history
        : [...inputHistory.slice(0, historyIndex + 1), newText]; // Replace undone history
  
      setInputHistory(updatedHistory);
      setHistoryIndex(updatedHistory.length - 1); // Update to point to the new input
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newText = e.target.value;
    updateInputHistory(newText);
    setInputText(newText);
  };

  const handleUndo = (): void => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setInputText(inputHistory[prevIndex]);
      setHistoryIndex(prevIndex);
      console.log("undo");
    }
  };

  const clearHistory = () => {
    setInputHistory([]); // Clear input history
    setHistoryIndex(-1); // Reset history index
  };

  // // Log pendingMessages before passing to ChatMessages
  // useEffect(() => {
  //   console.log("Pending messages:", pendingMessages); // Log the messages here
  // }, [pendingMessages]); // This will log whenever pendingMessages changes

  const handleSendMessage = (): void => {
    if (inputText.trim() && patientId) {
      const now = new Date();
      const currentTime = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().replace("Z", "");  // Korean time
      
      const newMessageId = Math.floor(Math.random() * 1_000_000_000);

      const newMessage: ChatMessage = {
        messageId: newMessageId,
        patientId: patientId,
        medicalStaffId: currentUserId,
        messageContent: inputText,
        timestamp: currentTime,
        readStatus: false,
        chatRoomId: currentRoom,
        senderId: currentUserId,
        isPatient: false,
        isFailed: false,
        isPending: false,
      };

      setPendingMessages((prev) => [...prev, newMessage]);

      const messageToSend = {
        // type: "TALK",
        patientId: patientId,
        medicalStaffId: currentUserId,
        messageContent: inputText,
        timestamp: currentTime,
        readStatus: false,
        chatRoomId: currentRoom,
        senderId: currentUserId,
        isPatient: false,
        hospitalId: hospitalId,
      };

      sendMessage(`/pub/chat/message`, messageToSend)
        .then(() => {
          // Update to indicate message is successfully sent, move it to the messages array
          setPendingMessages((prev) =>
            prev.filter((msg) => msg.messageId !== newMessageId) // Remove from pendingMessages
          );

          // Call the callback function to update the parent messages array
          updateMessages(newMessage); // Pass the new message to the parent
        })
        .catch(() => {
          // Mark as failed if message failed to send
          console.log(`Message failed with ID: ${newMessageId}`);
          setPendingMessages((prev) =>
            prev.map((msg) =>
              msg.messageId === newMessageId
                ? { ...msg, isFailed: true, isPending: false }
                : msg
            )
          );
        });
      setInputText("");

      clearHistory(); // clear undo history after sending message
    }
  };

  const handleResendMessage = (failedMessage: ChatMessage) => {
    console.log(`Resending message with ID: ${failedMessage.messageId}`);
  
    // Get current time
    const now = new Date();
    const currentTime = new Date(now.getTime() + 9 * 60 * 60 * 1000)
      .toISOString()
      .replace("Z", ""); // Korean time
  
    // Temporarily set isPending: true while resending
    setPendingMessages((prev) =>
      prev.map((msg) =>
        msg.messageId === failedMessage.messageId
          ? { ...msg, isPending: true, isFailed: false } // Mark as pending before retry
          : msg
      )
    );
  
    // Message to send over server
    const messageToSend = {
      patientId: failedMessage.patientId,
      medicalStaffId: failedMessage.medicalStaffId,
      messageContent: failedMessage.messageContent,
      timestamp: currentTime,
      readStatus: false,
      chatRoomId: `${nurseId}_${patientId}`,
      senderId: nurseId,
      isPatient: failedMessage.isPatient, // Keep original sender type
    };
  
    sendMessage("/pub/chat/message", messageToSend)
      .then(() => {
        setPendingMessages((prev) => {
          // Update message as successfully sent
          const updatedMessages = prev.map((msg) =>
            msg.messageId === failedMessage.messageId
              ? { ...msg, isPending: false, isFailed: false, timestamp: currentTime }
              : msg
          );
  
          // Keep failed messages at the end
          const successfulMessages = updatedMessages.filter((msg) => !msg.isFailed);
          const failedMessages = updatedMessages.filter((msg) => msg.isFailed);
  
          return [...successfulMessages, ...failedMessages];
        });
      })
      .catch(() => {
        // Failed again → keep it failed and remove pending status
        setPendingMessages((prev) => {
          const updatedMessages = prev.map((msg) =>
            msg.messageId === failedMessage.messageId
              ? { ...msg, isFailed: true, isPending: false }
              : msg
          );
  
          // Keep failed messages at the end
          const successfulMessages = updatedMessages.filter((msg) => !msg.isFailed);
          const failedMessages = updatedMessages.filter((msg) => msg.isFailed);
  
          return [...successfulMessages, ...failedMessages];
        });
      });
  };

  const handleCancelMessage = (failedMessage: ChatMessage) => {
    setPendingMessages((prev) => prev.filter((msg) => msg !== failedMessage));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
  
      if (!isComposing) {
        handleSendMessage(); // to prevent korean being sent twice
      }
    }
  };

  {/* Fetch macros when nurseId is available */}
  const fetchMacros = async (nurseId: number) => {
    try {
      const response = await fetch(`/api/macro/list/${nurseId}`);
      const data: Macro[] = await response.json();
      const savedFavorites = localStorage.getItem("favoriteMacroIds");
      
      // 활성화된 즐겨찾기
      if (savedFavorites) {
         const favoriteIds: number[] = JSON.parse(savedFavorites);
         const filteredMacros = data.filter((macro) =>
          favoriteIds.includes(macro.macroId)
        );
        setMacros(filteredMacros);
      } else {
        
        // 즐겨찾기가 없으면 빈 배열로 설정
        setMacros([]);
      }
    } catch (error) {
      console.error("Error fetching macros:", error);
    }
  };

  {/* Use macro */}
  const handleMacroClick = async (macroName: string) => {
    try {
      const response = await fetch(`/api/macro/${nurseId}/${macroName}`);
      const data = await response.text();

      updateInputHistory(data);
      setInputText(data);
    } catch (error) {
      console.error("Error fetching macro text:", error);
    }
  };

  {/* Use 인사+맺음문구 */}
  const handlePhraseUpdate = async (url: string, position: "prepend" | "append") => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const phrase = await response.text(); 
      
      const updateText = (prev: string) =>
        position === "prepend" ? `${phrase} ${prev}` : `${prev} ${phrase}`;
      
      updateInputHistory(updateText(inputText));
      setInputText(updateText);
      } else {
        console.error("Failed to fetch phrase from", url);
      }
    } catch (error) {
      console.error("Error fetching phrase:", error);
    }
  };

  const fetchQuickAnswers = async () => {
    try {
      const response = await fetch(`/api/hospital-info/list/${hospitalId}`);
      const data: QuickAnswer[] = await response.json();
      const savedFavorites = localStorage.getItem("favoriteQuickAnswerIds");
      if (savedFavorites) {
        const favoriteIds: number[] = JSON.parse(savedFavorites);
        const filtered = data.filter((qa) => favoriteIds.includes(qa.id));
        setQuickAnswers(filtered);
      } else {
        setQuickAnswers([]);
      }
    } catch (error) {
      console.error("Error fetching quick answers:", error);
    }
  };

  useEffect(() => {
    fetchQuickAnswers();
  }, [hospitalId]);

  const handleQuickAnswerClick = (qa: QuickAnswer) => {
    updateInputHistory(qa.information);
    setInputText(qa.information);
  };

  {/* Hooks */}
  
  {/* Fetch chat history when connection or room changes */}
  useEffect(() => {
    if (!currentRoom || !isConnected) return;
    // subscribeToRoom(`/sub/user/chat/${nurseId}`);  
    fetchChatHistory(patientId);
  
    return () => {
    };
  }, [currentRoom, isConnected]);

  {/* Mark unread messages from others as read */}
  useEffect(() => {
    const unreadMessagesFromOthers = messages.filter(
      (message) => !message.readStatus && message.senderId !== currentUserId
    );
  
    unreadMessagesFromOthers.forEach((message) => markMessageAsRead(message.messageId));
  }, [messages, currentUserId]);  // only messages not pending

  // useEffect(() =>{
  //   console.log(messages);
  // }, [messages]);
  

  {/* Update patient name when prop changes */}
  useEffect(() => {
    setPatient(patientName); 
  }, [patientName]);

  {/* Fetch macros when nurseId is available */}
  useEffect(() => {
    if (nurseId) {
      fetchMacros(nurseId);
    }
  }, [nurseId]);

  {/* Reset input when switching rooms */}
  useEffect(() => {
    setInputText(""); // Clear the text input
    clearHistory(); // Clear the input history stack
    setInputHistory([""]); // Add empty string to history
    setHistoryIndex(0); // Increment history index by 1
  }, [currentRoom]);


  return (
    <div className="flex flex-col h-full bg-primary-100 overflow-hidden">

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-6 text-black z-10 relative">
        <IconButton
          onClick={onBackClick}
          className="absolute left-4 flex items-center justify-center w-10 h-10"
          iconSrc={"/icons/back-icon.png"}
          altText={"Back"}
        />
        <h2 className="text-lg font-bold text-center flex-1">{patient}</h2>
      </header>

      {/* Debug */}
      <div className="mb-2">
        <span className={isConnected ? "text-green-500" : "text-red-500"}>
          {isConnected ? `Connected - Room ID: ${currentRoom}` : "Disconnected"}
        </span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col-reverse">
        <ChatMessages 
        chatMessages={displayedMessages} 
        currentUserId={currentUserId} 
        onResend={handleResendMessage}
        onCancel={handleCancelMessage}
        senderBubbleColor="bg-primary-300"
        receiverBubbleColor="bg-white"
        senderTextColor="text-white"
        />
      </div>

      {/* Macros Section */}
      <div className="flex justify-end space-x-2 px-4 py-2 overflow-x-auto scrollbar-hide">
        {macros.map((macro) => (
          <div
            key={macro.macroId}
            onClick={() => handleMacroClick(macro.macroName)}
            className={"flex items-center justify-center px-3 py-1 text-sm rounded-full cursor-pointer bg-primary text-white"}
          >
            {macro.macroName}
          </div>
        ))}
        {quickAnswers.map((qa) => (
          <div
            key={qa.id}
            onClick={() => handleQuickAnswerClick(qa)}
            className="flex items-center justify-center px-3 py-1 text-sm rounded-full cursor-pointer bg-secondary text-white"
          >
            {qa.title}
          </div>
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="flex justify-end space-x-2 px-4 py-2 overflow-x-auto scrollbar-hide">
        {/* Quick Action Button Component */}
        {[
          { label: "실행취소", onClick: handleUndo },
          {
            label: "인사문구 추가",
            onClick: () => handlePhraseUpdate(`/api/macro/phrase-head/${nurseId}`, "prepend"),
          },
          {
            label: "맺음문구 추가",
            onClick: () => handlePhraseUpdate(`/api/macro/phrase-tail/${nurseId}`, "append"),
          },
        ].map((action, index) => (
          <div
            key={index}
            onClick={action.onClick}
            className="flex items-center justify-center px-3 py-1 text-sm rounded-full cursor-pointer bg-primary text-white"
          >
            {action.label}
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <InputSection
        inputText={inputText}
        handleInputChange={handleInputChange}
        handleSendMessage={handleSendMessage}
        handleKeyDown={handleKeyDown}
        handleCompositionStart={handleCompositionStart}
        handleCompositionEnd={handleCompositionEnd}
        minHeight="1.5rem"
        maxHeight="10rem"
        color="bg-white"
      />
      
    </div>
  );
};

export default ChatScreen;