export interface TranslationItem {
  id: string;
  text: string;
}

export interface ProfileTranslator {
  translateToEnglish(items: TranslationItem[]): Promise<TranslationItem[]>;
}
