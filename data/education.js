/* ==========================================================================
   EDUCATION + LEARNING JOURNEY
   ========================================================================== */
window.PF = window.PF || {};
PF.data = PF.data || {};

PF.data.education = [
  {
    id: 'btech',
    degree: 'B.Tech in Computer Science and Engineering (AI & ML)',
    university: 'Dr. A.P.J. Abdul Kalam Technical University',
    institute: 'Meerut Institute of Engineering and Technology',
    focus: ['Artificial Intelligence', 'Machine Learning', 'Data Structures & Algorithms', 'Software Engineering']
  }
];

/* The learning journey: ordered stages. status: 'done' | 'current' | 'next' */
PF.data.learning = {
  intro:
    'I treat learning as part of the job. Each stage below started with a concept I wanted to understand properly and ended with something I built.',
  stages: [
    {
      title: 'Foundations',
      status: 'done',
      detail: 'Python, data structures, statistics and classical machine learning with Scikit-learn and XGBoost.',
      tags: ['Python', 'Scikit-learn', 'XGBoost', 'Statistics']
    },
    {
      title: 'Deep learning & vision',
      status: 'done',
      detail: 'Neural networks, CNNs and computer vision, from plant-disease classification to YOLOv8 plate recognition.',
      tags: ['PyTorch', 'CNN', 'YOLOv8', 'OCR']
    },
    {
      title: 'GenAI & retrieval',
      status: 'done',
      detail: 'LLM integration, embeddings and RAG with LangChain and FAISS during my internship at Hubnex Labs.',
      tags: ['LangChain', 'FAISS', 'RAG', 'Dialogflow CX']
    },
    {
      title: 'Agentic systems',
      status: 'current',
      detail: 'Stateful agents with LangGraph and tool calling: workflows that plan, act and remember.',
      tags: ['LangGraph', 'AI Agents', 'Tool Calling']
    },
    {
      title: 'Cloud-scale AI & data',
      status: 'current',
      detail: 'Snowflake at work and AWS Bedrock on the side, learning how foundation models fit into cloud data platforms.',
      tags: ['Snowflake', 'AWS Bedrock']
    },
    {
      title: 'Robotics',
      status: 'next',
      detail: 'Connecting perception and decision-making to the physical world is the next frontier I want to explore.',
      tags: ['Robotics', 'Perception', 'Control']
    }
  ],
  /* Shown as "Currently learning" chips. Optional `skill` id links to the skill panel. */
  now: [
    { label: 'AWS Bedrock', skill: 'aws-bedrock' },
    { label: 'LangGraph agents', skill: 'langgraph' },
    { label: 'Transformers', skill: 'transformers' },
    { label: 'Snowflake', skill: 'snowflake' },
    { label: 'Robotics' }
  ]
};
