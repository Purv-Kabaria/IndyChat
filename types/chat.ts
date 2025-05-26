export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  fileObject?: File;
};

export type DifyFileParam = {
  type: string;
  transfer_method: "local_file";
  upload_file_id: string;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  id: string;
  attachedFiles?: UploadedFile[];
};

export type EmbeddedMessage = {
  id: string;
  date: Date;
  message: string;
  role: "user" | "assistant";
  attachedFiles?: UploadedFile[];
};

export type Conversation = {
  id: string;
  user_id: string;
  user_email: string;
  messages: EmbeddedMessage[];
  difyConversationId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ConversationListItem = {
  id: string;
  user_id: string;
  user_email: string;
  difyConversationId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessagePreview?: string;
};
