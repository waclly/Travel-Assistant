import os
import json
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session as DBSession

import google.generativeai as genai

# ----------------- Config -----------------
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MYSQL_URL = os.getenv("MYSQL_URL", "sqlite:///./ai_travel.db")
engine = create_engine(
    MYSQL_URL,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in MYSQL_URL else {},
)


if not GEMINI_API_KEY:
    raise RuntimeError("Please set GEMINI_API_KEY in .env")

genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="AI Travel Planner", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- DB Config -----------------
Base = declarative_base()
engine = create_engine(MYSQL_URL, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class TravelRecord(Base):
    __tablename__ = "travel_records"

    id = Column(Integer, primary_key=True, index=True)
    origin = Column(String(100))
    destination = Column(String(100))
    depart_time = Column(String(50))
    trip_length_days = Column(Integer)
    preferences = Column(Text)
    response = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- Pydantic Models ----------
class Preference(BaseModel):
    travel_style: Optional[str] = Field(
        None, description="travel style: food, culture, nature, etc."
    )
    budget_tier: Optional[str] = Field(
        None, description="budget level: budget / mid / luxury"
    )
    pace: Optional[str] = Field(None, description="pace: relaxed / normal / tight")
    notes: Optional[str] = Field(None, description="additional notes")


class PlanRequest(BaseModel):
    origin: str
    destination: str
    depart_time: str
    trip_length_days: int = Field(..., ge=1, le=30)
    preferences: Optional[Preference] = None
    language: str = Field(default="en")

    @field_validator("depart_time")
    @classmethod
    def validate_depart_time(cls, v: str):
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except Exception:
            raise ValueError("depart_time must be ISO 8601 format")
        return v


class Poi(BaseModel):
    name: str
    category: str
    address: Optional[str] = None
    time_suggested_hours: Optional[float] = None
    notes: Optional[str] = None
    cost_estimate: Optional[str] = None
    transport: Optional[str] = None


class Meal(BaseModel):
    name: str
    type: str  # breakfast / lunch / dinner / snack
    reservation_needed: Optional[bool] = None
    notes: Optional[str] = None


class DayPlan(BaseModel):
    date: str
    summary: str
    schedule: List[str]
    pois: List[Poi]
    meals: List[Meal]
    logistics: Optional[str] = None
    tips: Optional[str] = None


class PlanResponse(BaseModel):
    destination: str
    start_date: str
    end_date: str
    total_days: int
    overview: str
    daily: List[DayPlan]
    packing_list: List[str]
    budget_summary: Optional[str] = None
    disclaimers: Optional[str] = None


# ---------- Prompt Builder ----------
def build_prompt(req: PlanRequest) -> str:
    return f"""
You are a professional travel planner.
Generate a detailed {req.language} travel itinerary in pure JSON format only — no explanations or extra text.

Input details:
- Origin: {req.origin}
- Destination: {req.destination}
- Departure: {req.depart_time}
- Trip length: {req.trip_length_days} days
- Preferences: {req.preferences.model_dump() if req.preferences else "not specified"}

Output structure:
{{
  "destination": "string",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "total_days": {req.trip_length_days},
  "overview": "string",
  "daily": [
    {{
      "date": "YYYY-MM-DD",
      "summary": "string",
      "schedule": ["09:00 Depart", "11:00 Arrive downtown"],
      "pois": [
        {{
          "name": "string",
          "category": "landmark/museum/nature/shopping/other",
          "address": "string",
          "time_suggested_hours": 1.5,
          "notes": "string",
          "cost_estimate": "string",
          "transport": "string"
        }}
      ],
      "meals": [
        {{
          "name": "string",
          "type": "breakfast/lunch/dinner/snack",
          "reservation_needed": true,
          "notes": "string"
        }}
      ],
      "logistics": "string",
      "tips": "string"
    }}
  ],
  "packing_list": ["Passport", "Universal adapter", "..."],
  "budget_summary": "string",
  "disclaimers": "string"
}}

Rules:
1. Return ONLY valid JSON.
2. Do not add comments, markdown, or backticks.
3. Ensure every string is properly closed and escaped.
"""


# ---------- Gemini Call ----------
def call_gemini(req: PlanRequest) -> PlanResponse:
    GEMINI_MODEL = "gemini-2.0-flash-lite"

    model = genai.GenerativeModel(GEMINI_MODEL)
    config = {
        "temperature": 0.6,
        "top_p": 0.9,
        "max_output_tokens": 4096,
        "response_mime_type": "application/json",
    }
    prompt = build_prompt(req)

    try:
        resp = model.generate_content(prompt, generation_config=config)
        raw = resp.text.strip()

        # Try to recover valid JSON if Gemini adds extra text
        if not raw.startswith("{"):
            idx = raw.find("{")
            if idx != -1:
                raw = raw[idx:]
        if not raw.endswith("}"):
            idx = raw.rfind("}")
            if idx != -1:
                raw = raw[: idx + 1]

        try:
            data = json.loads(raw)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON returned: {e}")

        return PlanResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")


# ---------- Routes ----------
@app.get("/")
def root():
    return {"ok": True, "service": "AI Travel Planner API"}


@app.post("/plan", response_model=PlanResponse)
def plan(req: PlanRequest, db: DBSession = Depends(get_db)):
    data = call_gemini(req)
    record = TravelRecord(
        origin=req.origin,
        destination=req.destination,
        depart_time=req.depart_time,
        trip_length_days=req.trip_length_days,
        preferences=json.dumps(req.preferences.model_dump() if req.preferences else {}),
        response=json.dumps(data if isinstance(data, dict) else data.dict()),
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    return data


@app.get("/history")
def get_history(db: DBSession = Depends(get_db)):
    records = (
        db.query(TravelRecord).order_by(TravelRecord.created_at.desc()).limit(20).all()
    )
    return [
        {
            "id": r.id,
            "origin": r.origin,
            "destination": r.destination,
            "depart_time": r.depart_time,
            "trip_length_days": r.trip_length_days,
            "created_at": r.created_at.isoformat(),
        }
        for r in records
    ]


@app.get("/history/{record_id}")
def get_record_detail(record_id: int, db: DBSession = Depends(get_db)):
    r = db.query(TravelRecord).filter(TravelRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Record not found")
    return json.loads(r.response)


from fastapi.responses import JSONResponse


@app.delete("/history/{record_id}")
def delete_record(record_id: int, db: DBSession = Depends(get_db)):
    record = db.query(TravelRecord).filter(TravelRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return JSONResponse(
        content={"message": "Record deleted successfully", "id": record_id}
    )
