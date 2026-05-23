import { QUESTIONS, Question } from './questions-data';
import { ExamModel, ExamQuestion } from './db';

export function generateExamModel(count: number = 55): ExamModel {
  // Group questions by unit to ensure good distribution
  const byUnit: Record<string, Question[]> = {};
  for (const q of QUESTIONS) {
    if (!byUnit[q.unit]) byUnit[q.unit] = [];
    byUnit[q.unit].push(q);
  }

  const units = Object.keys(byUnit);
  const questionsPerUnit = Math.floor(count / units.length);
  const remainder = count - questionsPerUnit * units.length;

  const selected: Question[] = [];

  for (let i = 0; i < units.length; i++) {
    const unitQuestions = shuffle([...byUnit[units[i]]]);
    const take = questionsPerUnit + (i < remainder ? 1 : 0);
    selected.push(...unitQuestions.slice(0, Math.min(take, unitQuestions.length)));
  }

  // If we still need more, pick randomly from all
  if (selected.length < count) {
    const remaining = QUESTIONS.filter(q => !selected.find(s => s.id === q.id));
    const extra = shuffle(remaining).slice(0, count - selected.length);
    selected.push(...extra);
  }

  // Shuffle the final selection
  const shuffled = shuffle(selected.slice(0, count));

  const examQuestions: ExamQuestion[] = shuffled.map(q => ({
    id: q.id,
    question: q.question,
    choices: shuffleChoices(q.choices, q.correctAnswer),
    correctAnswer: 0, // will be set correctly below
    unit: q.unit,
    unitAr: q.unitAr,
  }));

  // Re-calculate correct answer after shuffling choices
  for (let i = 0; i < shuffled.length; i++) {
    const originalCorrect = shuffled[i].choices[shuffled[i].correctAnswer];
    const newCorrectIdx = examQuestions[i].choices.indexOf(originalCorrect);
    examQuestions[i].correctAnswer = newCorrectIdx;
  }

  return {
    questions: examQuestions,
    generatedAt: new Date().toISOString(),
  };
}

function shuffleChoices(choices: string[], correctIdx: number): string[] {
  const correctAnswer = choices[correctIdx];
  const shuffled = shuffle([...choices]);
  // Ensure correct answer is included (it should be since we shuffle all)
  if (!shuffled.includes(correctAnswer)) {
    shuffled[0] = correctAnswer;
  }
  return shuffled;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function scoreExam(
  questions: ExamQuestion[],
  answers: Record<string, number>
): { score: number; total: number; percentage: number } {
  let score = 0;
  const total = questions.length;
  
  for (const q of questions) {
    if (answers[q.id] === q.correctAnswer) {
      score++;
    }
  }
  
  const percentage = Math.round((score / total) * 100);
  return { score, total, percentage };
}

export function getWeaknessAnalysis(
  questions: ExamQuestion[],
  answers: Record<string, number>
): { unit: string; unitAr: string; correct: number; total: number; percentage: number }[] {
  const unitStats: Record<string, { correct: number; total: number; unitAr: string }> = {};
  
  for (const q of questions) {
    if (!unitStats[q.unit]) {
      unitStats[q.unit] = { correct: 0, total: 0, unitAr: q.unitAr };
    }
    unitStats[q.unit].total++;
    if (answers[q.id] === q.correctAnswer) {
      unitStats[q.unit].correct++;
    }
  }
  
  return Object.entries(unitStats).map(([unit, stats]) => ({
    unit,
    unitAr: stats.unitAr,
    correct: stats.correct,
    total: stats.total,
    percentage: Math.round((stats.correct / stats.total) * 100),
  })).sort((a, b) => a.percentage - b.percentage);
}
