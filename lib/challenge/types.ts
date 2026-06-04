export type TriText = { e: string; s: string; d: string };
export type TriTextArray = { e: string[]; s: string[]; d: string[] };

export type ChallengeQuestionPublic = {
  source_question_id: string;
  question_index: number;
  category: 'vocabulary' | 'proverbs' | 'riddles';
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: TriText;
  options: TriTextArray;
};

export type ChallengeQuestionAnswers = Record<string, {
  correct_answer_index: number;
  explanation?: TriText;
}>;

export type CompletionAnswer = {
  source_question_id: string;
  selected_answer_index: number;
  time_to_answer_ms?: number;
};

export type ChallengeQuestionFull = ChallengeQuestionPublic & {
  correct_answer_index: number;
  explanation?: TriText;
};
