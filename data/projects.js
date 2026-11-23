/* ==========================================================================
   PROJECTS  -  data-driven. To add a project, copy any object below, paste it at
   the end of the array and edit the fields. The grid, filters, modal, skill links
   and architecture diagram are all generated from this data.

   Fields
     id            unique slug
     title, type   card heading + short category label
     featured      true -> sorted first and shown as a wide, full-row card
     internship    true -> shows the company name instead of "Personal project"
     company       (optional) shown when internship is true
     summary       1-2 sentences for the card
     problem       the problem statement (modal)
     description   what you built (modal)
     tech          technology chips (these power the "filter by technology" bar)
     skills        skill ids from data/skills.js (links the project to the skills panel)
     features      bullet list
     achievements  bullet list
     flow          architecture / workflow as ordered steps: { label, detail }
                   (renders as a diagram - or set `image` to use your own PNG/SVG/WebP)
     image         optional path to an architecture image, e.g. 'assets/img/my-arch.png'
     repo          GitHub URL (leave '' to hide the button)
     demo          live demo URL (leave '' to hide the button)
     hue           card accent: 'violet' | 'blue' | 'cyan' | 'indigo' | 'teal' | 'rose'
   ========================================================================== */
window.PF = window.PF || {};
PF.data = PF.data || {};

