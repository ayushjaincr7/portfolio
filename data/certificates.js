/* ==========================================================================
   CERTIFICATES  -  categories + optional built-in certificates.

   Most certificates are added through the uploader in the page (Owner mode), which
   stores them in your browser (local mode) or in Supabase (cloud mode).

   If you prefer files committed with the site, add entries to `builtIn` below and
   put the files in /assets/certs. They show for everyone and are read-only in the UI.
   ========================================================================== */
window.PF = window.PF || {};
PF.data = PF.data || {};

PF.data.certCategories = [
  { id: "Machine Learning", icon: "brain" },
  { id: "Deep Learning", icon: "network" },
  { id: "Generative AI", icon: "sparkles" },
  { id: "Data Science", icon: "database" },
  { id: "Programming", icon: "code-xml" },
  { id: "Cloud Computing", icon: "cloud" },
  { id: "Professional Development", icon: "briefcase" },
];

PF.data.certBuiltIn = [
  /* Example (delete the comment markers to use):
   */ {
    id: "builtin-1",
    title: "Linear Algebra and Geometry 1",
    issuer: "Udemy.com",
    issueDate: "Nov, 20, 2026", // YYYY-MM-DD
    category: "Linear Algebra",
    credentialId: "UC-d458e0cb-4ce2-4871-8f09-16b2ca336aa1",
    credentialUrl: "ude.my/UC-d458e0cb-4ce2-4871-8f09-16b2ca336aa1",
    skills: ["System of Equation", "Determinant"],
    description: "What the programme covered.",
    fileUrl: "assets/certs/Linear_Algebra/LA_G1.pdf", // application/pdf | image/jpeg | image/png
    thumbUrl: "assets/certs/LA_G1.jpg", // optional preview image
  },
  {
    id: "builtin-2",
    title: "Data Science Masters Pro",
    issuer: "INeuron.com",
    issueDate: "3rd February 2025", // YYYY-MM-DD
    category: "Data Science",
    credentialId: "3708f4fe-0d95-442b-bdda-78c6a1d6be13",
    credentialUrl: "",
    skills: [
      "NumPy",
      "Pandas",
      "Matplotlib",
      "Seaborn",
      "SciPy",
      "Scikit-learn",
      "Statsmodels",
      "TensorFlow",
      "PyTorch",
      "Keras",
      "Hugging Face Transformers",
      "LangChain",
    ],
    description: "What the programme covered.",
    fileUrl: "assets/certs/data_science/data science.pdf", // application/pdf | image/jpeg | image/png
    thumbUrl: "assets/certs/data_science.png", // optional preview image
  },
  {
    id: "builtin-3",
    title: "Mastering Generative AI with openAI, LangChain,and LlamaIndex V2",
    issuer: "INeuron.com",
    issueDate: "16th September 2024.", // YYYY-MM-DD
    category: "AI Agentic",
    credentialId: "0a9cdce7-e2c7-41db-a0d9-fb8494c7dda8",
    credentialUrl: "",
    skills: [
  "Generative AI",
  "OpenAI API",
  "LLMs",
  "LangChain",
  "LlamaIndex",
  "Prompt Engineering",
  "RAG (Retrieval-Augmented Generation)",
  "Vector Databases",
  "Embeddings",
  "Semantic Search",
  "LLM Integration",
  "AI Application Development",
],
    description: "What the programme covered.",
    fileUrl: "assets/certs/ai_agentic/gen_AI.pdf", // application/pdf | image/jpeg | image/png
    thumbUrl: "assets/certs/gen_ai.png", // optional preview image
  },
];
