import { PDFLoader } from "langchain/document_loaders/fs/pdf";

const load_documents = async function(file_location) {
    const loader = new PDFLoader(file_location, {
        splitPages: true,
    });
    const docs = await loader.load();
    return docs;
};

export default { load_documents };