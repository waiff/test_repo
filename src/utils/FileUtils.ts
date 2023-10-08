import { handleException } from './ErrorUtils';

const openBase64Document = async (contents: string) => {
  try {
    await Word.run(async (context) => {
      const externalDoc = context.application.createDocument(contents);
      await context.sync();

      // Load the entire content of the external document as a range.
      const externalDocRange = externalDoc.body.getRange();
      externalDocRange.load('text');
      await context.sync();

      // Get the OOXML content of the external document's range.
      const externalDocContentOoxml = externalDocRange.getOoxml();
      await context.sync();

      // Insert the OOXML content into the current document to preserve formatting.
      context.document.body.insertOoxml(
        externalDocContentOoxml.value,
        Word.InsertLocation.replace,
      );
      await context.sync();
    });
  } catch (error) {
    handleException(error);
  }
};

export function loadFile(file: File) {
  const reader = new FileReader();

  reader.onload = () => {
    const result = reader.result?.toString();
    if (result) {
      const startIndex = result.indexOf('base64,');
      if (startIndex !== -1) {
        const base64String = result.substring(startIndex + 7);
        openBase64Document(base64String);
      }
    }
  };

  reader.readAsDataURL(file);
}
