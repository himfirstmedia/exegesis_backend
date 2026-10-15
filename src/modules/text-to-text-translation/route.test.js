import router from "./route.js";
import {
  translationCharacterLimiter,
  translationLimiter,
} from "../../middlewares/rateLimiter.middleware.js";

jest.mock("../../middlewares/auth.middleware.js", () => ({
  optionalAuth: jest.fn((_req, _res, next) => next()),
}));

jest.mock("../../middlewares/validate.middleware.js", () => ({
  validate: jest.fn(() => jest.fn((_req, _res, next) => next())),
}));

jest.mock("./controller.js", () => ({
  translate: jest.fn(),
  translateBatch: jest.fn(),
  detect: jest.fn(),
  languages: jest.fn(),
  status: jest.fn(),
}));

const routeHandlers = (path) =>
  router.stack.find((layer) => layer.route?.path === path).route.stack
    .map((layer) => layer.handle);

describe("translation route limits", () => {
  test.each(["/", "/batch", "/detect"])(
    "applies request and character limits to POST %s",
    (path) => {
      const handlers = routeHandlers(path);
      expect(handlers).toContain(translationLimiter);
      expect(handlers).toContain(translationCharacterLimiter);
    },
  );

  test.each(["/languages", "/status"])(
    "applies request limits to GET %s",
    (path) => {
      expect(routeHandlers(path)).toContain(translationLimiter);
    },
  );

  test("charges detect requests by text length and returns a clear 429", () => {
    const originalLimit = process.env.TRANSLATION_RATE_LIMIT_CHARACTERS;
    process.env.TRANSLATION_RATE_LIMIT_CHARACTERS = "5";
    const req = { body: { q: "123456" }, ip: "192.0.2.10" };
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnValue("sent"),
    };
    const next = jest.fn();

    expect(translationCharacterLimiter(req, res, next)).toBe("sent");
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      returnCode: 429,
      returnMessage: expect.stringContaining("character limit exceeded"),
    }));
    expect(next).not.toHaveBeenCalled();
    if (originalLimit === undefined) delete process.env.TRANSLATION_RATE_LIMIT_CHARACTERS;
    else process.env.TRANSLATION_RATE_LIMIT_CHARACTERS = originalLimit;
  });
});
