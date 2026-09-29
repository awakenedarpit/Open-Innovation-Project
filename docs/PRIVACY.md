# Concept X-Ray — Privacy & k-Anonymity Documentation

## 1. Overview & Privacy Principles
Concept X-Ray is committed to protecting student privacy while providing educators with rich diagnostic insight into class learning difficulties.

### Key Privacy Guarantees
1. **Zero Individual Student Exposure in Class Analytics**: Neither the teacher dashboard nor any aggregate teacher API endpoint accepts or returns student identifiers.
2. **Dynamic k-Anonymity Floor ($k \ge 3$)**: Any concept or error pattern cohort with fewer than 3 student attempts is automatically suppressed server-side before response transmission.
3. **No Option-Level Pattern Leaks on Suppressed Cohorts**: When a concept falls below the $k=3$ threshold, detailed option breakdown statistics are fully withheld.

---

## 2. Student Data Model & Visibility
- **Students** can view their personal concept mastery, attempt history, and diagnostic recommendations.
- **Teachers** see only class-level cohort aggregates, concept heatmaps, common misconception frequencies, and dependency bottlenecks.

---

## 3. k-Anonymity Enforcement Algorithm (`app/teacher.py`)
```python
MIN_COHORT = 3

suppressed = (
    (0 < total_attempts < MIN_COHORT)
    or (0 < len(distinct_learners_wrong) < MIN_COHORT)
)

if suppressed:
    # Zero numeric fields and return suppressed=True flag
    cell = HeatmapCell(..., suppressed=True)
```

---

## 4. Summary Matrix
| Data View | Visible to Student | Visible to Teacher | k-Anonymity Guard |
| :--- | :--- | :--- | :--- |
| Personal Quiz Attempts | Yes | No | N/A |
| Diagnosed Root Misconception | Yes | Aggregate Only | Yes ($k \ge 3$) |
| Class Concept Heatmap | No | Yes | Yes ($k \ge 3$) |
| Wrong Answer Patterns | No | Aggregate Only | Yes ($k \ge 3$) |
