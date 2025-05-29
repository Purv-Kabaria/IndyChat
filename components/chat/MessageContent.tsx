import React from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export interface MessageContentProps {
  content: string;
  onComplaintClick: () => void;
  onImageClick: (imageUrl: string) => void;
}

export function MessageContent({
  content,
  onComplaintClick,
  onImageClick,
}: MessageContentProps) {
  const hasComplaintButton = content.includes("<complaint button>");
  const cleanContentForInitialProcessing = hasComplaintButton
    ? content.replace(/<complaint button>/g, "")
    : content;

  const cloudinaryImageRegex =
    /(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/[^/]+\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/gi;

  const parts = cleanContentForInitialProcessing.split(cloudinaryImageRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (part && part.match(cloudinaryImageRegex)) {
          return (
            <div
              key={`cloudinary-img-${index}`}
              className="my-2 relative w-full max-w-md mx-auto aspect-video cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onImageClick(part)}>
              <Image
                src={part}
                alt="Cloudinary Image"
                layout="fill"
                objectFit="contain"
                className="rounded-md shadow-md"
              />
            </div>
          );
        }

        if (part && part.trim() !== "") {
          return (
            <ReactMarkdown
              key={`text-segment-${index}`}
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({
                  href,
                  children,
                  ...props
                }: React.HTMLProps<HTMLAnchorElement>) => (
                  <a
                    href={href}
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:underline">
                    {children}
                  </a>
                ),
                p: ({ children }: React.HTMLProps<HTMLParagraphElement>) => (
                  <p className="mb-3 last:mb-0">{children}</p>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside my-3 ml-2">
                    {children}
                  </ol>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside my-3 ml-2">
                    {children}
                  </ul>
                ),
                li: ({ children }: React.HTMLProps<HTMLLIElement>) => (
                  <li className="mb-1">{children}</li>
                ),
                code: ({
                  inline,
                  className,
                  children,
                  ...props
                }: React.HTMLProps<HTMLElement> & { inline?: boolean }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const language = match?.[1];
                  return !inline ? (
                    <pre
                      className={`bg-accent/90 rounded-md p-3 my-3 overflow-x-auto language-${
                        language || "none"
                      }`}>
                      <code
                        className={`block text-primary text-sm font-mono whitespace-pre`}
                        {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code
                      className={`bg-accent/20 text-accent rounded px-1 py-0.5 text-xs font-mono ${
                        className || ""
                      }`}
                      {...props}>
                      {children}
                    </code>
                  );
                },
              }}>
              {part}
            </ReactMarkdown>
          );
        }
        return null;
      })}

      {hasComplaintButton && (
        <div className="mt-3">
          <Button
            onClick={onComplaintClick}
            className="bg-accent hover:bg-accent/90 text-white"
            size="sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            File a Complaint
          </Button>
        </div>
      )}
    </>
  );
}
