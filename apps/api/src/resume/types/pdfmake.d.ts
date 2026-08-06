// pdfmake ships no type declarations for its server (Node) entrypoint.
// Minimal ambient typing covering only what this feature actually calls.
declare module 'pdfmake' {
  export interface PdfMakeFontFiles {
    normal: string;
    bold?: string;
    italics?: string;
    bolditalics?: string;
  }

  export type PdfMakeFonts = Record<string, PdfMakeFontFiles>;

  export interface PdfMakeOutputDocument {
    getBuffer(): Promise<Buffer>;
  }

  export interface PdfMake {
    setFonts(fonts: PdfMakeFonts): void;
    setUrlAccessPolicy(callback: (url: string) => boolean): void;
    setLocalAccessPolicy(callback: (path: string) => boolean): void;
    createPdf(docDefinition: Record<string, unknown>): PdfMakeOutputDocument;
  }

  const pdfMake: PdfMake;
  export = pdfMake;
}
