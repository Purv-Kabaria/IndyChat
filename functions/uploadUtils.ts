import { UploadedFile } from "@/types/chat";

const UPLOAD_API_URL = "/api/upload";

export async function uploadFile(
  file: File,
  userIdToSend: string
): Promise<UploadedFile | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user", userIdToSend);

  try {
    const response = await fetch(UPLOAD_API_URL, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`Upload failed for ${file.name}:`, result);
      alert(
        `Upload failed for ${file.name}: ${result.details || result.error}`
      );
      return null;
    }

    const difyType = getDifyFileType(file);
    
    return {
      id: result.id,
      name: file.name,
      size: file.size,
      type: difyType,
      fileObject: file,
    };
  } catch (error) {
    console.error(`Error uploading ${file.name}:`, error);
    alert(`Error uploading ${file.name}. Check console for details.`);
    return null;
  }
}

export function getDifyFileType(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = file.type;

  if (mimeType.startsWith("image/")) return "image";
  if (
    [
      "pdf",
      "txt",
      "md",
      "markdown",
      "html",
      "xlsx",
      "xls",
      "docx",
      "csv",
      "eml",
      "msg",
      "pptx",
      "ppt",
      "xml",
      "epub",
    ].includes(extension || "")
  ) {
    return "document";
  }
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";

  return "document";
} 