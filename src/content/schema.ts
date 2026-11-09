import { z } from 'zod';

/**
 * Runtime content schemas — the single source of truth for the app.
 * Mirrors Phase-1-Blueprint/CONTENT_SCHEMA.md plus the small implementation
 * extensions recorded in DECISIONS.md (appendix lessons, inline markdown,
 * source availability, case exam-use/fidelity notes).
 */

export const coverageSchema = z.enum(['COVERED', 'PARTIAL', 'SYLLABUS_ONLY', 'NEEDS_VERIFICATION']);
export type CoverageStatus = z.infer<typeof coverageSchema>;

export const sourceRefSchema = z.object({
  sourceId: z.string().min(1),
  page: z.string().optional(),
  paras: z.string().optional(),
  section: z.string().optional(),
  excerptHint: z.string().optional(),
});
export type SourceRef = z.infer<typeof sourceRefSchema>;

export const sourceDocumentSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  role: z.enum(['syllabus', 'reviewer', 'outlineImage']),
  format: z.enum(['pdf', 'docx', 'jpg']),
  bytes: z.number().int().positive(),
  pages: z.number().int().positive().optional(),
  courseIds: z.array(z.string()),
  blockIds: z.array(z.string()),
  downloadPath: z.string().min(1),
  available: z.boolean().default(true),
  notes: z.string().optional(),
});
export type SourceDocument = z.infer<typeof sourceDocumentSchema>;

export const catalogSchema = z.object({
  version: z.string().min(1),
  courses: z.array(z.string().min(1)).min(1),
  sourceDocuments: z.array(sourceDocumentSchema).min(1),
});
export type Catalog = z.infer<typeof catalogSchema>;

const gradingSchema = z.object({ component: z.string(), weight: z.string() });
const examCoverageSchema = z.object({ exam: z.string(), coverage: z.string() });

export const courseSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  title: z.string().min(1),
  institution: z.string().min(1),
  school: z.string().optional(),
  academicYear: z.string().min(1),
  lecturer: z.string().optional(),
  description: z.string().min(1),
  grading: z.array(gradingSchema).optional(),
  examCoverage: z.array(examCoverageSchema).optional(),
  blockIds: z.array(z.string().min(1)).min(1),
});
export type Course = z.infer<typeof courseSchema>;

export const syllabusBlockSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  code: z.string().min(1),
  title: z.string().min(1),
  syllabusPages: z.string().min(1),
  moduleIds: z.array(z.string().min(1)),
  coverage: coverageSchema,
});
export type SyllabusBlock = z.infer<typeof syllabusBlockSchema>;

export const moduleSchema = z.object({
  id: z.string().min(1),
  blockId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  syllabusPages: z.string().min(1),
  topicIds: z.array(z.string().min(1)),
  primarySourceIds: z.array(z.string().min(1)),
  coverage: coverageSchema,
});
export type Module = z.infer<typeof moduleSchema>;

export const topicSchema = z.object({
  id: z.string().min(1),
  moduleId: z.string().min(1),
  syllabusNumber: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().optional(),
  lessonIds: z.array(z.string().min(1)),
  provisionIds: z.array(z.string()),
  caseIds: z.array(z.string()),
  coverage: coverageSchema,
  verificationNotes: z.string().optional(),
});
export type Topic = z.infer<typeof topicSchema>;

export const comparisonTableSchema = z.object({
  caption: z.string().min(1),
  columns: z.array(z.string().min(1)).min(1),
  rows: z.array(z.array(z.string())),
});
export type ComparisonTable = z.infer<typeof comparisonTableSchema>;

export const lessonBlockSchema = z.object({
  anchorId: z.string().min(1),
  kind: z.enum([
    'heading',
    'definition',
    'explanation',
    'provision',
    'caseDigest',
    'comparisonTable',
    'note',
    'selfCheck',
    'sourceList',
  ]),
  /** Inline Markdown string. (File-based prose is a later extension.) */
  markdown: z.string().optional(),
  provisionId: z.string().optional(),
  caseId: z.string().optional(),
  table: comparisonTableSchema.optional(),
  severity: z.enum(['info', 'trap', 'exam']).optional(),
  keyed: z.boolean(),
  sourceRefs: z.array(sourceRefSchema).min(1),
});
export type LessonBlock = z.infer<typeof lessonBlockSchema>;

const lessonBase = {
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  coverage: coverageSchema,
  blocks: z.array(lessonBlockSchema).min(1),
  prevLessonId: z.string().optional(),
  nextLessonId: z.string().optional(),
};

export const lessonSchema = z.discriminatedUnion('kind', [
  z.object({ ...lessonBase, kind: z.literal('lesson'), topicId: z.string().min(1) }),
  z.object({
    ...lessonBase,
    kind: z.literal('appendix'),
    moduleId: z.string().min(1),
  }),
]);
export type Lesson = z.infer<typeof lessonSchema>;

export const legalProvisionSchema = z.object({
  id: z.string().min(1),
  citation: z.string().min(1),
  instrument: z.string().min(1),
  articleOrSection: z.string().min(1),
  verbatim: z.string().optional(),
  explanation: z.string().optional(),
  topicIds: z.array(z.string()),
  caseIds: z.array(z.string()),
  sourceRefs: z.array(sourceRefSchema).min(1),
});
export type LegalProvision = z.infer<typeof legalProvisionSchema>;

export const caseDigestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  citation: z.string().optional(),
  facts: z.string().optional(),
  issue: z.string().optional(),
  ruling: z.string().optional(),
  doctrine: z.string().min(1),
  keyPhrase: z.string().optional(),
  examUse: z.string().optional(),
  note: z.string().optional(),
  topicIds: z.array(z.string()),
  provisionIds: z.array(z.string()),
  sourceRefs: z.array(sourceRefSchema).min(1),
});
export type CaseDigest = z.infer<typeof caseDigestSchema>;

const mcqChoiceSchema = z.object({
  label: z.string(),
  text: z.string(),
  correct: z.boolean(),
  rationale: z.string().optional(),
});

export const practiceQuestionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['selfTest', 'iracHypo', 'mcq']),
  topicIds: z.array(z.string()),
  prompt: z.string().min(1),
  answerKey: z.string().optional(),
  hints: z
    .object({
      issue: z.string().optional(),
      rule: z.string().optional(),
      application: z.string().optional(),
      conclusion: z.string().optional(),
    })
    .optional(),
  modelSolution: z.string().optional(),
  choices: z.array(mcqChoiceSchema).optional(),
  sourceRefs: z.array(sourceRefSchema).min(1),
  editorialStatus: z.enum(['source-backed', 'authored-draft', 'reviewed']),
});
export type PracticeQuestion = z.infer<typeof practiceQuestionSchema>;

export const flashcardSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['term', 'provision', 'doctrine', 'comparison', 'qa']),
  front: z.string().min(1),
  back: z.string().min(1),
  topicIds: z.array(z.string()),
  tags: z.array(z.string()),
  deckIds: z.array(z.string()),
  sourceRefs: z.array(sourceRefSchema).min(1),
  editorialStatus: z.enum(['source-backed', 'authored-draft', 'reviewed']),
});
export type Flashcard = z.infer<typeof flashcardSchema>;

export const lessonsIndexSchema = z.object({ lessons: z.array(z.string().min(1)) });
