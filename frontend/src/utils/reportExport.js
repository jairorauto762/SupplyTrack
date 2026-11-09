function safeFileName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'report';
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  const text = String(value ?? '');
  const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function exportCsv({ title, details, columns, rows, baseName }) {
  const lines = [
    [title],
    ...details.map(({ label, value }) => [label, value]),
    [],
    columns,
    ...rows,
  ];
  const content = `\uFEFF${lines.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
  downloadBlob(new Blob([content], { type: 'text/csv;charset=utf-8' }), `${baseName}.csv`);
}

async function exportPdf({ title, details, columns, rows, baseName }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const pdf = new jsPDF();
  pdf.setFontSize(18);
  pdf.text(title, 14, 20);
  pdf.setFontSize(10);

  const detailLines = details.flatMap(({ label, value }) => (
    pdf.splitTextToSize(`${label}: ${value}`, 180)
  ));
  if (detailLines.length) {
    pdf.text(detailLines, 14, 29);
  }

  autoTable(pdf, {
    startY: detailLines.length ? 32 + (detailLines.length - 1) * 5 : 27,
    head: [columns],
    body: rows,
    headStyles: { fillColor: [102, 8, 6] },
    styles: { overflow: 'linebreak', cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  downloadBlob(pdf.output('blob'), `${baseName}.pdf`);
}

async function exportDocx({ title, details, columns, rows, baseName }) {
  const {
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import('docx');

  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: columns.map((column) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: String(column), bold: true })] })],
      })),
    }),
    ...rows.map((row) => new TableRow({
      children: row.map((value) => new TableCell({
        children: [new Paragraph(String(value ?? ''))],
      })),
    })),
  ];

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
        ...details.map(({ label, value }) => new Paragraph({
          children: [
            new TextRun({ text: `${label}: `, bold: true }),
            new TextRun(String(value ?? '')),
          ],
        })),
        new Paragraph(''),
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      ],
    }],
  });

  downloadBlob(await Packer.toBlob(doc), `${baseName}.docx`);
}

export async function exportReport({ format, title, fileName, details = [], columns, rows }) {
  const baseName = safeFileName(fileName || title);

  if (format === 'print') {
    window.print();
  } else if (format === 'pdf') {
    await exportPdf({ title, details, columns, rows, baseName });
  } else if (format === 'docx') {
    await exportDocx({ title, details, columns, rows, baseName });
  } else if (format === 'csv') {
    exportCsv({ title, details, columns, rows, baseName });
  } else {
    throw new Error(`Unsupported report export format: ${format}`);
  }
}
