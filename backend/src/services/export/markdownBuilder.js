/** Blocks -> a single Markdown string. */
const renderBlock = (block) => {
  switch (block.kind) {
    case 'heading':
      return `${'#'.repeat(Math.min(block.level, 6))} ${block.text}\n`;
    case 'paragraph':
      return `${block.text ?? ''}\n`;
    case 'list':
      if (!block.items?.length) return '';
      return block.items.map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`)).join('\n') + '\n';
    case 'table': {
      if (!block.rows?.length) return '';
      const header = `| ${block.headers.join(' | ')} |`;
      const divider = `| ${block.headers.map(() => '---').join(' | ')} |`;
      const rows = block.rows.map((r) => `| ${r.map((cell) => String(cell ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`);
      return [header, divider, ...rows].join('\n') + '\n';
    }
    case 'keyValue':
      return block.pairs.map(([k, v]) => `**${k}:** ${v}`).join('\n') + '\n';
    case 'spacer':
      return '';
    default:
      return '';
  }
};

export const buildMarkdown = ({ project, sections }) => {
  const parts = [
    `# ${project.title}`,
    '',
    project.description,
    '',
    `*${project.domain} · ${project.difficulty} · generated ${new Date().toLocaleDateString()}*`,
    '',
    '---',
    '',
  ];

  for (const section of sections) {
    parts.push(`## ${section.title}`, '');
    for (const block of section.blocks) {
      const rendered = renderBlock(block);
      if (rendered) parts.push(rendered);
    }
    parts.push('---', '');
  }

  return parts.join('\n');
};

export default buildMarkdown;
