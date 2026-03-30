# from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_nvidia_ai_endpoints import ChatNVIDIA, NVIDIAEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone
from dotenv import load_dotenv
from supadata import Supadata,SupadataError
import os

load_dotenv()

# --- INIT ---

model = ChatNVIDIA(model='openai/gpt-oss-120b')
embeddings = NVIDIAEmbeddings(model='nvidia/nv-embedqa-e5-v5')

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("video-rag")
supadata = Supadata(os.getenv("SUPADATA_API_KEY"))
# --- 1. INGEST ---
def extract_video_id(url):
    try:
        # shortened youtube url (e.g. https://youtu.be/VIDEO_ID)
        if "youtu.be" in url:
            return url.split("/")[-1]
        # full youtube url (e.g. https://www.youtube.com/watch?v=VIDEO_ID)
        return url.split("?v=")[-1].split("&")[0]
    except IndexError:
        return None

def ingest(videoUrl):
    video_id = extract_video_id(videoUrl)

    stats = index.describe_index_stats()
    namespace_stats = stats.namespaces.get(video_id)
    if namespace_stats and namespace_stats.vector_count > 0:
        # Generate questions from existing vectors
        vector_store = PineconeVectorStore(
            index_name="video-rag",
            embedding=embeddings,
            namespace=video_id
        )
        retriever = vector_store.as_retriever(search_kwargs={'k': 3})
        existing_docs = retriever.invoke("video summary")
        suggested_questions = generate_suggested_questions(existing_docs)
        return {"message": "Already ingested", "suggestedQuestions": suggested_questions}

    try:
        # transcript_list = YouTubeTranscriptApi().fetch(video_id, languages=['en','en-IN'])
        # transcript = " ".join(chunk['text'] for chunk in transcript_list.to_raw_data())
        transcript = supadata.transcript(
            url=videoUrl,
            lang="en",
            text=True,
            mode="auto"
        )
        transcript = transcript.content

    except SupadataError:
        return "No transcript available"
    except Exception as e:
        print(f"Transcript error: {e}")
        return "No transcript available"

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    docs = splitter.create_documents([transcript])
    
    # store in pinecone
    PineconeVectorStore.from_documents(
        docs,
        embedding=embeddings,
        index_name="video-rag",
        namespace=video_id
    )

    # Generate suggested questions from first few chunks
    suggested_questions = generate_suggested_questions(docs[:3])

    return {"message": "Ingested", "suggestedQuestions": suggested_questions}


def generate_suggested_questions(docs):
    """Generate 3 suggested questions from document chunks using LLM."""
    try:
        context = "\n\n".join([doc.page_content[:500] for doc in docs])
        
        prompt = PromptTemplate(
            template="""
            Based on the following video transcript excerpts, generate 3 natural questions that a viewer might ask about this video content.

            Context:
            {context}

            Provide exactly 3 questions, one per line. Make them specific to the content.

            Questions:
            """,
            input_variables=["context"]
        )
        
        chain = prompt | model | StrOutputParser()
        result = chain.invoke({"context": context})
        
        # Parse questions from result
        questions = [q.strip() for q in result.strip().split('\n') if q.strip() and '?' in q]
        return questions[:3]
    except Exception as e:
        print(f"Error generating questions: {e}")
        return []

def query(video_id, question, history=""):

    vector_store = PineconeVectorStore(
        index_name="video-rag",
        embedding=embeddings,
        namespace=video_id
    )

    retriever = vector_store.as_retriever(
        search_type='similarity',
        search_kwargs={'k': 4}
    )

    prompt = PromptTemplate(
        template = """
        You are an intelligent assistant answering questions based on a YouTube video.
        Your job is to provide accurate, helpful answers using ONLY the provided context.

        ---------------------
        CONVERSATION HISTORY:
        {history}
        ---------------------

        CONTEXT FROM VIDEO:
        {context}
        ---------------------

        QUESTION:
        {question}
        ---------------------

        INSTRUCTIONS:

        1. Use ONLY the provided context to answer.
        2. Do NOT use outside knowledge.
        3. If the answer is not clearly present, say:
           "I don't know based on the video."

        4. If the question is a follow-up, use the conversation history to understand it.

        5. Keep answers:
           - clear
           - concise
           - well-structured

        6. When possible:
           - explain concepts step-by-step
           - include key points from the video

        7. Do NOT hallucinate or guess.

        ---------------------

        ANSWER:
        """,
        input_variables=['context', 'question', 'history']
    )

    def format_docs(docs):
        return "\n\n".join([doc.page_content for doc in docs])

    parallel_chain = RunnableParallel({
        'context': RunnableLambda(lambda x: x['question']) | retriever | RunnableLambda(format_docs),
        'question': lambda x: x['question'],
        'history': lambda x: x['history']
    })

    parser = StrOutputParser()
    chain = parallel_chain | prompt | model | parser

    return chain.invoke({"question": question, "history": history})

# print(ingest("Ih_4C6DJ0EU"))
# print(query("Ih_4C6DJ0EU", "What is this video about?"))
