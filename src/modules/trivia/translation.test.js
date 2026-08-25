import { translateMany } from '../../utils/translator.js';
import {
  translateSubmitResult,
  translateTodaysTrivia,
  translateTriviaQuestion,
  translateTriviaQuestions,
} from './translation.js';

jest.mock('../../utils/translator.js', () => ({
  normalizeLanguage: jest.fn((lang) => typeof lang === 'string' ? lang : 'en'),
  translateMany: jest.fn(),
}));

describe('trivia response translation', () => {
  beforeEach(() => {
    translateMany.mockReset();
    translateMany.mockImplementation(async texts => texts.map(text => `AR:${text}`));
  });

  test('translates only question prose and options in stable order', async () => {
    const item = {
      id: 17,
      question: 'Who built the ark?',
      optionsJson: JSON.stringify(['Noah', 'Moses', 'David', 'Paul']),
      correctAnswer: 0,
      selectedAnswer: 1,
      explanation: 'Noah obeyed God.',
      bookName: 'Genesis',
      chapter: 6,
      verseNumber: 14,
      scriptureRef: 'Genesis 6:14',
      category: 'people',
      difficulty: 'easy',
      totalRemaining: 9,
      metadata: { source: 'seed' },
    };

    const result = await translateTriviaQuestion(item, 'ar');

    expect(translateMany).toHaveBeenCalledWith([
      'Who built the ark?',
      'Noah',
      'Moses',
      'David',
      'Paul',
      'Noah obeyed God.',
    ], 'ar');
    expect(result).toEqual({
      ...item,
      question: 'AR:Who built the ark?',
      optionsJson: JSON.stringify(['AR:Noah', 'AR:Moses', 'AR:David', 'AR:Paul']),
      explanation: 'AR:Noah obeyed God.',
    });
  });

  test('batches all paginated questions in response order', async () => {
    const items = [
      { id: 1, question: 'First', optionsJson: '["A","B"]', explanation: 'One' },
      { id: 2, question: 'Second', optionsJson: '["C","D"]', explanation: 'Two' },
    ];

    const result = await translateTriviaQuestions(items, 'fr');

    expect(translateMany).toHaveBeenCalledTimes(1);
    expect(translateMany.mock.calls[0][0]).toEqual([
      'First', 'A', 'B', 'One', 'Second', 'C', 'D', 'Two',
    ]);
    expect(JSON.parse(result[1].optionsJson)).toEqual(['AR:C', 'AR:D']);
    expect(result.map(item => item.id)).toEqual([1, 2]);
  });

  test('translates submit prose while preserving answer indexes and result metadata', async () => {
    const item = {
      isCorrect: false,
      correctAnswer: 2,
      selectedAnswer: 1,
      correctAnswerText: 'Jerusalem',
      explanation: 'Jerusalem is correct.',
      attempts: 4,
    };

    await expect(translateSubmitResult(item, 'ar')).resolves.toEqual({
      ...item,
      correctAnswerText: 'AR:Jerusalem',
      explanation: 'AR:Jerusalem is correct.',
    });
    expect(translateMany.mock.calls[0][0]).toEqual(['Jerusalem', 'Jerusalem is correct.']);
  });

  test("translates today's question and answerA-D without translating references or enums", async () => {
    const item = {
      id: 8,
      question: 'Question',
      answerA: 'A',
      answerB: 'B',
      answerC: 'C',
      answerD: 'D',
      scriptureRef: 'John 3:16',
      bookName: 'John',
      chapter: 3,
      verseNumber: 16,
      category: 'scripture',
      difficulty: 'medium',
    };

    const result = await translateTodaysTrivia(item, 'ar');

    expect(translateMany.mock.calls[0][0]).toEqual(['Question', 'A', 'B', 'C', 'D']);
    expect(result).toEqual({
      ...item,
      question: 'AR:Question',
      answerA: 'AR:A',
      answerB: 'AR:B',
      answerC: 'AR:C',
      answerD: 'AR:D',
    });
  });

  test('defaults English to unchanged and fails soft without partial translations', async () => {
    const item = { id: 1, question: 'Original', optionsJson: 'not-json', explanation: 'Why' };

    await expect(translateTriviaQuestion(item)).resolves.toBe(item);
    expect(translateMany).not.toHaveBeenCalled();

    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    translateMany.mockRejectedValueOnce(new Error('offline'));
    await expect(translateTriviaQuestion(item, 'ar')).resolves.toBe(item);
    warning.mockRestore();
  });
});
