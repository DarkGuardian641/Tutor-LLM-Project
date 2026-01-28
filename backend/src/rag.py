from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def get_rag_chain(vector_store, llm_model: str = "gpt-oss:120b-cloud"):
    """
    Creates and returns the RAG chain.
    """
    retriever = vector_store.as_retriever(search_kwargs={"k": 10})
    
    llm = ChatOllama(model=llm_model)

    template = """You are an intelligent tutor assistant designed to help students prepare for exams.
    Answer the following question using ONLY the provided context.
    
    Guidelines for your answer:
    1.  **Direct Answer**: Start with a clear, direct answer to the question.
    2.  **Explanation**: Provide a detailed explanation supporting your answer, citing key concepts from the text.
    3.  **Structure**: Use bullet points or paragraphs to make the answer easy to read and structured like a model exam answer.
    4.  **Tone**: Maintain a formal, academic, and educational tone.
    5.  **No Hallucination**: If the answer is not in the context, clearly state that the information is missing.

    Context:
    {context}

    Question: {question}
    
    Model Answer:
    """
    prompt = ChatPromptTemplate.from_template(template)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain

from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def get_rag_chain(vector_store, llm_model: str = "mistral"):
    """
    Creates and returns the RAG chain.
    """
    retriever = vector_store.as_retriever(search_kwargs={"k": 10})
    
    llm = ChatOllama(model=llm_model)

    template = """You are an intelligent tutor assistant designed to help students prepare for exams.
    Answer the following question using ONLY the provided context.
    
    Guidelines for your answer:
    1.  **Direct Answer**: Start with a clear, direct answer to the question.
    2.  **Explanation**: Provide a detailed explanation supporting your answer, citing key concepts from the text.
    3.  **Structure**: Use bullet points or paragraphs to make the answer easy to read and structured like a model exam answer.
    4.  **Tone**: Maintain a formal, academic, and educational tone.
    5.  **No Hallucination**: If the answer is not in the context, clearly state that the information is missing.

    Context:
    {context}

    Question: {question}
    
    Model Answer:
    """
    prompt = ChatPromptTemplate.from_template(template)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain
