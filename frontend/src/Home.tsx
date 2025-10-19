import React from "react";
import { Link } from "react-router-dom";
import "./css/home.style.css";

const features = [
    {
        title: "AI Trip Planner",
        desc: "Generate personalized itineraries with Gemini AI — instantly.",
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        link: "/",
    },
    {
        title: "Past Records",
        desc: "Review and revisit your previous travel plans anytime.",
        img: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80",
        link: "/history",
    },
    {
        title: "Smart Budgeting",
        desc: "Automatically estimate costs based on your trip style.",
        img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
        link: "/",
    },
    {
        title: "Packing Checklist",
        desc: "Never forget essentials — AI suggests packing items for you.",
        img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        link: "/",
    },
    {
        title: "Food & Culture Tips",
        desc: "Discover local cuisines and must-try experiences.",
        img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
        link: "/",
    },
    {
        title: "Travel Safety Insights",
        desc: "Stay safe abroad with AI-curated safety and local tips.",
        img: "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=800&q=80",
        link: "/",
    },
];


export default function Home() {
    return (
        <div className="container">
            <section className="intro">
                <h1>🌏 AI Travel Planner</h1>
                <p>Plan smarter. Travel better. Your personal AI travel assistant.</p>
                <Link to="/planner" className="cta-button">
                    Try It Now →
                </Link>
            </section>

            <div className="feature-grid">
                {features.map((f) => (
                    <Link to={f.link} key={f.title} className="feature-card">
                        <img src={f.img} alt={f.title} />
                        <div className="overlay">
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}