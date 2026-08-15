import ApiError from '../utils/ApiError.js';
import { ROLES } from '../../../shared/constants/roles.js';

/**
 * Role gate. Coarse-grained "which kind of user" checks only.
 *
 * Ownership ("is this YOUR project") is deliberately NOT here — it needs the
 * document, so it belongs in the ownership middleware and the service layer.
 */
export const authorize =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required.'));
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}.`
        )
      );
    }
    return next();
  };

export const adminOnly = authorize(ROLES.ADMIN);
export const mentorOrAdmin = authorize(ROLES.MENTOR, ROLES.ADMIN);

export default authorize;
