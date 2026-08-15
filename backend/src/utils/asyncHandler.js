/**
 * Wraps an async controller so a rejected promise reaches Express's error
 * middleware instead of becoming an unhandled rejection.
 *
 * This is why there is not a single try/catch in any controller in this codebase.
 */

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
