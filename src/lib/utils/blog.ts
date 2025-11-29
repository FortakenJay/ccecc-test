/**
 * Blog utility functions for content processing
 */

/**
 * Calculate reading time based on Tiptap JSON content
 * Average reading speed: 200-250 words per minute
 * @param content - Tiptap JSON content
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(content: Record<string, any> | null): number {
  if (!content || !content.content) return 1;

  let wordCount = 0;

  const countWords = (node: any) => {
    if (node.type === 'text' && node.text) {
      wordCount += node.text.split(/\s+/).filter(Boolean).length;
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(countWords);
    }
  };

  countWords(content);

  // Calculate minutes (250 words per minute)
  const minutes = Math.ceil(wordCount / 250);
  return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Extract first image URL from Tiptap JSON content
 * @param content - Tiptap JSON content
 * @returns First image URL or null
 */
export function extractFirstImage(content: Record<string, any> | null): string | null {
  if (!content || !content.content) return null;

  const findImage = (node: any): string | null => {
    if (node.type === 'image' && node.attrs?.src) {
      return node.attrs.src;
    }
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        const img = findImage(child);
        if (img) return img;
      }
    }
    return null;
  };

  return findImage(content);
}

/**
 * Extract plain text from Tiptap JSON content for SEO/preview
 * @param content - Tiptap JSON content
 * @param maxLength - Maximum length of extracted text
 * @returns Plain text string
 */
export function extractPlainText(content: Record<string, any> | null, maxLength = 160): string {
  if (!content || !content.content) return '';

  let text = '';

  const extractText = (node: any) => {
    if (node.type === 'text' && node.text) {
      text += node.text + ' ';
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(extractText);
    }
  };

  extractText(content);

  text = text.trim();
  if (text.length > maxLength) {
    return text.substring(0, maxLength).trim() + '...';
  }
  return text;
}

/**
 * Generate SEO-friendly slug from title
 * @param title - Blog post title
 * @returns URL-safe slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Format published date for display
 * @param dateString - ISO date string
 * @param locale - Locale for formatting
 * @returns Formatted date string
 */
export function formatPublishedDate(dateString: string | null, locale = 'en'): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Example Tiptap JSON structure with images
 * This is what the content field stores
 */
export const EXAMPLE_TIPTAP_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Welcome to Our Blog' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This is a paragraph with ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'bold text' },
        { type: 'text', text: ' and ' },
        { type: 'text', marks: [{ type: 'italic' }], text: 'italic text' },
        { type: 'text', text: '.' }
      ]
    },
    {
      type: 'image',
      attrs: {
        src: '/1838.jpg',
        alt: 'Description of image',
        title: 'Image title'
      }
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Text after the image.' }]
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'First bullet point' }]
            }
          ]
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Second bullet point' }]
            }
          ]
        }
      ]
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Another Section' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Check out this ' },
        {
          type: 'text',
          marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
          text: 'link'
        }
      ]
    }
  ]
};
