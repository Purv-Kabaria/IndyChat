import { Message, DifyFileParam } from "@/types/chat";

const INTERNAL_API_URL = "/api/chat";

export async function sendMessageToBackend(
  userInput: string,
  userIdToSend: string,
  filesToSend: DifyFileParam[],
  conversationId: string | null,
  generateMessageId: () => string,

  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setDifyConversationIdCallback: (id: string | null) => void,
  onChunk: (chunk: string) => void
): Promise<void> {
  setIsLoading(true);

  try {
    const headers = {
      "Content-Type": "application/json",
    };

    const requestBody: any = {
      inputs: {},
      query: userInput,
      user: userIdToSend,
      response_mode: "streaming",
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
          (errorData.details ? ` - Details: ${errorData.details}` : "")
      );
    }

    if (!response.body) {
      throw new Error("ReadableStream not supported by backend response");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let conversationIdFound = false;
    let buffer = "";

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
                  setDifyConversationIdCallback(data.conversation_id);
                  conversationIdFound = true;
                }

                if (
                  data.event === "agent_message" ||
                  data.event === "message"
                ) {
                  let contentChunk = "";
                  if (data.answer && typeof data.answer === "string") {
                    try {
                      const answerObj = JSON.parse(data.answer);
                      if (
                        answerObj.action_input &&
                        typeof answerObj.action_input === "string"
                      ) {
                        contentChunk = answerObj.action_input;
                      } else {
                        contentChunk = data.answer;
                      }
                    } catch (e) {
                      contentChunk = data.answer;
                    }
                  } else if (data.answer) {
                    contentChunk = JSON.stringify(data.answer);
                  } else {
                    contentChunk = "";
                  }

                  if (contentChunk) {
                    onChunk(contentChunk);
                  }
                } else if (data.event === "error") {
                  console.error("Dify stream error event:", data);
                  const errorMessage =
                    data.message ||
                    "Unknown error from API during response generation";

                  throw new Error(`Dify API Error: ${errorMessage}`);
                }
              }
            } catch (e: any) {
              console.error(
                "Error parsing SSE JSON or handling stream data:",
                e,
                "Raw line content:",
                line.substring(5)
              );

              throw new Error(`Error processing stream: ${e.message}`);
            }
          }
          boundary = buffer.indexOf("\n");
        }
      }
    } catch (streamError: any) {
      console.error("Error processing stream:", streamError);

      throw streamError;
    }
  } catch (error: any) {
    console.error("sendMessageToBackend Error:", error);

    throw error;
  } finally {
    setIsLoading(false);
  }
}
