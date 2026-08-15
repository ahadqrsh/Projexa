/**
 * The one success envelope. Every controller returns this shape so the client's
 * Axios interceptor can unwrap responses in exactly one place.
 */

import { HTTP } from '../config/constants.js';

class ApiResponse {
  constructor(statusCode = HTTP.OK, data = null, message = 'Success', meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta;
  }

  static ok(data, message = 'Success', meta = null) {
    return new ApiResponse(HTTP.OK, data, message, meta);
  }

  static created(data, message = 'Created successfully') {
    return new ApiResponse(HTTP.CREATED, data, message);
  }

  static accepted(data, message = 'Accepted') {
    return new ApiResponse(HTTP.ACCEPTED, data, message);
  }
}

export default ApiResponse;
export { ApiResponse };
