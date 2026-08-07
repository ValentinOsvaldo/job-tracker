import { dirname, join } from 'path';

// pdfmake's server-side printer needs real .ttf files (not the base64
// vfs_fonts blob used in the browser). Rather than vendoring our own font
// files, reuse the Roboto TTFs pdfmake already ships in its own package —
// they travel with node_modules in every environment, dev or prod.
//
// Exported so the local access policy can allowlist exactly this directory:
// pdfmake routes its own font-file reads through that same policy, so a
// blanket deny (needed to stop resume content from referencing arbitrary
// local files) would otherwise also block pdfmake from reading its fonts.
export const ROBOTO_FONT_DIR = join(
  dirname(require.resolve('pdfmake/package.json')),
  'fonts',
  'Roboto',
);
const robotoDir = ROBOTO_FONT_DIR;

export const RESUME_PDF_FONTS = {
  Roboto: {
    normal: join(robotoDir, 'Roboto-Regular.ttf'),
    bold: join(robotoDir, 'Roboto-Medium.ttf'),
    italics: join(robotoDir, 'Roboto-Italic.ttf'),
    bolditalics: join(robotoDir, 'Roboto-MediumItalic.ttf'),
  },
};
