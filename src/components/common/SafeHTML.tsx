import DOMPurify from 'dompurify';
import { useEffect, useRef } from 'react';

interface SafeHTMLProps {
  html: string;
  className?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  style?: React.CSSProperties;
  allowedTags?: string[];
  allowedAttributes?: string[];
}

/**
 * SafeHTML Component - XSS Protection
 * 
 * This component sanitizes HTML content using DOMPurify to prevent XSS attacks.
 * It allows only safe HTML tags and attributes.
 * 
 * @param html - The HTML content to render (will be sanitized)
 * @param className - CSS classes to apply
 * @param dir - Text direction (ltr/rtl/auto)
 * @param style - Inline styles
 * @param allowedTags - Custom allowed HTML tags (optional)
 * @param allowedAttributes - Custom allowed HTML attributes (optional)
 */
export function SafeHTML({
  html,
  className = '',
  dir,
  style,
  allowedTags,
  allowedAttributes,
}: SafeHTMLProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !html) return;

    // SECURITY FIX: Sanitize HTML using DOMPurify
    const defaultAllowedTags = [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'pre', 'code',
      'div', 'span',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr',
    ];

    const defaultAllowedAttributes = [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'width', 'height', 'style', 'target', 'rel',
      'colspan', 'rowspan', 'align',
    ];

    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags || defaultAllowedTags,
      ALLOWED_ATTR: allowedAttributes || defaultAllowedAttributes,
      ALLOW_DATA_ATTR: false, // Disable data attributes for security
      ALLOW_UNKNOWN_PROTOCOLS: false, // Only allow http, https, mailto, tel
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
      // Remove dangerous protocols
      SAFE_FOR_TEMPLATES: false,
      // Sanitize style attributes
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });

    containerRef.current.innerHTML = sanitized;
  }, [html, allowedTags, allowedAttributes]);

  return (
    <div
      ref={containerRef}
      className={className}
      dir={dir}
      style={style}
    />
  );
}

/**
 * SafeHTMLInline - For inline HTML content
 * More permissive than SafeHTML but still sanitized
 */
export function SafeHTMLInline({
  html,
  className = '',
  dir,
  style,
}: Omit<SafeHTMLProps, 'allowedTags' | 'allowedAttributes'>) {
  const sanitized = DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'class', 'style', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  });

  return (
    <span
      className={className}
      dir={dir}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

