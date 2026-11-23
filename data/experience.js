/* ==========================================================================
   EXPERIENCE  -  newest first. `end: null` means "Present".
   Dates are 'YYYY-MM'. Duration is calculated automatically.
   ========================================================================== */
window.PF = window.PF || {};
PF.data = PF.data || {};

PF.data.experience = [
  {
    id: 'infosys',
    role: 'System Engineer',
    company: 'Infosys',
    type: 'Full-time',
    start: '2026-08',
    end: null,
    summary: 'Working with Snowflake and data technologies while continuing to explore AI-driven tools and workflows.',
    highlights: [
      'Work with Snowflake and the surrounding data technologies as part of an engineering team',
      'Apply data-engineering fundamentals alongside my AI/ML background',
      'Explore AI-driven technologies and look for practical ways to use them'
    ],
    tech: ['Snowflake', 'SQL', 'Data Technologies']
  },
  {
    id: 'hubnex-labs',
    role: 'AI/ML Intern',
    company: 'Hubnex Labs',
    type: 'Internship',
    start: '2024-12',
    end: '2025-05',
    summary: 'Built the AI Interviewer Bot, a resume-aware conversational interviewer.',
    highlights: [
      'Built the AI Interviewer Bot end to end as the internship project',
      'Processed resumes with LangChain and retrieved context using FAISS',
      'Integrated Dialogflow CX for conversation flow and Google Generative AI for question generation'
    ],
    tech: ['LangChain', 'FAISS', 'Dialogflow CX', 'Google Generative AI'],
    project: 'ai-interviewer-bot' // links to the project modal
  }
];
