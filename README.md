# 🌍 AI Travel Planner

An intelligent AI-powered travel itinerary planner built with **FastAPI**, **React (Vite)**, and **Gemini API**.  
Users can enter their travel details — origin, destination, departure date, and trip length — and receive a personalized, AI-generated travel plan.  
Each session is saved locally using **SQLite**, so returning visitors can view their previous itineraries.

---

## ✨ Features

### 🧠 AI-Powered Itinerary Generation
- Integrates **Gemini API** to generate custom itineraries in real time.  
- Suggests places to visit, food recommendations, and daily schedules.  
- Supports:
  - Custom travel pace *(relaxed / normal / fast)*
  - Budget level *(low / medium / high)*
  - Departure time *(date picker)*
  - Trip length *(custom input)*

---

### 💾 Persistent Session History
- Every visitor session is recorded using **FastAPI Session**.  
- Stores generated plans in **SQLite** (via SQLAlchemy ORM).  
- Provides a dedicated **History** page to view past trip records.  

---

### ⚙️ Full Stack Integration
- **Frontend:** React + TypeScript + Vite  
- **Backend:** FastAPI (Python)  
- **Database:** SQLite  
- **AI Engine:** Gemini API  

---

### 🖥️ Modern & Clean UI
- Responsive layout built with pure CSS and grid system.  
- Elegant hero banner with hover effects and smooth animations.  
- Simple and intuitive user experience.  

---

## ⚡ Installation & Setup

### 🐍 Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
### 🧱 Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Visit: 👉 http://localhost:5173

### ⚙️ Environment Variables
Create a .env file inside the backend/ directory:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
MYSQL_URL=sqlite:///./ai_travel.db
```
SQLite will automatically create a local file ai_travel.db in your backend folder.