/**
 * Wraps an async Express route handler and forwards any unhandled rejections
 * to the Express global error handler (next(error)).
 *
 * Eliminates repetitive try/catch boilerplate in every controller function.
 *
 * @param {Function} fn - Async Express handler (req, res, next) => Promise
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await userRepository.findById(req.params.id);
 *   res.json({ success: true, data: user });
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
