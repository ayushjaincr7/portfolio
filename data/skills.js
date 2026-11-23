/* ==========================================================================
   SKILLS  -  data-driven. Add a skill by adding one object to a category.

   level   : 0-100 default proficiency (the owner can adjust it live from the UI;
             edit the number here to change the published default).
   status  : '' | 'learning'  (learning shows a badge)
   tools   : related technologies / ecosystem shown in the skill panel
   aliases : alternative names so certificates and projects can link to the skill
   Projects link to skills through their `skills: [ids]`; certificates link through the
   skills typed in the upload form (matched on id, name or alias).
   ========================================================================== */
window.PF = window.PF || {};
PF.data = PF.data || {};

PF.data.skillCategories = [
  {
    id: 'languages',
    name: 'Programming Languages',
    short: 'Languages',
    icon: 'code-xml',
    certCategory: 'Programming',
    blurb: 'The foundations everything else is built on.',
    skills: [
      {
        id: 'python',
        name: 'Python',
        level: 90,
        aliases: ['py'],
        desc: 'My primary language for machine learning, GenAI and backend work, from LangGraph agents and RAG pipelines to computer-vision and API services.',
        tools: ['NumPy', 'Pandas', 'Jupyter', 'Pydantic', 'pytest']
      },
      {
        id: 'cpp',
        name: 'C++',
        level: 65,
        aliases: ['c++', 'cplusplus'],
        desc: 'Used for data structures, algorithms and performance-minded problem solving, and a useful base for understanding memory and systems behaviour.',
        tools: ['STL', 'CMake', 'g++', 'Competitive programming']
      },
      {
        id: 'sql',
        name: 'SQL',
        level: 75,
        aliases: ['sql queries'],
        desc: 'Querying, joining and transforming relational data. It is now part of my day-to-day work with Snowflake.',
        tools: ['Snowflake SQL', 'Window functions', 'CTEs', 'Query optimisation']
      }
    ]
  },
  {
    id: 'ml',
    name: 'Machine Learning',
    short: 'ML',
    icon: 'brain',
    certCategory: 'Machine Learning',
    blurb: 'Classical modelling done rigorously: features, metrics, evidence.',
    skills: [
      {
        id: 'scikit-learn',
        name: 'Scikit-learn',
        level: 82,
        aliases: ['sklearn', 'scikit learn'],
        desc: 'Building baselines and production-grade classical models: preprocessing pipelines, cross-validation, hyperparameter search and model comparison.',
        tools: ['Pipelines', 'GridSearchCV', 'ColumnTransformer', 'joblib']
      },
      {
        id: 'xgboost',
        name: 'XGBoost',
        level: 72,
        aliases: ['gradient boosting', 'xgb'],
        desc: 'Gradient-boosted trees for strong tabular performance, with attention to regularisation, early stopping and feature importance.',
        tools: ['LightGBM', 'SHAP', 'Optuna', 'Early stopping']
      },
      {
        id: 'feature-engineering',
        name: 'Feature Engineering',
        level: 78,
        aliases: ['features'],
        desc: 'Turning raw data into signal: encoding, scaling, aggregation, leakage checks and domain-driven features that move the metric.',
        tools: ['Pandas', 'Encoders', 'Feature selection', 'Leakage audits']
      },
      {
        id: 'model-evaluation',
        name: 'Model Evaluation',
        level: 80,
        aliases: ['evaluation', 'model monitoring', 'metrics'],
        desc: 'Choosing the right metric, validating honestly and monitoring models after deployment, including drift and data-quality checks.',
        tools: ['Cross-validation', 'ROC / PR curves', 'Confusion matrix', 'Evidently AI']
      },
      {
        id: 'statistical-learning',
        name: 'Statistical Learning',
        level: 70,
        aliases: ['statistics', 'probability', 'statistical learning theory'],
        desc: 'The maths behind the models: probability, estimation, bias-variance trade-off and regularisation. I like to know why a method works before I use it.',
        tools: ['Probability', 'Hypothesis testing', 'Bias-variance', 'Regularisation']
      }
    ]
  },
  {
    id: 'dl',
    name: 'Deep Learning',
    short: 'Deep Learning',
    icon: 'network',
    certCategory: 'Deep Learning',
    blurb: 'Neural networks for vision and language.',
    skills: [
      {
        id: 'pytorch',
        name: 'PyTorch',
        level: 75,
        aliases: ['torch'],
        desc: 'Defining, training and debugging neural networks with explicit control over the training loop, losses and data pipelines.',
        tools: ['torchvision', 'Autograd', 'DataLoader', 'CUDA']
      },
      {
        id: 'neural-networks',
        name: 'Neural Networks',
        level: 80,
        aliases: ['deep learning', 'cnn', 'rnn', 'cnns', 'rnns', 'neural network'],
        desc: 'Feed-forward, convolutional and recurrent architectures, including backpropagation, optimisation, regularisation and sensible training diagnostics.',
        tools: ['CNN', 'RNN', 'Backpropagation', 'Adam / SGD', 'Dropout']
      },
      {
        id: 'computer-vision',
        name: 'Computer Vision',
        level: 75,
        aliases: ['cv', 'image classification', 'object detection', 'ocr'],
        desc: 'Image classification, object detection, tracking and OCR, turning pixels into structured information.',
        tools: ['YOLOv8', 'EasyOCR', 'SORT', 'Image augmentation']
      },
      {
        id: 'transformers',
        name: 'Transformers',
        level: 68,
        aliases: ['attention', 'transformer', 'llm architecture'],
        desc: 'The architecture behind modern LLMs: self-attention, positional encodings and how pretrained models are adapted to new tasks.',
        tools: ['Self-attention', 'Hugging Face', 'Tokenisation', 'Fine-tuning']
      }
    ]
  },
  {
    id: 'genai',
    name: 'Generative AI',
    short: 'GenAI',
    icon: 'sparkles',
    certCategory: 'Generative AI',
    blurb: 'Grounded, tool-using LLM systems rather than one-shot prompts.',
    skills: [
      {
        id: 'langchain',
        name: 'LangChain',
        level: 85,
        aliases: ['lang chain'],
        desc: 'Composing LLM applications from prompts, retrievers, memory and tools, from resume-aware interview bots to retrieval-driven assistants.',
        tools: ['Prompt templates', 'Retrievers', 'Output parsers', 'Chains']
      },
      {
        id: 'langgraph',
        name: 'LangGraph',
        level: 82,
        aliases: ['lang graph', 'stategraph'],
        desc: 'Modelling agent behaviour as an explicit graph with state, conditional edges and loops, so multi-step workflows stay inspectable and controllable.',
        tools: ['StateGraph', 'Conditional edges', 'Checkpointing', 'Human-in-the-loop']
      },
      {
        id: 'rag',
        name: 'RAG',
        level: 85,
        aliases: ['retrieval augmented generation', 'retrieval-augmented generation', 'retrieval'],
        desc: 'Grounding model answers in retrieved context: chunking, embeddings, retrieval, re-ranking and prompt assembly that keep responses relevant and verifiable.',
        tools: ['Chunking', 'Embeddings', 'Re-ranking', 'Context windows']
      },
      {
        id: 'faiss',
        name: 'FAISS',
        level: 78,
        aliases: ['faiss index'],
        desc: 'Fast similarity search over dense embeddings. I use it as the retrieval layer for resume and document search.',
        tools: ['IndexFlat', 'IVF', 'HNSW', 'Cosine / L2']
      },
      {
        id: 'vector-databases',
        name: 'Vector Databases',
        level: 78,
        aliases: ['vector database', 'vector db', 'vector store', 'embeddings'],
        desc: 'Storing and querying embeddings at scale, and choosing between in-memory indexes and managed vector stores for the job.',
        tools: ['FAISS', 'Chroma', 'Pinecone', 'pgvector']
      },
      {
        id: 'llm-integration',
        name: 'LLM Integration',
        level: 85,
        aliases: ['llm', 'llms', 'llm apps', 'generative ai', 'google generative ai', 'gemini', 'openai'],
        desc: 'Wiring hosted LLM APIs into real products: prompt design, structured outputs, streaming, retries, cost and latency awareness.',
        tools: ['Google Generative AI', 'OpenAI API', 'Structured output', 'Prompt design']
      },
      {
        id: 'ai-agents',
        name: 'AI Agents',
        level: 82,
        aliases: ['agents', 'agentic ai', 'agentic'],
        desc: 'Systems where an LLM plans, calls tools, observes results and decides what to do next, with guardrails around each step.',
        tools: ['ReAct', 'Planning', 'Memory', 'Multi-step workflows']
      },
      {
        id: 'tool-calling',
        name: 'Tool Calling',
        level: 80,
        aliases: ['function calling', 'tools'],
        desc: 'Letting models invoke functions and APIs with validated arguments, the bridge between language and action.',
        tools: ['JSON schema', 'Function calling', 'Pydantic validation', 'API wrappers']
      }
    ]
  },
  {
    id: 'backend',
    name: 'Backend & Development',
    short: 'Backend',
    icon: 'server',
    certCategory: 'Programming',
    blurb: 'Shipping models as services people can actually use.',
    skills: [
      {
        id: 'fastapi',
        name: 'FastAPI',
        level: 78,
        aliases: ['fast api'],
        desc: 'Typed, async Python APIs with automatic validation and docs, used to serve ML models behind clean REST endpoints.',
        tools: ['Pydantic', 'Uvicorn', 'OpenAPI', 'Dependency injection']
      },
      {
        id: 'flask',
        name: 'Flask',
        level: 80,
        aliases: [],
        desc: 'Lightweight web apps and model-serving endpoints, such as the image-upload flow in the plant disease classifier.',
        tools: ['Jinja2', 'Blueprints', 'Gunicorn', 'REST']
      },
      {
        id: 'streamlit',
        name: 'Streamlit',
        level: 75,
        aliases: [],
        desc: 'Quick, interactive front ends for ML demos and internal tools without leaving Python.',
        tools: ['Session state', 'Widgets', 'Caching', 'Charts']
      },
      {
        id: 'mongodb',
        name: 'MongoDB',
        level: 70,
        aliases: ['mongo', 'nosql'],
        desc: 'Document storage for flexible, evolving data such as predictions, logs and application records.',
        tools: ['PyMongo', 'Aggregation pipeline', 'Atlas', 'Indexes']
      },
      {
        id: 'docker',
        name: 'Docker',
        level: 65,
        aliases: ['containers', 'containerisation'],
        desc: 'Packaging services into reproducible containers so they run the same on a laptop and in the cloud.',
        tools: ['Dockerfile', 'docker-compose', 'Image layers', 'Registries']
      },
      {
        id: 'git',
        name: 'Git',
        level: 80,
        aliases: ['github', 'version control'],
        desc: 'Version control for everyday collaboration: branching, rebasing, code review and clean, readable history.',
        tools: ['GitHub', 'Pull requests', 'Rebase', 'CI']
      }
    ]
  },
  {
    id: 'cloud',
    name: 'Cloud & Data Technologies',
    short: 'Cloud & Data',
    icon: 'cloud',
    certCategory: 'Cloud Computing',
    blurb: 'Where the data lives and where the models run.',
    skills: [
      {
        id: 'snowflake',
        name: 'Snowflake',
        level: 62,
        aliases: ['snowflake data cloud', 'snowpark'],
        desc: 'Cloud data warehousing that I work with daily as a System Engineer at Infosys, along with the wider ecosystem of data technologies.',
        tools: ['Snowflake SQL', 'Warehouses', 'Snowpark', 'Data pipelines']
      },
      {
        id: 'google-cloud',
        name: 'Google Cloud',
        level: 60,
        aliases: ['gcp', 'google cloud platform', 'dialogflow', 'dialogflow cx', 'vertex ai'],
        desc: 'Used during my internship for conversational AI with Dialogflow CX and Google Generative AI.',
        tools: ['Dialogflow CX', 'Vertex AI', 'Cloud Storage', 'IAM']
      },
      {
        id: 'aws-bedrock',
        name: 'AWS Bedrock',
        level: 25,
        status: 'learning',
        aliases: ['bedrock', 'aws', 'amazon bedrock'],
        desc: 'Currently learning how to build with foundation models on AWS: model access, agents and knowledge bases.',
        tools: ['Foundation models', 'Knowledge bases', 'Agents for Bedrock', 'IAM']
      }
    ]
  }
];
