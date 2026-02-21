import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export const extractPDFDocs = async (filePath) => {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
  return docs;
};