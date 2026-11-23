# Ayush Jain: AI/ML Engineer portfolio

A static portfolio in plain HTML, CSS and JavaScript. No build step, no framework, no package install.
Everything you will want to change lives in `data/` as ordinary JavaScript objects.

The look is anime: an original character and skyline in the hero (inline SVG, no image files), ink-outlined
panels with hard offset shadows, screentone dots, and vertical kanji section labels. The dark theme is a
twilight skyline and the light theme is the same street by day. The character is original and not based on
any existing series.

## Run it

Open `index.html` in a browser, or serve the folder for a more realistic test:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## First things to change

These are placeholders. Replace them before you publish.

| What | Where |
| --- | --- |
| Email, GitHub URL, LinkedIn URL, site URL | `data/site.js` |
| Your real resume (keep the file name, or change `resume` in `data/site.js`) | `assets/Ayush_Jain_Resume.pdf` |
| GitHub repository link for each project | `repo: ''` in `data/projects.js` |
| Live demo links (optional) | `demo: ''` in `data/projects.js` |
| Your domain in the sitemap and robots file | `sitemap.xml`, `robots.txt` |

The resume that ships in `assets/` is a stand-in built from the text of your brief. Replace it with your own PDF.

Once `site.url` is set, the canonical link, share image URL and structured data update themselves.
Once `social.github` holds a real profile URL, a live "Recently on GitHub" block appears under the projects.

## Draft copy you should read through

I wrote the descriptions from the bullet points you gave. Check these and correct anything that is not accurate:

- Project problem statements, key features and key achievements (`data/projects.js`). There are no numbers in them on purpose. Add real accuracy, speed or usage figures where you have them.
- Skill descriptions, related tools and the proficiency defaults (`data/skills.js`). The levels are starting guesses.
- The About text, learning stages and experience bullets (`data/about.js`, `data/education.js`, `data/experience.js`).

## Where everything lives

```
index.html            page structure and SEO tags
css/                  base.css (tokens, layout), sections.css, dialogs.css, anime.css (hero art colours + the anime styling)
js/                   one file per feature (skills.js, projects.js, certs.js ...)
data/                 the content you edit
  site.js             contact details, resume path, Supabase keys
  about.js            About section copy
  skills.js           categories and skills
  projects.js         projects
  experience.js       timeline
  education.js        education and learning journey
  certificates.js     certificate categories and optional built-in certificates
assets/               fonts, favicon, share image, resume
supabase/schema.sql   database, storage and security rules
vendor/               pdf.js (certificate previews) and supabase-js, loaded only when needed
```

Scripts are classic `<script>` tags, not ES modules, so the site also works when opened straight from the file system.

## Change the anime look

- Colours for both themes are tokens at the top of `css/base.css` (`--bg`, `--panel`, `--edge` for the ink outline, `--pink`, `--sun`).
  The hero sky, moon, clouds and skyline colours are variables at the top of `css/anime.css` (`--sky-0` to `--sky-3`, `--city-*` and so on).
- The hero art is inline SVG in `index.html`: the skyline sits in `.hero-scene`, the character in `.hero-char`. It reads those colour variables, so it follows the theme.
- Section kanji (`自己紹介`, `スキル`, `作品`, `資格`, `経歴`, `学歴`, `連絡`) come from `data-jp` on each `.section-head`.
  The Dela Gothic One font file is a subset that holds only the characters this page uses. If you add other kanji, re-subset the font
  (`pyftsubset` from fonttools) or they will fall back to a system font.
- Stars and sakura petals are drawn on a canvas in `js/hero.js`. They stop when the tab is hidden and are drawn once if the visitor prefers reduced motion.

## Add a project

Copy any object in `data/projects.js`, paste it at the end of the array and edit it. The card, the technology filter,
the detail window, the architecture diagram and the links from skills all update. Link it to skills with `skills: [ids]`,
using ids from `data/skills.js`. Set `featured: true` for a wide card at the top. To use your own architecture image,
put it in `assets/img/` and set `image: 'assets/img/name.png'`.

## Add or change a skill

Add an object to a category in `data/skills.js`. Projects link to it through their `skills` list. Certificates link to
it through the skills you type when uploading (matched on id, name or alias).

## Certificate manager

Certificates are added from the page itself, in owner mode. Click **Owner login** in the footer.

Fields: title, issuing organization, date of completion, category, credential ID, credential URL, skills covered,
description, and the file (PDF, JPG or PNG, up to 10 MB). The gallery card, thumbnail, filters, preview window and the
links to and from your skills are generated from that.

There are two storage modes, chosen by `supabase` in `data/site.js`:

- **Local mode** (keys left empty). Certificates are stored in your own browser. Good for trying it out. Visitors do not see them.
- **Cloud mode** (keys filled in). Files go to Supabase Storage and details to a Supabase table. Every visitor sees them, and only you can change them.

### Turn on cloud mode

1. Create a free project at supabase.com.
2. Authentication > Users > **Add user**, with your email and a password. Tick **Auto Confirm User**.
3. In the Authentication settings (Sign In / Providers, Email), turn **off** "Allow new users to sign up".
4. Open `supabase/schema.sql`, replace `your.email@example.com` with the email from step 2, and run it in the SQL editor.
5. From the project's API settings, copy the project URL and the `anon` public key into `supabase` in `data/site.js`.
6. Reload the site, click **Owner login**, sign in, and upload.

The anon key is meant to be public. The database policies in `schema.sql` are what stop anyone but you from adding, editing or deleting.
Skill proficiency edits (the slider in owner mode) are saved to the same project.

If you want some certificates committed with the site instead, add them to `certBuiltIn` in `data/certificates.js`
and put the files in `assets/certs/`.

## Contact form

With no endpoint set, the form opens the visitor's email app with the message filled in. To receive messages directly,
create a form on Formspree, Web3Forms or Getform and set `contact.formEndpoint` (and `extraFields` if the service needs a key) in `data/site.js`.
A hidden honeypot field filters out most bots.

## Deploy

It is a folder of static files, so any static host works: GitHub Pages, Netlify, Vercel or Cloudflare Pages.
Publish the folder as it is. Then set `site.url` in `data/site.js` and the domain in `sitemap.xml` and `robots.txt`.

## What was tested

Checked in Chromium at desktop, tablet and phone widths, in dark and light themes: no console errors, no horizontal scroll,
and no accessibility violations from axe-core on the page, the skill panel and the project window.
The certificate flow (add PDF, PNG and JPG, validation, filters, preview, download, edit, delete, reload persistence,
skill links both ways) passed in local mode. Cloud mode was tested against a stand-in Supabase client that mimics the
API, not against a live Supabase project, so do one real upload after you connect yours.

## Licences

Fonts: Dela Gothic One, Zen Maru Gothic, Geist Mono (SIL Open Font Licence). Icons: Lucide (ISC).
PDF previews: pdf.js (Apache 2.0). Cloud storage client: supabase-js (MIT).
