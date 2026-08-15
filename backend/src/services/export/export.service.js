import { artifactRepository } from '../../repositories/artifact.repository.js';
import { GENERATION_STATUS } from '../../../../shared/constants/statuses.js';
import { ARTIFACT_TYPE_LIST } from '../../../../shared/constants/artifactTypes.js';
import ApiError from '../../utils/ApiError.js';
import { toBlocks } from './moduleFormatters.js';
import { buildMarkdown } from './markdownBuilder.js';
import { buildPdf } from './pdfBuilder.js';
import { buildDocx } from './docxBuilder.js';

const titleCase = (v = '') => String(v).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const slugify = (v = '') =>
  String(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'project';

const builders = {
  md: { build: buildMarkdown, contentType: 'text/markdown; charset=utf-8', extension: 'md' },
  pdf: { build: buildPdf, contentType: 'application/pdf', extension: 'pdf' },
  docx: {
    build: buildDocx,
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: 'docx',
  },
};

export const getSupportedFormats = () => Object.keys(builders);

/**
 * project + selected module types + format -> { buffer, filename, contentType }.
 *
 * Only COMPLETED artifacts are exportable — a queued or failed module has
 * nothing worth putting in a document, and a stale one is still its last
 * successful content, which is exactly what should be exported.
 */
export const exportProject = async (project, { format, modules } = {}) => {
  const builder = builders[format];
  if (!builder) {
    throw ApiError.badRequest(`Unsupported export format "${format}". Use one of: ${getSupportedFormats().join(', ')}`);
  }

  const requested = Array.isArray(modules) && modules.length ? modules : ARTIFACT_TYPE_LIST;
  const invalid = requested.filter((t) => !ARTIFACT_TYPE_LIST.includes(t));
  if (invalid.length) {
    throw ApiError.badRequest(`Unknown module type(s): ${invalid.join(', ')}`);
  }

  const artifacts = await artifactRepository.findAllForProject(project._id);
  const byType = new Map(artifacts.map((a) => [a.type, a]));

  const sections = requested
    .map((type) => byType.get(type))
    .filter((a) => a && a.status === GENERATION_STATUS.COMPLETED && a.content)
    .map((artifact) => ({
      title: titleCase(artifact.type),
      blocks: toBlocks(artifact.type, artifact.content),
    }));

  if (sections.length === 0) {
    throw ApiError.badRequest('No generated modules match this export request. Generate at least one module first.');
  }

  const buffer = await builder.build({ project, sections });
  const filename = `${slugify(project.title)}-${sections.length === ARTIFACT_TYPE_LIST.length ? 'full' : 'export'}.${builder.extension}`;

  return { buffer, filename, contentType: builder.contentType };
};

export default { exportProject, getSupportedFormats };
