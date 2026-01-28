from reportlab.pdfgen import canvas

def create_dummy_pdf(filename):
    c = canvas.Canvas(filename)
    c.drawString(100, 750, "Local RAG Pipeline Test Document")
    c.drawString(100, 730, "--------------------------------")
    c.drawString(100, 710, "This is a test PDF created to verify the Local RAG pipeline.")
    c.drawString(100, 690, "It uses LangChain, Ollama, and Chroma.")
    c.drawString(100, 670, "If this text is retrieved, the pipeline is working correctly.")
    c.save()

if __name__ == "__main__":
    create_dummy_pdf("test_doc.pdf")
