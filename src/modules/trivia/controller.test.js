import * as triviaController from './controller.js';
import * as triviaService from './service.js';
import {
  translateSubmitResult,
  translateTodaysTrivia,
  translateTriviaQuestion,
  translateTriviaQuestions,
} from './translation.js';

jest.mock('./service.js', () => ({
  getQuestion: jest.fn(),
  getAllQuestions: jest.fn(),
  getRandomQuestion: jest.fn(),
  submitAnswer: jest.fn(),
  getTodaysTrivia: jest.fn(),
}));

jest.mock('./translation.js', () => ({
  translateTriviaQuestion: jest.fn(async item => item),
  translateTriviaQuestions: jest.fn(async items => items),
  translateSubmitResult: jest.fn(async item => item),
  translateTodaysTrivia: jest.fn(async item => item),
}));

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('trivia controller response languages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    ['getQuestion', 'getQuestion', translateTriviaQuestion, { id: 1, lang: 'ar' }, { id: 1 }],
    ['getRandomQuestion', 'getRandomQuestion', translateTriviaQuestion, { lang: 'fr' }, { id: 2 }],
    ['submitAnswer', 'submitAnswer', translateSubmitResult, { questionId: 2, selectedAnswer: 1, lang: 'es' }, { correctAnswer: 1 }],
    ['getTodaysTrivia', 'getTodaysTrivia', translateTodaysTrivia, { lang: 'de' }, { id: 3 }],
  ])('%s consumes body.lang', async (controllerName, serviceName, translator, body, data) => {
    triviaService[serviceName].mockResolvedValue({ status: 200, message: 'OK', data });

    await triviaController[controllerName]({ body, user: { id: 'user-1' } }, makeRes());

    expect(translator).toHaveBeenCalledWith(data, body.lang);
  });

  test('getAllQuestions translates the nested records with body.lang', async () => {
    const records = [{ id: 1 }, { id: 2 }];
    triviaService.getAllQuestions.mockResolvedValue({
      status: 200,
      message: 'OK',
      data: { data: records, total: 2, hasNext: false },
    });

    await triviaController.getAllQuestions({ body: { lang: 'sw' }, user: { id: 'user-1' } }, makeRes());

    expect(translateTriviaQuestions).toHaveBeenCalledWith(records, 'sw');
  });

  test('defaults a missing body language to English', async () => {
    const data = { id: 3 };
    triviaService.getTodaysTrivia.mockResolvedValue({ status: 200, message: 'OK', data });

    await triviaController.getTodaysTrivia({ body: {}, user: { id: 'user-1' } }, makeRes());

    expect(translateTodaysTrivia).toHaveBeenCalledWith(data, 'en');
  });

  test('can return answer correctness without waiting for prose translation', async () => {
    const data = {
      isCorrect: true,
      correctAnswer: 0,
      correctAnswerText: 'Noah',
      explanation: 'Noah built the ark.',
    };
    triviaService.submitAnswer.mockResolvedValue({ status: 200, message: 'OK', data });

    await triviaController.submitAnswer(
      {
        body: { questionId: 1, selectedAnswer: 0, lang: 'ar', translateProse: false },
        user: { id: 'user-1' },
      },
      makeRes(),
    );

    expect(translateSubmitResult).not.toHaveBeenCalled();
  });
});
