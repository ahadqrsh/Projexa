import { randomUUID } from 'node:crypto';

/**
 * Assigns a trace id to every request and echoes it in the response header.
 * When a user reports "it failed at 3pm", the id in their error payload finds the
 * exact log line. Honours an inbound X-Request-Id so a trace survives across hops.
 */
export const requestId = (req, res, next) => {
  req.id = req.get('X-Request-Id') || randomUUID();
  res.set('X-Request-Id', req.id);
  next();
};

export default requestId;
