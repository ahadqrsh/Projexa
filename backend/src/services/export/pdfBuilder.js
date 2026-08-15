import PDFDocument from 'pdfkit';

/**
 * Blocks -> a PDF Buffer.
 *
 * pdfkit has no built-in table layout engine, so tables render as an aligned
 * header row (bold) followed by " | "-joined data rows rather than a drawn
 * grid. That is a deliberate scope call — good enough to read and print,
 * without pulling in a second layout dependency.
 */
const addBlock = (doc, block) => {
  switch (block.kind) {
    case 'heading':
      doc.moveDown(0.5).fontSize(20 - block.level * 2).font('Helvetica-Bold').text(block.text);
      doc.font('Helvetica').fontSize(11);
      break;
    case 'paragraph':
      if (block.text) doc.moveDown(0.3).fontSize(11).text(block.text, { align: 'left' });
      break;
    case 'list':
      if (block.items?.length) {
        doc.moveDown(0.2);
        block.items.forEach((item, i) => {
          doc.fontSize(11).text(`${block.ordered ? `${i + 1}.` : '•'} ${item}`, { indent: 12 });
        });
      }
      break;
    case 'table':
      if (block.rows?.length) {
        doc.moveDown(0.3).fontSize(10).font('Helvetica-Bold').text(block.headers.join('   |   '));
        doc.font('Helvetica');
        block.rows.forEach((row) => {
          doc.fontSize(9.5).text(row.map((c) => String(c ?? '')).join('   |   '));
        });
      }
      break;
    case 'keyValue':
      block.pairs.forEach(([k, v]) => doc.fontSize(11).text(`${k}: `, { continued: true }).font('Helvetica-Bold').text(String(v)).font('Helvetica'));
      break;
    case 'spacer':
      doc.moveDown(0.4);
      break;
    default:
      break;
  }
};

export const buildPdf = ({ project, sections }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(24).font('Helvetica-Bold').text(project.title);
    doc.moveDown(0.3).fontSize(11).font('Helvetica').fillColor('#555').text(project.description);
    doc.fillColor('#000').fontSize(9).text(`${project.domain} · ${project.difficulty} · generated ${new Date().toLocaleDateString()}`);
    doc.moveDown(1);

    sections.forEach((section, index) => {
      if (index > 0) doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold').text(section.title);
      doc.font('Helvetica').fontSize(11).moveDown(0.3);
      section.blocks.forEach((block) => addBlock(doc, block));
    });

    doc.end();
  });

export default buildPdf;
