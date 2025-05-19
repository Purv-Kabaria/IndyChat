import { Message, DifyFileParam } from "@/types/chat";

const INTERNAL_API_URL = "/api/chat";

export async function sendMessageToBackend(
  userInput: string,
  userIdToSend: string,
  filesToSend: DifyFileParam[],
  conversationId: string | null,
  generateMessageId: () => string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setConversationId: React.Dispatch<React.SetStateAction<string | null>>
): Promise<void> {
  let assistantMessageId = generateMessageId();
  setIsLoading(true);
  
  try {
    const headers = {
      "Content-Type": "application/json",
    };
    
    const requestBody: any = {
      query: userInput,
      user: userIdToSend,
    };
    
    if (conversationId) {
      requestBody.conversation_id = conversationId;
    }
    
    if (filesToSend && filesToSend.length > 0) {
      requestBody.files = filesToSend;
    }

    const response = await fetch(INTERNAL_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorData = {
        error: `HTTP error! status: ${response.status}`,
        details: "",
      };
      try {
        const errorJson = await response.json();
        errorData.error =
          errorJson.error || `HTTP error! status: ${response.status}`;
        errorData.details = errorJson.details || JSON.stringify(errorJson);
      } catch (e) {
        try {
          errorData.details = await response.text();
        } catch (textError) {
          errorData.details = "Could not read error response body.";
        }
      }
      console.error(
        "sendMessageToBackend: Backend API returned an error:",
        errorData
      );
      throw new Error(
        errorData.error +
          (errorData.details ? ` - ${errorData.details}` : "")
      );
    }
    
    if (!response.body) {
      throw new Error("ReadableStream not supported by backend response");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let conversationIdFound = false;
    let buffer = "";
    
    assistantMessageId = generateMessageId();
    
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "",
        timestamp: new Date(),
        id: assistantMessageId,
      },
    ]);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n");
        while (boundary !== -1) {
          const line = buffer.substring(0, boundary).trim();
          buffer = buffer.substring(boundary + 1);

          if (line.startsWith("data: ")) {
            try {
              const jsonString = line.substring(5).trim();
              if (jsonString) {
                const data = JSON.parse(jsonString);

                if (!conversationIdFound && data.conversation_id) {
                  setConversationId(data.conversation_id);
                  conversationIdFound = true;
                }

                if (data.event === "agent_message" || data.event === "message") {
                  let contentChunk = "";
                  
                  if (data.answer && typeof data.answer === 'string') {
                    try {
                      const answerObj = JSON.parse(data.answer);
                      if (answerObj.action_input) {
                        contentChunk = answerObj.action_input;
                      } else {
                        contentChunk = data.answer;
                      }
                    } catch (e) {
                      contentChunk = data.answer;
                    }
                  } else {
                    contentChunk = data.answer || "";
                  }
                  
                  if (contentChunk) {
                    setMessages((prev) => {
                      const currentMsg = prev.find(msg => msg.id === assistantMessageId);
                      
                      if (currentMsg && currentMsg.content === "" && contentChunk.trim().startsWith("{")) {
                        try {
                          const jsonContent = JSON.parse(contentChunk);
                          if (jsonContent.action_input) {
                            return prev.map(msg => 
                              msg.id === assistantMessageId
                                ? { ...msg, content: jsonContent.action_input }
                                : msg
                            );
                          }
                        } catch (e) {
                        }
                      }
                      
                      return prev.map(msg =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: msg.content + contentChunk }
                          : msg
                      );
                    });
                  }
                } else if (data.event === "error") {
                  console.error("Dify stream error event:", data);
                  const errorMessage =
                    data.message || "Unknown error from API during response generation";
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            content:
                              msg.content + `\n\n[API Error: ${errorMessage}]`,
                          }
                        : msg
                    )
                  );
                }
              }
            } catch (e) {
              console.error(
                "Error parsing SSE JSON:",
                e,
                "Raw line content:",
                line.substring(5)
              );
            }
          }
          boundary = buffer.indexOf("\n");
        }
      }
      
      setMessages((prev) => {
        const currentMsg = prev.find(msg => msg.id === assistantMessageId);
        if (currentMsg && currentMsg.content.trim().startsWith("{")) {
          try {
            const jsonContent = JSON.parse(currentMsg.content);
            if (jsonContent.action_input) {
              return prev.map(msg => 
                msg.id === assistantMessageId
                  ? { ...msg, content: jsonContent.action_input }
                  : msg
              );
            }
          } catch (e) {
          }
        }
        return prev;
      });
      
    } catch (streamError) {
      console.error("Error processing stream:", streamError);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "\n\nError receiving response stream." }
            : msg
        )
      );
    }
  } catch (error: any) {
    console.error("sendMessageToBackend Error:", error);
    const errorMsgId = generateMessageId();
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Error: ${error.message || "Could not connect."}`,
        timestamp: new Date(),
        id: errorMsgId,
      },
    ]);
  } finally {
    setIsLoading(false);
  }
}