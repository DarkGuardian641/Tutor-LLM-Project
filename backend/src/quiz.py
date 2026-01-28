from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List

# Define the expected JSON structure for a Question
class Question(BaseModel):
    question: str = Field(description="The question text")
    options: List[str] = Field(description="A list of 4 options (A, B, C, D)")
    answer: str = Field(description="The correct option (e.g., 'A')")
    explanation: str = Field(description="A 1-line explanation of why the correct answer is right")

class Quiz(BaseModel):
    questions: List[Question] = Field(description="A list of multiple choice questions")

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def get_quiz_chain(vector_store, llm_model: str = "gpt-oss:120b-cloud"):
    """
    Creates a chain to generate quizzes based on context.
    """
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    llm = ChatOllama(model=llm_model, temperature=0.7) # Higher temp for creativity
    
    # Set up JSON parser
    parser = JsonOutputParser(pydantic_object=Quiz)
    
    template = """You are an expert exam creator.
    Generate a quiz with {num_questions} multiple-choice questions (MCQs) about the topic: "{topic}".
    Difficulty Level: {difficulty}.
    
    Use the provided context to ensure the questions are accurate and relevant to the material.
    If the context is insufficient, use your general knowledge but prioritze the context.
    
    Context:
    {context}
    
    {format_instructions}
    
    Make sure to provide exactly 4 options for each question.
    Ensure each question has a concise 1-line explanation for the correct answer.
    """
    
    prompt = ChatPromptTemplate.from_template(
        template,
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    chain = (
        {"context": retriever | format_docs, "topic": RunnablePassthrough(), "num_questions": RunnablePassthrough(), "difficulty": RunnablePassthrough()} 
        # Note: RunnablePassthrough passes the input dict, so we need to itemgetter or just pass the whole dict to prompt
        | prompt
        | llm
        | parser
    )
    
    # We need to wrap it to handle the input dictionary correctly
    # The chain expects a dictionary with 'topic', 'num_questions', 'difficulty'
    # The retriever needs 'topic' as the query string
    
    def run_quiz_gen(input_data):
        # 1. Retrieve docs manually or via chain
        # Let's rebuild the chain to be cleaner
        
        docs = retriever.invoke(input_data["topic"])
        formatted_context = format_docs(docs)
        
        final_prompt = prompt.invoke({
            "context": formatted_context,
            "topic": input_data["topic"],
            "num_questions": input_data["count"],
            "difficulty": input_data["difficulty"]
        })
        
        response = llm.invoke(final_prompt)
        return parser.invoke(response)

    return run_quiz_gen