PF.data.projects = [
  {
    id: 'ai-interviewer-agent',
    title: 'AI Interviewer Agent',
    type: 'Agentic AI',
    featured: true,
    hue: 'violet',
    summary:
      'A stateful interviewer that reads a candidate’s resume, retrieves relevant context and runs a context-aware interview as a LangGraph workflow.',
    problem:
      'Mock interviews and first-round screening are repetitive, and generic question banks ignore what a candidate has actually done. A useful interviewer has to remember the conversation and ground every question in the resume.',
    description:
      'An agentic interview system orchestrated with LangGraph. Resumes are chunked and embedded into a FAISS index; the agent retrieves the most relevant experience, generates targeted questions with an LLM and carries the conversation state forward so follow-ups stay in context.',
    tech: ['Python', 'LangChain', 'LangGraph', 'FAISS', 'LLM Integration'],
    skills: ['python', 'langchain', 'langgraph', 'faiss', 'vector-databases', 'rag', 'llm-integration', 'ai-agents'],
    features: [
      'FAISS-based resume retrieval for grounded questions',
      'Interview question generation tailored to the candidate’s experience',
      'Context-aware, multi-turn conversations driven by graph state',
      'Explicit LangGraph nodes and edges, so the interview flow is inspectable'
    ],
    achievements: [
      'Modelled the interview as a LangGraph state machine instead of a single long prompt',
      'Grounded question generation in retrieved resume context to avoid generic questions',
      'Kept conversation memory in graph state so follow-ups build on earlier answers'
    ],
    flow: [
      { label: 'Resume', detail: 'Candidate upload' },
      { label: 'Chunk + embed', detail: 'LangChain splitters' },
      { label: 'FAISS index', detail: 'Vector retrieval' },
      { label: 'Plan question', detail: 'LangGraph node' },
      { label: 'Ask + listen', detail: 'LLM conversation' },
      { label: 'Update state', detail: 'Loop to next turn' }
    ],
    image: '',
    repo: '',
    demo: ''
  },
  {
    id: 'hr-ai-assistant',
    title: 'HR AI Assistant',
    type: 'Generative AI',
    hue: 'blue',
    summary:
      'An AI-powered HR assistant that answers people-operations questions by pairing an LLM with intelligent information retrieval.',
    problem:
      'Employees and HR teams spend time answering the same policy and process questions, and the answers are buried in documents nobody wants to search.',
    description:
      'An assistant that retrieves the relevant HR information for a question and uses an integrated LLM to turn it into a clear, conversational answer.',
    tech: ['Python', 'LLM Integration', 'Information Retrieval'],
    skills: ['python', 'llm-integration', 'rag'],
    features: [
      'AI-powered HR question answering',
      'LLM integration for natural, conversational responses',
      'Intelligent retrieval of the right HR information for each question'
    ],
    achievements: [
      'Combined retrieval with an LLM so answers come from HR content rather than model guesswork',
      'Turned scattered HR information into a single conversational interface'
    ],
    flow: [
      { label: 'Question', detail: 'Employee or HR user' },
      { label: 'Retrieve', detail: 'Relevant HR information' },
      { label: 'LLM', detail: 'Grounded generation' },
      { label: 'Answer', detail: 'Clear response' }
    ],
    image: '',
    repo: '',
    demo: ''
  },
  {
    id: 'plant-disease-classification',
    title: 'Plant Disease Classification',
    type: 'Deep Learning',
    hue: 'teal',
    summary:
      'A deep-learning image classifier that recognises plant diseases across 10 classes from a leaf photo, served through a Flask web app.',
    problem:
      'Crop diseases are often caught late because diagnosis needs an expert. A fast first check from a photo of a leaf can help people act earlier.',
    description:
      'A convolutional image classifier trained to distinguish 10 plant-disease classes, wrapped in a Flask application where a user uploads a leaf image and gets a prediction back.',
    tech: ['Python', 'Deep Learning', 'CNN', 'Image Classification', 'Flask'],
    skills: ['python', 'neural-networks', 'computer-vision', 'flask'],
    features: [
      '10-class plant disease classification',
      'Image preprocessing and augmentation for robust training',
      'Flask deployment with a simple upload-and-predict interface'
    ],
    achievements: [
      'Took a model from training all the way to a working web deployment',
      'Handled a multi-class problem with 10 distinct disease categories'
    ],
    flow: [
      { label: 'Leaf image', detail: 'User upload' },
      { label: 'Preprocess', detail: 'Resize + normalise' },
      { label: 'CNN', detail: '10-class classifier' },
      { label: 'Prediction', detail: 'Class + confidence' },
      { label: 'Flask UI', detail: 'Result page' }
    ],
    image: '',
    repo: '',
    demo: ''
  },
  {
    id: 'anpr',
    title: 'Automatic Number Plate Recognition',
    type: 'Computer Vision',
    hue: 'cyan',
    summary:
      'A video pipeline that detects vehicle number plates with YOLOv8, tracks them across frames with SORT and reads them with EasyOCR.',
    problem:
      'Reading plates from video is not just detection: the same vehicle appears in many frames, so a useful system needs stable identities and reliable text recognition.',
    description:
      'An end-to-end computer-vision pipeline: YOLOv8 finds plates in each frame, SORT assigns persistent track IDs, and EasyOCR reads the cropped plate so each vehicle resolves to a single plate reading.',
    tech: ['Python', 'YOLOv8', 'EasyOCR', 'SORT', 'Computer Vision'],
    skills: ['python', 'computer-vision', 'neural-networks'],
    features: [
      'Plate detection with YOLOv8',
      'Multi-object tracking with SORT for stable vehicle identities',
      'Text extraction from cropped plates with EasyOCR'
    ],
    achievements: [
      'Combined detection, tracking and OCR into one coherent pipeline',
      'Used tracking to associate many frames with a single vehicle rather than treating frames independently'
    ],
    flow: [
      { label: 'Video frames', detail: 'Input stream' },
      { label: 'YOLOv8', detail: 'Plate detection' },
      { label: 'SORT', detail: 'Track IDs' },
      { label: 'Crop', detail: 'Plate region' },
      { label: 'EasyOCR', detail: 'Text recognition' },
      { label: 'Plate text', detail: 'Per vehicle' }
    ],
    image: '',
    repo: '',
    demo: ''
  },
  {
    id: 'shipment-prediction',
    title: 'Shipment Prediction System',
    type: 'ML / MLOps',
    hue: 'indigo',
    summary:
      'A machine-learning service for shipment prediction, exposed through FastAPI, backed by MongoDB and monitored with Evidently AI.',
    problem:
      'A model that scores well offline can quietly degrade in production. A shipment predictor needs a clean serving layer, persistent data and monitoring for drift.',
    description:
      'A prediction system that trains a machine-learning model on shipment data, serves it through a FastAPI service, stores data in MongoDB and uses Evidently AI to monitor data and model quality.',
    tech: ['Python', 'FastAPI', 'MongoDB', 'Machine Learning', 'Evidently AI'],
    skills: ['python', 'fastapi', 'mongodb', 'model-evaluation'],
    features: [
      'Machine-learning model for shipment prediction',
      'FastAPI inference service with validated requests',
      'MongoDB for data and prediction storage',
      'Evidently AI reports for data drift and model monitoring'
    ],
    achievements: [
      'Built the full loop from data to model to API to monitoring',
      'Added drift monitoring so model health is observable after deployment'
    ],
    flow: [
      { label: 'Shipment data', detail: 'MongoDB' },
      { label: 'Train model', detail: 'Machine learning' },
      { label: 'FastAPI', detail: 'Inference service' },
      { label: 'Prediction', detail: 'Stored + returned' },
      { label: 'Evidently AI', detail: 'Drift reports' }
    ],
    image: '',
    repo: '',
    demo: ''
  },
  {
    id: 'ai-interviewer-bot',
    title: 'AI Interviewer Bot',
    type: 'Generative AI',
    internship: true,
    company: 'Hubnex Labs',
    hue: 'rose',
    summary:
      'Internship project at Hubnex Labs: a conversational interviewer that processes resumes and generates questions with Google Generative AI inside Dialogflow CX.',
    problem:
      'Screening interviews take recruiter time, and a scripted chatbot cannot adapt to each candidate’s background. The goal was a conversational flow that knows the resume.',
    description:
      'Built during my AI/ML internship: resumes are processed with LangChain and indexed in FAISS, Dialogflow CX manages the conversation, and Google Generative AI generates the interview questions.',
    tech: ['Python', 'LangChain', 'FAISS', 'Dialogflow CX', 'Google Generative AI'],
    skills: ['python', 'langchain', 'faiss', 'vector-databases', 'rag', 'llm-integration', 'google-cloud'],
    features: [
      'Resume processing and retrieval with LangChain and FAISS',
      'Conversation management with Dialogflow CX',
      'Question generation with Google Generative AI'
    ],
    achievements: [
      'Delivered a working interviewer bot as an intern at Hubnex Labs',
      'Integrated retrieval, a conversation platform and a generative model into one flow'
    ],
    flow: [
      { label: 'Resume', detail: 'Document input' },
      { label: 'Process', detail: 'LangChain' },
      { label: 'FAISS', detail: 'Retrieve context' },
      { label: 'Dialogflow CX', detail: 'Conversation flow' },
      { label: 'Generative AI', detail: 'Question generation' }
    ],
    image: '',
    repo: '',
    demo: ''
  }
];
