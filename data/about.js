/* ==========================================================================
   ABOUT  -  the copy for the About section. Edit the text freely; the layout adapts.
   `icon` values are Lucide icon names that exist in js/icons.js.
   ========================================================================== */
window.PF = window.PF || {};
PF.data = PF.data || {};

PF.data.about = {
  lead: 'I build intelligent systems that solve real problems, and I like understanding how they work well enough to take them apart.',
  body: [
    'My interests span Machine Learning, Deep Learning, Generative AI, Retrieval-Augmented Generation (RAG), Agentic AI and Robotics. I enjoy experimenting with emerging technologies and turning theoretical knowledge into practical applications.',
    'Right now I work as a System Engineer at Infosys with Snowflake and data technologies, and I keep building and learning in AI alongside it.'
  ],

  /* The profile sheet: one row per topic. `href` adds a link to the matching section. */
  sheet: [
    {
      icon: 'graduation-cap',
      label: 'Education',
      text: 'B.Tech in Computer Science and Engineering (AI & ML) at Meerut Institute of Engineering and Technology, affiliated to Dr. A.P.J. Abdul Kalam Technical University.',
      href: '#education',
      cta: 'Education and learning'
    },
    {
      icon: 'briefcase',
      label: 'Professional journey',
      text: 'AI/ML Intern at Hubnex Labs, where I built an AI Interviewer Bot, then System Engineer at Infosys working with Snowflake and data technologies.',
      href: '#experience',
      cta: 'Experience'
    },
    {
      icon: 'flask-conical',
      label: 'Technical interests',
      text: 'Retrieval and agent systems, computer vision, and the engineering that turns a model into a service: APIs, monitoring and data.',
      href: '#skills',
      cta: 'Skills'
    }
  ],

  /* How I learn and solve problems. This is a real sequence, so it is numbered. */
  approach: {
    title: 'How I learn and solve problems',
    steps: [
      { title: 'Understand the mechanism', text: 'Start from first principles: what must always hold, and why the approach keeps it true.' },
      { title: 'Build the smallest version', text: 'Get the simplest thing that could work running end to end before adding anything else.' },
      { title: 'Measure it honestly', text: 'Pick the metric first, test where it can fail, and let the results decide what changes.' },
      { title: 'Put it in a real project', text: 'A concept only sticks once it has carried weight in something that has to work.' }
    ]
  },

  /* Where I'm heading */
  aspirations: {
    title: 'Where I want to take this',
    intro: 'I want to build AI systems reliable enough to depend on, and to work where AI, ML and GenAI meet robotics, so that models do not only talk, they act.',
    tracks: [
      { icon: 'bot', title: 'Artificial Intelligence', text: 'Agents that plan, use tools and stay inside guardrails.' },
      { icon: 'brain', title: 'Machine Learning', text: 'Models that are evaluated and monitored, not just trained.' },
      { icon: 'sparkles', title: 'Generative AI', text: 'Retrieval-grounded LLM systems people can verify.' },
      { icon: 'cog', title: 'Robotics', text: 'Connecting perception and decision-making to the physical world.' }
    ]
  }
};
