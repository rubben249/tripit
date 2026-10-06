import type { DocItem, TripDocument } from './tripDocument';

/**
 * Renders a trip document to a .docx file. The `docx` library is imported lazily so its ~1 MB only
 * loads when someone actually exports a trip, never on app start.
 */

type DocxModule = typeof import('docx');

function itemParagraphs(docx: DocxModule, item: DocItem) {
  const { Paragraph, TextRun } = docx;
  const heading = [
    item.time ? `${item.time} — ` : '',
    item.title,
    item.status ? ` (${item.status})` : '',
  ].join('');

  return [
    new Paragraph({
      spacing: { before: 160, after: 40 },
      children: [
        new TextRun({ text: heading, bold: true }),
        new TextRun({ text: `  ${item.category}`, italics: true, color: '7A5C42' }),
      ],
    }),
    ...item.lines.map(
      (line) =>
        new Paragraph({
          indent: { left: 360 },
          spacing: { after: 20 },
          children: [
            new TextRun({ text: `${line.label}: `, bold: true }),
            new TextRun({ text: line.text }),
          ],
        }),
    ),
  ];
}

export async function buildDocxBlob(doc: TripDocument): Promise<Blob> {
  const docx = await import('docx');
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = docx;

  const children = [
    new Paragraph({ text: doc.title, heading: HeadingLevel.TITLE }),
    ...(doc.subtitle
      ? [new Paragraph({ children: [new TextRun({ text: doc.subtitle, italics: true })] })]
      : []),
    ...(doc.total
      ? [
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: 'Booked so far: ', bold: true }),
              new TextRun({ text: doc.total }),
            ],
          }),
        ]
      : []),

    ...doc.days.flatMap((day) => [
      new Paragraph({
        text: day.city ? `${day.heading} · ${day.city}` : day.heading,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 320 },
      }),
      ...(day.notes
        ? [new Paragraph({ children: [new TextRun({ text: day.notes, italics: true })] })]
        : []),
      ...(day.items.length === 0
        ? [
            new Paragraph({
              children: [new TextRun({ text: 'Nothing planned yet.', italics: true })],
            }),
          ]
        : day.items.flatMap((item) => itemParagraphs(docx, item))),
    ]),

    ...(doc.undated.length > 0
      ? [
          new Paragraph({
            text: 'Not tied to a day',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 320 },
          }),
          ...doc.undated.flatMap((item) => itemParagraphs(docx, item)),
        ]
      : []),

    ...(doc.notes.length > 0
      ? [
          new Paragraph({
            text: 'Notes',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 320 },
          }),
          ...doc.notes.flatMap((note) => [
            new Paragraph({
              text: note.title,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200 },
            }),
            // Word has no multi-line paragraph: each line of the note becomes one.
            ...(note.body ? note.body.split('\n') : ['']).map(
              (line) => new Paragraph({ text: line }),
            ),
          ]),
        ]
      : []),
  ];

  const document = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } },
        title: { run: { size: 56, bold: true, color: '6B4A33' } },
        heading1: { run: { size: 30, bold: true, color: '8A5A34' } },
        heading2: { run: { size: 26, bold: true, color: '6B4A33' } },
      },
    },
    sections: [{ children }],
  });

  return Packer.toBlob(document);
}
