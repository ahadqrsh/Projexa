import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
} from 'docx';

const headingLevelFor = (level) =>
  ({ 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4 })[level] ??
  HeadingLevel.HEADING_4;

const cell = (text, opts = {}) =>
  new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: String(text ?? ''), bold: opts.bold })] })],
    width: { size: opts.width ?? 100 / (opts.columns ?? 1), type: WidthType.PERCENTAGE },
  });

const docxTable = (headers, rows) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map((h) => cell(h, { bold: true, columns: headers.length })) }),
      ...rows.map((row) => new TableRow({ children: row.map((v) => cell(v, { columns: headers.length })) })),
    ],
  });

/** Blocks -> an array of docx elements (Paragraph / Table). */
const toElements = (blocks) =>
  blocks.flatMap((block) => {
    switch (block.kind) {
      case 'heading':
        return [new Paragraph({ text: block.text, heading: headingLevelFor(block.level) })];
      case 'paragraph':
        return block.text ? [new Paragraph({ children: [new TextRun(block.text)] })] : [];
      case 'list':
        return (block.items ?? []).map(
          (item) =>
            new Paragraph({
              text: item,
              bullet: block.ordered ? undefined : { level: 0 },
              numbering: block.ordered ? { reference: 'default-numbering', level: 0 } : undefined,
            })
        );
      case 'table':
        return block.rows?.length ? [docxTable(block.headers, block.rows), new Paragraph({ text: '' })] : [];
      case 'keyValue':
        return block.pairs.map(
          ([k, v]) =>
            new Paragraph({
              children: [new TextRun({ text: `${k}: `, bold: true }), new TextRun(String(v))],
            })
        );
      case 'spacer':
        return [new Paragraph({ text: '' })];
      default:
        return [];
    }
  });

export const buildDocx = async ({ project, sections }) => {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }],
        },
      ],
    },
    sections: [
      {
        children: [
          new Paragraph({ text: project.title, heading: HeadingLevel.TITLE }),
          new Paragraph({ children: [new TextRun({ text: project.description, italics: true })] }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${project.domain} · ${project.difficulty} · generated ${new Date().toLocaleDateString()}`,
                color: '888888',
                size: 18,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          ...sections.flatMap((section) => [
            new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1, pageBreakBefore: true }),
            ...toElements(section.blocks),
          ]),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
};

export default buildDocx;
