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