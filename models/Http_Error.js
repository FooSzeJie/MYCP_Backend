class HttpError extends Error {
  constructor(message, errorCode) {
    // Method 1
    super(message); // Add a "message" property

    // Method 2
    this.code = errorCode; // Adds a "code" property
  }
}

module.exports = HttpError;
