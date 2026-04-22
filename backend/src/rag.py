from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

def format_docs(docs):
    formatted = []
    for doc in docs:
        source = doc.metadata.get('source', 'Unknown Document')
        page = doc.metadata.get('page', 'Unknown Page')
        # Just use the basename for cleaner citations
        import os
        if os.path.isabs(source):
            source = os.path.basename(source)
        
        formatted.append(f"[Source: {source}, Page: {page}]\n{doc.page_content}")
    return "\n\n".join(formatted)

def get_intent_chain(llm_model: str = "gpt-oss:120b-cloud"):
    """
    Classifies the user input into GREETING, GENERAL, or TEXTBOOK.
    """
    llm = ChatOllama(model=llm_model, temperature=0)
    
    template = """Classify the following user input into exactly one of these categories:
    1. GREETING (e.g., "hi", "hello", "good morning")
    2. GENERAL (e.g., "how are you", "write a python script", "what is the capital of france")
    3. TEXTBOOK (e.g., "explain photosynthesis", "what does the document say about X", "summarize the chapter")
    
    Return ONLY the category name (GREETING, GENERAL, or TEXTBOOK). Do not add any explanation.
    
    User Input: {question}
    Category:"""
    
    prompt = ChatPromptTemplate.from_template(template)
    return prompt | llm | StrOutputParser()

def get_general_chain(llm_model: str = "gpt-oss:120b-cloud"):
    """
    Chain for general conversation and greetings.
    """
    llm = ChatOllama(model=llm_model)
    template = """You are a helpful AI assistant named TutorLLM.
    
    User Input: {question}
    
    Answer (concise and helpful):"""
    prompt = ChatPromptTemplate.from_template(template)
    return prompt | llm | StrOutputParser()

def get_rag_chain(vector_store, llm_model: str = "gpt-oss:120b-cloud", active_document: str = None):
    """
    Creates and returns the RAG chain for textbook questions.
    """
    search_kwargs = {"k": 5}
    if active_document:
        search_kwargs["filter"] = {"source": active_document}
        print(f"Filtering RAG context for document: {active_document}")
        
    retriever = vector_store.as_retriever(search_kwargs=search_kwargs)
    
    llm = ChatOllama(model=llm_model)

    template = """You are an intelligent tutor assistant designed to help students prepare for exams.
    
    Guidelines for your answer:
    1.  **Context First**: You MUST generate responses ONLY from the uploaded document provided in the Context whenever possible. Rely on the context completely before considering anything else.
    2.  **Fallback as Last Resort**: If and ONLY if the provided context is completely empty or does not contain any relevant information to answer the question, you MUST explicitly state that you are using your own knowledge ("LLM") to answer as a last resort, and then provide a helpful answer based on your general knowledge.
    3.  **Explicit Citation**: You MUST explicitly mention the source of the generated answer at the very end of your response, separated by a blank line. 
        - If you used the provided context (even partially), output: `Source: RAG (Uploaded File - [Source: <filename>, Page: <page>])` where you fill in the exact filename and page from the context metadata.
        - If you used your own knowledge because the context was absolutely insufficient, output: `Source: LLM (Generated)`
    4.  **Structure**: Use bullet points or paragraphs for readability.
    5.  **Tone**: Formal and educational.
    
    Context:
    {context}

    Question: {question}
    
    Answer:
    """
    prompt = ChatPromptTemplate.from_template(template)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain

def get_smart_response_chain(vector_store, llm_model: str = "gpt-oss:120b-cloud", active_document: str = None):
    """
    Orchestrates intent classification and routing.
    Note: Since we need to stream the final response, this function returns a generator.
    However, standard LangChain chains return runnables. 
    To support streaming in FastAPI, we'll implement a custom generator in the server, 
    or return a Runnable that manages this internally.
    
    For simplicity in server.py, we will return a helper class or just use this logic inside the server endpoint.
    But to keep logic here, let's return a dictionary of chains and a classifier.
    """
    return {
        "classifier": get_intent_chain(llm_model),
        "general": get_general_chain(llm_model),
        "rag": get_rag_chain(vector_store, llm_model, active_document=active_document)
    }
