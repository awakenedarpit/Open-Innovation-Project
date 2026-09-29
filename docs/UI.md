# Concept X-Ray — UI/UX Design System Documentation (`docs/UI.md`)

## 1. Design Identity & Inspiration
The Concept X-Ray visual interface is designed with an editorial, modern, and spacious aesthetic inspired by *EdTech Hub*. It combines:
- Clean whitespace and rich typography (`Inter` for body & `Newsreader` for editorial headings).
- Professional color palette (Midnight slate `#0f172a`, Emerald `#059669`, Amber `#d97706`, Rose `#f43f5e`).
- Interactive React Flow DAG visualizations with interactive node detail panels and status color coding.

---

## 2. Key Pages Implemented
1. **Landing Page (`/`)**: Hero section with live diagnostic X-Ray flow, problem comparison section, 5-step cycle, interactive DAG preview, and student/teacher CTA split.
2. **Student Dashboard (`/student/dashboard`)**: Welcome header, mastery metrics, learning streak, continue learning cards, recent diagnosis card, and interactive learning map.
3. **Concept Explorer (`/student/concepts` & `/student/concepts/[slug]`)**: Curriculum search, grade band filters, concept cards, prerequisite dependency breakdown, and micro-lesson viewer.
4. **Quiz Interface (`/student/quiz/[id]`)**: Distraction-free question assessment card with immediate REST attempt registration.
5. **X-Ray Diagnosis Screen (`/student/trace/[id]`)**: Stepwise prerequisite graph trace, confidence scoring badge, rationale explanation, and Repair CTA.
6. **Micro-Lesson Page (`/student/lesson/[id]`)**: Structured learning page featuring "Why This Matters", worked examples, code blocks, common misconceptions, and quick checks.
7. **Repair Session Page (`/student/repair/[sessionId]`)**: Dual-probe validation loop (root-cause probe + parallel application check) with Before vs After mastery score transition.
8. **Teacher Dashboard (`/teacher/dashboard`)**: Class overview metrics, concept heatmaps with k-anonymity privacy safeguards, top misconception interventions, and class prerequisite DAG.

---

## 3. Responsive Breakpoints
Tested across viewports: `1920px`, `1440px`, `1024px`, `768px`, `480px`, `375px`.
- Mobile navigation drawer included in `Navbar`.
- Desktop/mobile sidebar toggling.
- Cards stack gracefully without horizontal overflow.
