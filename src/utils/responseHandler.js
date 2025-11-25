// Success response
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    status: 'success',
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

// Error response
const sendError = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    status: 'error',
    message
  });
};

// Paginated response
const sendPaginated = (res, message, data, pagination, statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    pagination: {
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated
};