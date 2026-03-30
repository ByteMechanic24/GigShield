/**
 * Global Error Guard Middleware
 * Prevent structural/stack tracing leakage inherently to boundary clients
 */
function errorHandler(err, req, res, next) {
  // Capture native contextual stack faults server-bound securely
  console.error("Global Catch Executed:", err);
  
  const status = err.status || 500;
  
  res.status(status).json({ 
    detail: "Internal server error" 
  });
}

module.exports = errorHandler;
