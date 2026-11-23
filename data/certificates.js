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
  { id: 'Machine Learning', icon: 'brain' },
  { id: 'Deep Learning', icon: 'network' },
  { id: 'Generative AI', icon: 'sparkles' },
  { id: 'Data Science', icon: 'database' },
  { id: 'Programming', icon: 'code-xml' },
  { id: 'Cloud Computing', icon: 'cloud' },
  { id: 'Professional Development', icon: 'briefcase' }
];

PF.data.certBuiltIn = [
  /* Example (delete the comment markers to use):
  */{
    id: 'builtin-1',
    title: 'Linear Algebra and Geometry 1',
    issuer: 'Udemy.com',
    issueDate: 'Nov, 20, 2026',               // YYYY-MM-DD
    category: 'Linear Algebra',
    credentialId: 'UC-d458e0cb-4ce2-4871-8f09-16b2ca336aa1',
    credentialUrl: 'ude.my/UC-d458e0cb-4ce2-4871-8f09-16b2ca336aa1',
    skills: ['System of Equation', 'Determinant'],
    description: 'What the programme covered.',
    fileUrl: 'assets/certs/Linear_Algebra/LA_G1.pdf',           // application/pdf | image/jpeg | image/png
    thumbUrl: 'assets/certs/LA_G1.jpg'   // optional preview image
  },
  
];
