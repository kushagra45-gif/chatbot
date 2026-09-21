import { Sparkles, Code2, Compass, GraduationCap, Lightbulb } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: Lightbulb,
    title: 'Explain quantum computing',
    prompt: 'Explain quantum computing simply and clearly as if I am 15 years old.',
    desc: 'Break down complex science simply',
  },
  {
    icon: Code2,
    title: 'Write a Python function',
    prompt: 'Write a Python function that parses JSON data, validates keys, and handles errors gracefully. Include comments.',
    desc: 'Clean, production-ready code with comments',
  },
  {
    icon: Compass,
    title: 'Plan a 3-day trip',
    prompt: 'Plan a relaxing 3-day weekend itinerary for a trip to the mountains with budget-friendly recommendations.',
    desc: 'Itinerary, food, and packing tips',
  },
  {
    icon: GraduationCap,
    title: 'Give me a study plan',
    prompt: 'Create a structured 4-week study schedule for preparing for upcoming exams, including review days and breaks.',
    desc: 'Organized daily schedule with review cycles',
  },
];

export function WelcomeScreen({ onSelectSuggestion }) {
  return (
    <div className="welcome-container animate-fade-in">
      <div className="welcome-header">
        <div className="welcome-icon-wrap">
          <Sparkles size={36} color="var(--accent-primary)" />
        </div>
        <h1 className="welcome-title">What can I help with today?</h1>
        <p className="welcome-subtitle">
          Ask questions, analyze documents, write code, or explore ideas with ChatGPT Clone.
        </p>
      </div>

      <div className="suggestions-grid">
        {SUGGESTIONS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <button
              key={idx}
              className="suggestion-card"
              onClick={() => onSelectSuggestion(s.prompt)}
              type="button"
            >
              <div className="suggestion-icon-title">
                <Icon size={18} className="suggestion-card-icon" />
                <span className="suggestion-card-title">{s.title}</span>
              </div>
              <span className="suggestion-card-desc">{s.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
