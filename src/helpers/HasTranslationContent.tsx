// Helper function to check if a translation has content
export const hasTranslationContent = (translation: any): boolean => {
    if (!translation) return false;
    
    return Object.values(translation).some(value => {
      if (typeof value === 'string') {
        // Remove HTML tags and trim whitespace for rich text
        const cleanValue = value.replace(/<[^>]*>/g, '').trim();
        return cleanValue.length > 0;
      }
      return false;
    });
  };