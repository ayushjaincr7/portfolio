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
  {
    id: 'builtin-1',
    title: 'Machine Learning Specialization',
    issuer: 'DeepLearning.AI',
    issueDate: '2025-03-14',               // YYYY-MM-DD
    category: 'Machine Learning',
    credentialId: 'ABC123XYZ',
    credentialUrl: 'https://example.com/verify/ABC123XYZ',
    skills: ['Python', 'Scikit-learn', 'Neural Networks'],
    description: 'What the programme covered.',
    fileUrl: 'assets/certs/ml-specialization.pdf',
    fileType: 'application/pdf',           // application/pdf | image/jpeg | image/png
    thumbUrl: 'assets/certs/ml-specialization.jpg'   // optional preview image
  },
  */
];
