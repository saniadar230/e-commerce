export function successReponse(
  res,
  data,
  statusCode,
  message,
  pagination = undefined,
  meta = undefined
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
    meta,
  });
}
