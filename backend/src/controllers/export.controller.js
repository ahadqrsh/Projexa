import asyncHandler from '../utils/asyncHandler.js';
import * as exportService from '../services/export/export.service.js';

export const exportProject = asyncHandler(async (req, res) => {
  const format = String(req.query.format ?? 'pdf').toLowerCase();
  const modules = req.query.modules ? String(req.query.modules).split(',').map((s) => s.trim().toUpperCase()) : undefined;

  const { buffer, filename, contentType } = await exportService.exportProject(req.project, { format, modules });

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.status(200).send(buffer);
});

export default { exportProject };
