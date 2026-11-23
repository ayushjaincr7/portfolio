/* ==========================================================================
   SITE CONFIG  -  edit this file first.
   Everything personal that is not a long-form section lives here.
   ========================================================================== */
window.PF = window.PF || {};
PF.data = PF.data || {};

PF.data.site = {
  name: 'Ayush Jain',
  initials: 'AJ',
  title: 'AI/ML Engineer',
  /* Shown in the browser tab / search results */
  fullTitle: 'AI/ML Engineer | Generative AI | Agentic AI | Machine Learning',
  description:
    'Ayush Jain is an AI/ML Engineer building intelligent systems with Generative AI, RAG, Agentic AI and Machine Learning. Explore projects, skills, certifications and experience.',

  /* >>> REPLACE these placeholders with your real details <<< */
  email: 'your.email@example.com',
  url: 'https://your-domain.example', // your deployed site URL (used for SEO + sharing)
  social: {
    github: 'https://github.com/YOUR_GITHUB_USERNAME',
    linkedin: 'https://www.linkedin.com/in/YOUR_LINKEDIN_HANDLE'
  },

  /* Path to the PDF served by the "Download Resume" buttons. Replace the file in /assets. */
  resume: 'assets/Ayush_Jain_Resume.pdf',
  resumeFileName: 'Ayush_Jain_Resume.pdf',

  /* GitHub integration: the username is read from social.github above.
     While it still says YOUR_GITHUB_USERNAME the live GitHub block stays hidden. */
  github: { featuredRepos: 4 },

  /* Contact form. With no endpoint the form opens the visitor's email app (mailto).
     To receive messages directly, set a form endpoint (Formspree, Web3Forms, Getform ...). */
  contact: {
    formEndpoint: '',
    extraFields: {}, // e.g. { access_key: '...' } for Web3Forms
    subjectPrefix: 'Portfolio enquiry'
  },

  /* Certificate storage.
     - Leave url/anonKey empty  -> "local mode": uploads live in YOUR browser only (IndexedDB).
     - Fill both in            -> "cloud mode": Supabase Storage + Database, visible to every visitor.
     See README.md ("Certificate manager") and supabase/schema.sql. */
  supabase: {
    url: '', // e.g. https://abcdxyz.supabase.co
    anonKey: '', // the public "anon" key (safe to expose; protected by the policies in schema.sql)
    bucket: 'certificates',
    table: 'certificates'
  }
};
