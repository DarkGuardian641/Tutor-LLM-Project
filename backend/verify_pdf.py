from langchain_community.document_loaders import PyPDFLoader

def verify(filename):
    loader = PyPDFLoader(filename)
    docs = loader.load()
    print(f"PyPDFLoader loaded {len(docs)} pages.")
    for i, doc in enumerate(docs):
        print(f"Page {i} content: {doc.page_content[:100]!r}")

if __name__ == "__main__":
    verify("test_doc.pdf")
