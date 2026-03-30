from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from chatbot import ingest, query

app = FastAPI()

class IngestRequest(BaseModel):
    videoUrl: str

class IngestResponse(BaseModel):
    message: str
    suggestedQuestions: List[str] = []

class QueryRequest(BaseModel):
    videoId: str
    question: str
    history: str = ""

class QueryResponse(BaseModel):
    answer: str

@app.get("/")
def read_root():
    return {"message": "Python RAG Service is running"}

@app.post("/ingest", response_model=IngestResponse)
def ingest_endpoint(request: IngestRequest):
    if not request.videoUrl:
        raise HTTPException(status_code=400, detail="videoUrl is required")
    try:
        result = ingest(request.videoUrl)
        if result == "No transcript available":
            raise HTTPException(status_code=400, detail="No transcript available for this video")
        if isinstance(result, dict):
            return result
        return {"message": result, "suggestedQuestions": []}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"INGEST ERROR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse)
def query_endpoint(request: QueryRequest):
    if not request.videoId or not request.question or request.history is None:
        raise HTTPException(status_code=400, detail="videoId, question, and history are required")
    try:
        answer = query(request.videoId, request.question, request.history)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
