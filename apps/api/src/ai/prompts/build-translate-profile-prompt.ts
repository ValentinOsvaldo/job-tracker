import { TranslationItem } from '../interfaces/profile-translator.interface';

export function buildTranslateProfilePrompt(items: TranslationItem[]): string {
  const itemsBlock = items
    .map((item) => `  - id="${item.id}": ${item.text}`)
    .join('\n');

  return `
Eres un traductor profesional especializado en CVs técnicos. Traduce cada uno de los siguientes
textos del español al inglés de forma 100% fiel: es una traducción literal y profesional, NO una
reescritura ni un resumen. No omitas, agregues ni alteres ningún hecho, cifra, porcentaje,
tecnología, nombre propio o resultado. Si un texto ya está en inglés, devuélvelo igual (o con
mínimas correcciones gramaticales) sin cambiar su significado.

TEXTOS A TRADUCIR (cada uno trae su id — DEBES devolver exactamente esos mismos ids, uno por uno):
${itemsBlock}

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown, con este schema exacto:
{
  "translations": [
    { "id": "<id exacto del texto original>", "text": "<traducción al inglés>" }
  ]
}
  `.trim();
}
