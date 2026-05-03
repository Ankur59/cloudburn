import AppError from '../utils/AppError.js';

// ── MongoDB error normalizers ─────────────────────────────────────────────────
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateKey = (err) => {
  let field = 'field';
  let value = 'value';
  
  const keyValue = err.keyValue || (err.writeErrors && err.writeErrors[0]?.err?.keyValue);
  
  if (keyValue && typeof keyValue === 'object') {
    field = Object.keys(keyValue)[0];
    value = keyValue[field];
    return new AppError(
      `'${value}' is already registered for ${field}. Please use a different value.`,
      409
    );
  }

  return new AppError(
    'Duplicate key error. A record with these unique fields already exists.',
    409
  );
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 400);
};

// ── JWT error normalizers ─────────────────────────────────────────────────────
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpired = () =>
  new AppError('Your session has expired. Please log in again.', 401);

// ── Global error handler ──────────────────────────────────────────────────────
export const errorHandler = (err, req, res, next) => {
  let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err, {
    message: err.message,
  });

  if (error.name === 'CastError')       error = handleCastError(error);
  if (error.code === 11000)             error = handleDuplicateKey(error);
  if (error.name === 'ValidationError') error = handleValidationError(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpired();

  error.statusCode = error.statusCode || 500;
  error.status     = error.status     || 'error';

  // Development — full details
  if (process.env.NODE_ENV === 'development') {
    return res.status(error.statusCode).json({
      success: false,
      status:  error.status,
      message: error.message,
      stack:   err.stack,
    });
  }

  // Production — only send operational errors to client
  if (error.isOperational) {
    const body = { success: false, status: error.status, message: error.message };
    if (error.errors) body.errors = error.errors;
    return res.status(error.statusCode).json(body);
  }

  console.error('💥 UNHANDLED ERROR:', err);
  return res.status(500).json({
    success: false,
    status:  'error',
    message: 'Something went wrong. Please try again later.',
  });
};
