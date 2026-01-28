from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

class Flashcard(BaseModel):
    question: str = Field(description="The question on the front of the card")
    answer: str = Field(description="The concise 1-line answer on the back")

class FlashcardSet(BaseModel):
    flashcards: List[Flashcard]

def get_flashcard_chain(vector_store, llm_model: str = "gpt-oss:120b-cloud"):
    """
    Creates and returns a chain for generating flashcards in JSON format.
    """
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    
    llm = ChatOllama(model=llm_model, temperature=0.5)

    parser = JsonOutputParser(pydantic_object=FlashcardSet)

    template = """You are an intelligent tutor helper.
    Create 10 flashcards based on the following context for the given topic: "{topic}".
    
    Context:
    {context}
    
    {format_instructions}
    
    Make the questions conceptual and the answers concise (1 sentence max).
    """
    
    prompt = ChatPromptTemplate.from_template(
        template,
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )

    chain = (
        {"context": retriever | format_docs, "topic": RunnablePassthrough()}
        | prompt
        | llm
        | parser
    )

    return chain
