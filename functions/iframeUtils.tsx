import React from 'react';

/**
 * Extracts iframe elements from content and separates them from text
 */
export function extractIframes(content: string): { iframes: string[], textSegments: string[] } {
  const iframeRegex = /<iframe[^>]*>[\s\S]*?<\/iframe>/gi;
  const textSegments: string[] = [];
  const iframes: string[] = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = iframeRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index).trim();
    if (textBefore) textSegments.push(textBefore);
    
    iframes.push(match[0]);
    
    lastIndex = match.index + match[0].length;
  }
  
  const textAfter = content.substring(lastIndex).trim();
  if (textAfter) textSegments.push(textAfter);
  
  if (iframes.length === 0) {
    textSegments.push(content);
  }
  
  return { iframes, textSegments };
}

/**
 * Creates a safe iframe element with appropriate sizing for mobile or desktop
 */
export function createSafeIframe(iframeHtml: string, isMobile: boolean): React.ReactElement {
  const srcMatch = iframeHtml.match(/src=["\'](.*?)["\']/i);
  const src = srcMatch ? srcMatch[1] : "";

  const widthAttrMatch = iframeHtml.match(/width=["\'](.*?)["\']/i);
  const heightAttrMatch = iframeHtml.match(/height=["\'](.*?)["\']/i);

  const numWidth = widthAttrMatch ? parseInt(widthAttrMatch[1], 10) : NaN;
  const numHeight = heightAttrMatch ? parseInt(heightAttrMatch[1], 10) : NaN;

  const iframeProps = {
    src: src,
    className: "w-full h-full border-none",
    sandbox: "allow-scripts allow-same-origin allow-forms",
    loading: "lazy" as "lazy", 
    title: "Embedded content", 
    referrerPolicy: "no-referrer" as "no-referrer", 
    allowFullScreen: true,
  };

  if (isMobile) {
    let aspectRatioClass = "aspect-w-4 aspect-h-3"; // Default for mobile
    if (!isNaN(numWidth) && !isNaN(numHeight) && numHeight > 0) {
        const ratio = numWidth / numHeight;
        if (Math.abs(ratio - (16/9)) < 0.01) { // Use a smaller tolerance for precision
          aspectRatioClass = "aspect-w-16 aspect-h-9";
        } else if (Math.abs(ratio - (4/3)) < 0.01) {
          aspectRatioClass = "aspect-w-4 aspect-h-3";
        }
        // Add other common ratios if needed, e.g., 1:1, 3:2
    }
    return (
      <div className={`w-full ${aspectRatioClass} rounded-lg overflow-hidden`}>
        <iframe {...iframeProps} />
      </div>
    );
  } else { // Desktop
    const styleWidth = !isNaN(numWidth) 
      ? `${numWidth}px` 
      : (widthAttrMatch ? widthAttrMatch[1] : "600px");
    const styleHeight = !isNaN(numHeight) 
      ? `${numHeight}px` 
      : (heightAttrMatch ? heightAttrMatch[1] : "450px");

    return (
      <div
        className="iframe-container iframe-container-desktop"
        style={{
          '--iframe-width': styleWidth,
          '--iframe-height': styleHeight
        } as React.CSSProperties}
      >
        <iframe {...iframeProps} />
      </div>
    );
  }
} 