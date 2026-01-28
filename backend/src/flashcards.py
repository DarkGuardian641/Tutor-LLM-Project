from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def get_flashcard_chain(vector_store, llm_model: str = "gpt-oss:120b-cloud"):
    """
    Creates and returns a chain for generating flashcards.
    """
    retriever = vector_store.as_retriever(search_kwargs={"k": 10})
    
    llm = ChatOllama(model=llm_model)

    template = """You are an intelligent tutor helper.
    Create 10 flashcards based on the following context for the given topic.
    
    Topic: {topic}
    
    Context:
    {context}
    
    Format each flashcard exactly as follows:
    card_start
    Q: [Question]
    A: [Answer]
    card_end
    
    Make the questions conceptual and the answers concise.
    """
    
    prompt = ChatPromptTemplate.from_template(template)

    chain = (
        {"context": retriever | format_docs, "topic": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain
