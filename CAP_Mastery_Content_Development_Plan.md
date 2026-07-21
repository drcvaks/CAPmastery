# CAP Mastery Content Development Plan

## Purpose

This document summarizes the complete content-development plan for building the educational material used by the CAP Mastery app.

The software itself will be built by Codex. The instructional content will be developed separately from official Civil Air Patrol study materials and then imported into the app.

The first source will be:

**Civil Air Patrol – Learn to Lead, Volume 1: Personal Leadership**

The initial content-development cycle will focus on **Chapter 1: Character and the Air Force Tradition**. Once the process is tested and approved, the same structure will be used for Chapters 2 and 3, followed by Learn to Lead Volume 2 and later CAP aerospace materials.

---

# 1. Division of Responsibilities

## ChatGPT Content Role

ChatGPT will create the academic and instructional content, including:

- Official learning-objective extraction
- Chapter and section mapping
- Concept identification
- Concept definitions
- Concept relationships
- Prerequisite relationships
- Common misconceptions
- Tutor notes
- Question blueprints
- Easy, medium, and hard questions
- Recall, understanding, application, and scenario questions
- Correct-answer explanations
- Explanations for each incorrect answer
- Reinforcement-question links
- Source references
- Practice-test blueprints
- CSV and JSON import files
- Human-readable review files
- Content quality reports

## Codex Software Role

Codex will build the system that stores and uses the content, including:

- Supabase database tables
- Content import tools
- Admin review screens
- Question approval workflow
- Student quiz screens
- Secure server-side grading
- Question-attempt tracking
- Topic and objective mastery
- Adaptive question selection
- Spaced repetition
- Practice-test generation
- Progress dashboards
- Parent dashboards
- Challenge modes
- Future AI-assisted content generation

Codex should not be treated as the main author or reviewer of the initial educational content.

---

# 2. Content Architecture

The content will be organized using the following hierarchy:

```text
Program
Exam Track
Book
Volume
Chapter
Section
Subsection
Learning Objective
Concept
Question Family
Individual Question
Source Passage
```

For the first project:

```text
Program:
Civil Air Patrol Cadet Program

Exam Track:
Leadership

Book:
Learn to Lead

Volume:
Volume 1 – Personal Leadership

Chapter:
Chapter 1 – Character and the Air Force Tradition
```

Each question will connect to one or more learning objectives and concepts.

---

# 3. Core Content Datasets

## Dataset A: Official Learning Objectives

Each objective record will include:

```text
objective_code
official_objective_number
official_objective_text
short_title
book
volume
chapter
section
source_page_start
source_page_end
importance_weight
prerequisite_objectives
related_objectives
status
```

Example objective code:

```text
LTL1-C1-O09
```

The official wording should be preserved exactly. A shorter internal label may also be created for display and reporting.

## Dataset B: Concepts

Each concept record will include:

```text
concept_code
concept_title
plain_language_definition
deeper_definition
objective_codes
parent_concept
related_concepts
prerequisite_concepts
source_pages
importance_weight
common_confusions
status
```

## Dataset C: Tutor Notes

Each tutor-note record will include:

```text
concept_code
essential_understanding
simple_explanation
deeper_explanation
common_misconceptions
real_life_examples
cap_examples
teaching_analogy
remediation_strategy
distinguishing_points
source_reference
```

Tutor notes are primarily instructional metadata and may not be shown directly to students.

## Dataset D: Concept Relationships

Relationship types may include:

```text
supports
requires
expresses
guides
contrasts_with
is_example_of
develops
influences
prerequisite_for
reinforces
```

## Dataset E: Question Bank

Each question will include:

```text
external_id
exam_code
book_code
volume_code
chapter_code
section_code
topic_code
learning_objective_code
concept_code
question_family_code
difficulty
cognitive_level
question_type
question_text
choice_a
choice_b
choice_c
choice_d
correct_letter
explanation
choice_a_explanation
choice_b_explanation
choice_c_explanation
choice_d_explanation
common_mistake
remediation_text
source_document
source_page_start
source_page_end
source_reference_text
is_exam_style
reinforcement_question_ids
related_concept_codes
estimated_time_seconds
review_status
```

Initial question types:

```text
multiple_choice
true_false
```

---

# 4. Mastery Dimensions

Each concept or objective should support separate mastery dimensions:

```text
Recall
Recognition
Understanding
Application
Scenario Judgment
Retention
Confidence
```

This allows the app to recognize that a cadet may know a definition but still struggle to apply the concept.

---

# 5. Question Families

Questions should be developed in families rather than as isolated items.

A question family may include:

```text
Basic definition
Recognition of an example
CAP application
Leadership scenario
Contrast with a related concept
Common misconception
Reinforcement question
Retention question
```

---

# 6. Question Categories

- Recall
- Recognition
- Understanding
- Application
- Scenario judgment
- Analysis
- Misconception check
- Reinforcement
- Retention check

---

# 7. Difficulty Levels

## Easy

- Direct recall
- Clear definition
- Simple recognition
- Straightforward application

## Medium

- Comparison
- Interpretation
- Realistic application
- Similar distractors
- Multiple related concepts

## Hard

- Nuanced scenario
- Best-answer judgment
- Misconception detection
- Several plausible distractors
- Integration of multiple concepts

A difficult question must still have one unambiguously best answer.

---

# 8. Explanation Standards

Every approved question should include:

1. Why the correct answer is correct
2. Why each incorrect answer is incorrect
3. The underlying concept
4. The source reference
5. The likely misconception
6. A remediation note
7. A related or reinforcement question when appropriate

---

# 9. Source and Accuracy Rules

Every approved question must:

- Be supported by official authorized material
- Include a page or passage reference
- Test a meaningful objective or concept
- Have one defensibly best answer
- Avoid unsupported interpretation
- Use original question wording
- Avoid claiming to be an actual CAP exam question unless officially identified as such
- Avoid collecting or using protected questions remembered from actual exams
- Be reviewed before publication

---

# 10. Question Blueprint

Suggested distribution for each major objective:

| Question Purpose | Approximate Share |
|---|---:|
| Recall and recognition | 20% |
| Understanding | 25% |
| Application | 25% |
| Scenario judgment | 20% |
| Misconception and comparison | 10% |

Question counts should reflect importance, complexity, and common confusion.

---

# 11. Practice-Test Blueprint

Each practice-test blueprint should define:

```text
exam_code
total_questions
time_limit
chapter_distribution
objective_distribution
difficulty_distribution
cognitive_level_distribution
maximum_questions_per_concept
minimum_topic_coverage
repeat_question_rules
unseen_question_preference
```

Practice tests should cover all major objectives, include both knowledge and application, avoid repeated wording, and hide explanations until completion.

---

# 12. Adaptive Learning Use

The content metadata should allow the app to determine:

- Which objectives are weak
- Which concepts are weak
- Whether the weakness is recall or application
- Which misconceptions recur
- Which explanation helped
- Which concept should be reviewed next
- Whether the cadet retained the concept over time

---

# 13. Complete Checkpoint Plan

## Checkpoint 1: Confirm Content Schema

### Work

- Finalize all dataset fields
- Compare fields with Codex database structure
- Decide CSV and JSON formats
- Decide code conventions
- Decide status and review fields
- Confirm how sources and page references are stored

### Deliverables

- Final content schema
- Field dictionary
- Import column list
- Code-naming standard

### Acceptance Criteria

- Every required content type has a defined home
- No important metadata is trapped only in notes
- Codex can map every field to the application database
- No questions are generated yet

---

## Checkpoint 2: Extract Chapter 1 Structure

### Work

- Identify every Chapter 1 section and subsection
- Extract every official objective
- Assign objective codes
- Record source pages
- Identify major and minor concepts
- Assign concept codes
- Identify prerequisites and relationships

### Deliverables

- Chapter 1 objective table
- Chapter 1 section map
- Chapter 1 concept table
- Preliminary concept graph

### Acceptance Criteria

- Every official objective is captured
- Every major section is represented
- Concepts can be traced to source pages
- Duplicate and overlapping concepts are reconciled

---

## Checkpoint 3: Create Chapter 1 Tutor Notes

### Work

For each concept, create:

- Essential understanding
- Simple explanation
- Deeper explanation
- Common misconceptions
- Distinguishing points
- CAP examples
- Real-life examples
- Teaching analogy
- Remediation strategy
- Related concepts

### Deliverables

- Chapter 1 tutor-note dataset
- Misconception list
- Remediation map

### Acceptance Criteria

- Every major concept has sufficient instructional guidance
- Common confusions are explicitly documented
- Notes remain faithful to the official source

---

## Checkpoint 4: Create Chapter 1 Question Blueprint

### Work

- Determine importance weights
- Recommend question counts
- Assign question categories
- Assign difficulty distribution
- Identify concepts requiring scenario questions
- Identify misconception questions
- Plan reinforcement relationships
- Plan practice-test coverage

### Deliverables

- Objective-by-objective question plan
- Question-family plan
- Practice-test blueprint
- Estimated final question count

### Acceptance Criteria

- Question counts reflect importance and complexity
- Every objective has meaningful coverage
- The blueprint includes recall and application
- No objective is represented only by trivial questions

---

## Checkpoint 5: Create Chapter 1 Pilot Question Set

### Scope

Approximately 50 to 75 questions.

Initial focus:

- Leadership and character
- Warrior spirit
- Core Values
- Self-awareness
- Self-discipline
- Attitude
- Accountability
- Cadet Oath

### Work

- Create question families
- Write questions and distractors
- Add correct-answer explanations
- Add explanations for every wrong answer
- Add misconceptions
- Add remediation text
- Add source references
- Add reinforcement links
- Validate uniqueness and ambiguity

### Deliverables

- Pilot CSV
- Pilot JSON
- Human-readable review workbook
- Pilot quality report

### Acceptance Criteria

- Every question has one best answer
- Every question has a source
- Every question has a teaching explanation
- Questions cover several cognitive levels
- Content is ready to import as draft material

---

## Checkpoint 6: Import and Technical Validation

### Codex Work

- Import pilot content into the app
- Map all fields
- Confirm draft and approved states
- Confirm source display
- Confirm answer grading
- Confirm adaptive metadata
- Confirm question-family links

### Content Review Work

- Check imported formatting
- Check answer choices
- Check explanations
- Check page references
- Check special characters
- Check question sequence

### Deliverables

- Import test report
- Mapping corrections
- Revised pilot file if needed

### Acceptance Criteria

- No fields are lost during import
- Answer keys remain protected
- Explanations display correctly
- Questions can be filtered by objective and concept

---

## Checkpoint 7: Heshy and Avigail Pilot Testing

### Work

Have both cadets complete several sessions and collect:

- Correctness
- Response time
- Confidence
- Difficulty rating
- Confusing-question reports
- Explanation-helpfulness reports
- Repetition concerns
- Motivation feedback

Suggested review options:

```text
Clear
Confusing
Too easy
Too hard
Helpful explanation
Explanation did not help
Two answers seemed correct
Did not seem connected to the material
```

### Deliverables

- Cadet feedback summary
- Question-quality issue list
- Adaptive-behavior observations
- Recommended revisions

### Acceptance Criteria

- Several complete sessions are finished
- Questions function properly in the app
- Feedback identifies improvements before large-scale generation
- No major schema issue remains unresolved

---

## Checkpoint 8: Revise the Pilot Standard

### Work

- Fix ambiguous questions
- Improve weak distractors
- Shorten or expand explanations
- Adjust difficulty labels
- Adjust question-family structure
- Improve misconception tags
- Update tutor notes
- Update import schema if necessary

### Deliverables

- Revised pilot bank
- Final Chapter 1 content standard
- Updated quality rules
- Updated templates

### Acceptance Criteria

- Pilot questions meet the final standard
- Heshy and Avigail find the explanations useful
- Codex import format is stable
- The project is ready for full Chapter 1 production

---

## Checkpoint 9: Complete Chapter 1 Question Bank

### Work

- Generate remaining question families
- Ensure full objective coverage
- Add cumulative questions
- Add comparison questions
- Add more scenarios
- Add reinforcement and retention questions
- Add practice-test questions
- Review for duplicates and ambiguity
- Review source accuracy

### Target

Approximately 175 to 250 strong questions, adjusted after the blueprint is complete.

### Deliverables

- Full Chapter 1 CSV
- Full Chapter 1 JSON
- Human-readable review workbook
- Complete objective dataset
- Complete concept dataset
- Complete tutor-note dataset
- Concept relationship file
- Practice-test blueprint
- Quality report

### Acceptance Criteria

- Every official objective has sufficient coverage
- Every major concept has multiple question forms
- Important concepts include application and scenario items
- Source coverage is complete
- The bank is ready for controlled student use

---

## Checkpoint 10: Chapter 1 Practice-Test Validation

### Work

- Generate several practice tests
- Check objective distribution
- Check difficulty balance
- Check concept repetition
- Check timing
- Compare Heshy and Avigail results
- Identify questions that behave unexpectedly

### Deliverables

- Practice-test validation report
- Item-performance report
- Revised practice-test blueprint
- Questions flagged for revision

### Acceptance Criteria

- Tests cover the chapter fairly
- No single concept dominates
- Weak areas are reported accurately
- Results are educationally useful

---

## Checkpoint 11: Repeat for Chapters 2 and 3

Use the same process for:

```text
Chapter 2:
The Cadet & the Team

Chapter 3:
The Art & the Science
```

Each chapter will receive objective extraction, concept mapping, tutor notes, a question blueprint, a pilot set, cadet testing, a full question bank, and practice-test validation.

---

## Checkpoint 12: Complete Learn to Lead Volume 1

### Work

- Add cross-chapter concepts
- Add cumulative questions
- Add Volume 1 practice tests
- Add milestone-style mixed review
- Add objective dependency rules
- Add retention review across chapters
- Audit content coverage

### Deliverables

- Complete Volume 1 content package
- Cumulative practice-test blueprint
- Cross-chapter concept graph
- Volume 1 quality report

---

## Checkpoint 13: Learn to Lead Volume 2

After Volume 1 is stable:

- Repeat the same process for Volume 2
- Preserve the same code and naming standards
- Add cross-volume relationships
- Add Billy Mitchell leadership practice tests
- Add cumulative Volume 1 and Volume 2 review

---

## Checkpoint 14: Future AI Content Assistance

AI should be introduced only after the manual content standard is stable.

Future workflow:

1. Upload approved PDF
2. Extract traceable passages
3. Generate draft objectives and concepts
4. Generate draft questions
5. Link every item to source passages
6. Run automated quality checks
7. Require human review
8. Import only approved content

AI may later assist with draft question generation, alternate questions, personalized explanations, reading-level adaptation, duplicate detection, ambiguity detection, distractor review, and question-performance analysis.

AI should never publish questions automatically.

---

# 14. File Outputs

The content-development process should produce:

```text
LTL_V1_C1_Objectives.csv
LTL_V1_C1_Concepts.csv
LTL_V1_C1_Concept_Relationships.csv
LTL_V1_C1_Tutor_Notes.csv
LTL_V1_C1_Question_Blueprint.xlsx
LTL_V1_C1_Questions_Pilot.csv
LTL_V1_C1_Questions_Full.csv
LTL_V1_C1_Practice_Test_Blueprint.csv
LTL_V1_C1_Content_Review_Workbook.xlsx
LTL_V1_C1_Quality_Report.md
LTL_V1_C1_Import_Package.json
```

---

# 15. Quality-Control Checklist

Before any question is approved:

```text
[ ] Supported by official source
[ ] Source pages recorded
[ ] Meaningful objective or concept
[ ] One unambiguously best answer
[ ] Plausible distractors
[ ] Correct-answer explanation
[ ] Explanation for every distractor
[ ] Difficulty reviewed
[ ] Cognitive level reviewed
[ ] Common misconception identified
[ ] Reinforcement relationship considered
[ ] Original wording
[ ] No protected exam content
[ ] No duplicate or near-duplicate
[ ] Grammar and formatting reviewed
[ ] Import fields complete
```

---

# 16. Immediate Next Step

The next project step is:

## Chapter 1 – Checkpoints 1 and 2

Create the final content schema and then extract:

- Every official Chapter 1 objective
- Every section and subsection
- Every major concept
- Source pages
- Prerequisite and related concepts
- Initial concept graph

No large-scale question generation should begin until the Chapter 1 blueprint is reviewed and approved.

---

# 17. Guiding Principle

The goal is not to build the largest question bank.

The goal is to build a carefully structured adaptive learning system that can determine:

- What a cadet knows
- What the cadet misunderstands
- Whether the weakness is recall or application
- Which explanation is most helpful
- What should be studied next
- Whether the cadet retained the concept

The question bank is one part of that system. The objectives, concepts, relationships, tutor notes, explanations, and source references are equally important.
