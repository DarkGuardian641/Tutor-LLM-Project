from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

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

def get_rag_chain(vector_store, llm_model: str = "gpt-oss:120b-cloud"):
    """
    Creates and returns the RAG chain for textbook questions.
    """
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    
    llm = ChatOllama(model=llm_model)

    template = """You are an intelligent tutor assistant designed to help students prepare for exams.
    
    Guidelines for your answer:
    1.  **Context First**: Use the provided context to answer the question.
    2.  **Fallback**: If the provided context is empty or does not contain the answer, you MUST state "I couldn't find specific information about this in your uploaded documents." and then provide a helpful answer based on your general knowledge.
    3.  **Structure**: Use bullet points or paragraphs.
    4.  **Tone**: Formal and educational.
    
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

def get_smart_response_chain(vector_store, llm_model: str = "gpt-oss:120b-cloud"):
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
        "rag": get_rag_chain(vector_store, llm_model)
    }
