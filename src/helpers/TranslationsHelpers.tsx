export type LanguageCode = 'ru' | 'en' | 'uz' | 'kk';

export const LANGUAGE_PRIORITY: LanguageCode[] = ['ru', 'en', 'uz', 'kk'];

export interface Translation {
  name?: string;
  title?: string;
  description?: string;
  slug?: string;
  [key: string]: any;
}

export interface TranslatedItem {
  id: number;
  translations: {
    [key in LanguageCode]?: Translation;
  };
}

export function getFirstAvailableTranslation<T extends TranslatedItem>(
  item: T,
  currentLanguage: LanguageCode
): { translation: Translation; language: LanguageCode } | null {
  // First try current language
  if (item.translations[currentLanguage]) {
    return {
      translation: item.translations[currentLanguage]!,
      language: currentLanguage
    };
  }

  // Then try other languages in priority order
  for (const lang of LANGUAGE_PRIORITY) {
    if (item.translations[lang]) {
      return {
        translation: item.translations[lang]!,
        language: lang
      };
    }
  }

  return null;
}

export function handleEdit(
  item: TranslatedItem,
  currentLanguage: LanguageCode,
  navigate: (path: string) => void,
  basePath: string
) {
  const availableTranslation = getFirstAvailableTranslation(item, currentLanguage);
  
  if (availableTranslation) {
    const { translation } = availableTranslation;
    const slug = translation.slug;
    
    if (slug) {
      navigate(`${basePath}?slug=${slug}`);
    } else {
      console.error('No slug found in translation');
    }
  } else {
    console.error('No available translation found');
  }
}