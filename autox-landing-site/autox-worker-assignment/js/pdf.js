/**
 * PDF generation — creates Worker Assignments and Groups Page PDFs
 * Uses jsPDF + jspdf-autotable
 */

const PDF = {
  _getJsPDF() {
    if (typeof jspdf !== 'undefined' && jspdf.jsPDF) return jspdf.jsPDF;
    if (typeof jsPDF !== 'undefined') return jsPDF;
    throw new Error('jsPDF library not loaded. Check your internet connection and refresh.');
  },

  /**
   * Generate the Worker Assignments PDF (check-in list)
   */
  generateWorkerAssignments(entrants, groupAssignments, eventTitle, hasLadies, options) {
    const JSPDF = this._getJsPDF();
    const doc = new JSPDF('portrait', 'pt', 'letter');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Preassigned Workers & Check In', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('Sorted by First Name', pageWidth / 2, 44, { align: 'center' });

    const g1Header = Groups.buildGroupHeader(groupAssignments, 1, hasLadies, entrants, options);
    const g2Header = Groups.buildGroupHeader(groupAssignments, 2, hasLadies, entrants, options);

    let y = 62;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RUN 1st', 30, y);
    doc.text('Work 2nd:', 30, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (g1Header.classes) doc.text(g1Header.classes, 100, y + 6);

    y += 24;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RUN 2nd', 30, y);
    doc.text('Work 1st:', 30, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (g2Header.classes) doc.text(g2Header.classes, 100, y + 6);

    y += 22;

    const sorted = [...entrants].sort((a, b) => a.competitor.localeCompare(b.competitor));
    const tableBody = sorted.map((e) => [
      e.competitor,
      `${e.class}_${e.pax}_${e.number}`,
      e.running,
      e.working,
      e.position,
      e.comments || '',
    ]);

    doc.autoTable({
      startY: y,
      head: [['Competitor', 'Class / PAX / #', 'Running', 'Working', 'Position', 'Comments / Changes']],
      body: tableBody,
      styles: { fontSize: 7, cellPadding: 2, lineWidth: 0.5, lineColor: [0, 0, 0] },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.5, lineColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 100 }, 1: { cellWidth: 70 }, 2: { cellWidth: 65 },
        3: { cellWidth: 55 }, 4: { cellWidth: 90 }, 5: { cellWidth: 'auto' },
      },
      margin: { left: 20, right: 20 },
      theme: 'grid',
    });

    return doc;
  },

  /**
   * Generate the Groups Page PDF (worker position grid)
   */
  generateGroupsPage(entrants, groupAssignments, eventTitle, cornerCount, hasLadies, options) {
    const JSPDF = this._getJsPDF();
    const doc = new JSPDF('portrait', 'pt', 'letter');
    const pageWidth = doc.internal.pageSize.getWidth();
    cornerCount = cornerCount || 4;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(eventTitle || 'ALSCCA Autocross', pageWidth / 2, 25, { align: 'center' });

    const early = entrants.filter((e) => e.working === 'Early' || e.working === 'Lunch');
    const earlyGrid = this._buildEarlyGrid(early);

    let y = 40;
    y = this._drawEarlySection(doc, earlyGrid, y);

    const g1Header = Groups.buildGroupHeader(groupAssignments, 1, hasLadies, entrants, options);
    const g2Header = Groups.buildGroupHeader(groupAssignments, 2, hasLadies, entrants, options);

    y += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('RUN 1st - Work 2nd:', 20, y);
    doc.setFont('helvetica', 'normal');
    if (g1Header.classes) doc.text(g1Header.classes, 110, y);

    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('RUN 2nd - Work 1st:', 20, y);
    doc.setFont('helvetica', 'normal');
    if (g2Header.classes) doc.text(g2Header.classes, 110, y);

    y += 18;
    y = this._drawWorkSection(doc, entrants, 'Work 1st', 'WORKING 1st', cornerCount, y);
    y += 14;
    y = this._drawWorkSection(doc, entrants, 'Work 2nd', 'WORKING 2nd', cornerCount, y);

    return doc;
  },

  _buildEarlyGrid(earlyEntrants) {
    const grid = {};
    for (const e of earlyEntrants) {
      let name = e.competitor;
      if (e.chalkLiner) name += ' (Chalk Liner)';
      grid[e.position] = name;
    }
    return grid;
  },

  _drawEarlySection(doc, grid, startY) {
    const positions = [
      'Event Chair', 'Event Chair Shadow', 'Course Designer',
      'Truck & Trailer To Site Driver', 'Trailer Setup Support',
      'Truck & Trailer To Storage Driver', 'Truck & Trailer To Storage Helper',
      'Course Setup 1', 'Course Setup 2', 'Course Setup 3',
      'Course Setup 4', 'Course Setup 5', 'Course Setup 6',
      'Worker Chief', 'Intermediate Coach',
      'Novice Coach 1', 'Novice Coach 2', 'Novice Coach 3',
      'Tech 1', 'Tech 2', 'Tech 3',
      'Waiver', 'Early Waiver 1', 'Early Waiver 2', 'Early Waiver 3',
      'Late Waiver 1', 'Lunch Waiver',
      'Paddock Marshal', 'Paddock Marshal Early', 'Paddock Marshal Late',
    ];
    const colXs = [20, 300];
    const rowHeight = 12;

    const perCol = Math.ceil(positions.length / 2);
    const cols = [
      positions.slice(0, perCol),
      positions.slice(perCol),
    ];

    let maxRows = Math.max(...cols.map((c) => c.length));
    let y = startY;

    for (let r = 0; r < maxRows; r++) {
      for (let c = 0; c < 2; c++) {
        const pos = cols[c] && cols[c][r];
        if (!pos) continue;
        const x = colXs[c];
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(pos, x, y);
        doc.setFont('helvetica', 'normal');
        doc.text(grid[pos] || '', x + 120, y);
      }
      y += rowHeight;
    }
    return y;
  },

  /**
   * Draw a work session section with corners showing workers in same column as captain
   */
  _drawWorkSection(doc, entrants, workSession, title, cornerCount, startY) {
    const workers = entrants.filter((e) => e.working === workSession && e.position);

    let y = startY;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, y);
    y += 4;

    // Build session-specific position list from essential + experienced + session manual + shadow
    const sessionNum = workSession === 'Work 1st' ? 1 : 2;
    const sessionManual = CONFIG.sessionPositionGroups.flatMap((g) => g.positions);
    const sessionPositions = [
      ...CONFIG.workerPositions.essential,
      ...sessionManual,
      ...CONFIG.workerPositions.experienced,
      ...CONFIG.workerPositions.shadow,
    ]
      .filter((p) => p.session === sessionNum)
      .map((p) => p.name);

    const specData = sessionPositions.map((pos) => {
      const worker = workers.find((w) => w.position === pos);
      return [pos, worker ? worker.competitor : ''];
    });

    // Corner data
    const cornerData = [];
    for (let c = 1; c <= cornerCount; c++) {
      const captain = workers.find((w) => w.position === `Corner ${c} Captain`);
      const cornerWorkers = workers.filter((w) => w.position === `Corner ${c} Worker`);
      cornerData.push({
        corner: c,
        captain: captain ? captain.competitor : '',
        workers: cornerWorkers.map((w) => w.competitor),
      });
    }

    // Draw specialized positions table
    doc.autoTable({
      startY: y,
      body: specData,
      styles: { fontSize: 7, cellPadding: 2, lineWidth: 0.5, lineColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 90 },
      },
      margin: { left: 20 },
      theme: 'grid',
      tableWidth: 160,
    });

    const specEndY = doc.lastAutoTable.finalY;

    // Draw corners in 2-column layout: [Corner 1][Corner 2] then [Corner 3][Corner 4]
    let cornerY = y;
    const cornerStartX = 190;
    const cornerWidth = doc.internal.pageSize.getWidth() - cornerStartX - 20;
    const colWidth = (cornerWidth - 6) / 2; // 6px gap between columns

    for (let c = 0; c < cornerData.length; c += 2) {
      const left = cornerData[c];
      const right = cornerData[c + 1];
      let rowEndY = cornerY;

      // Left corner table
      const leftPairs = [];
      for (let w = 0; w < left.workers.length; w += 2) {
        leftPairs.push([left.workers[w] || '', left.workers[w + 1] || '']);
      }
      if (leftPairs.length === 0) leftPairs.push(['', '']);

      doc.autoTable({
        startY: cornerY,
        head: [[`Corner ${left.corner} Captain:`, left.captain]],
        body: leftPairs,
        styles: { fontSize: 7, cellPadding: 2, lineWidth: 0.5, lineColor: [0, 0, 0] },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        margin: { left: cornerStartX },
        tableWidth: colWidth,
        theme: 'grid',
      });
      rowEndY = Math.max(rowEndY, doc.lastAutoTable.finalY);

      // Right corner table (if exists)
      if (right) {
        const rightPairs = [];
        for (let w = 0; w < right.workers.length; w += 2) {
          rightPairs.push([right.workers[w] || '', right.workers[w + 1] || '']);
        }
        if (rightPairs.length === 0) rightPairs.push(['', '']);

        doc.autoTable({
          startY: cornerY,
          head: [[`Corner ${right.corner} Captain:`, right.captain]],
          body: rightPairs,
          styles: { fontSize: 7, cellPadding: 2, lineWidth: 0.5, lineColor: [0, 0, 0] },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
          margin: { left: cornerStartX + colWidth + 6 },
          tableWidth: colWidth,
          theme: 'grid',
        });
        rowEndY = Math.max(rowEndY, doc.lastAutoTable.finalY);
      }

      cornerY = rowEndY + 4;
    }

    return Math.max(specEndY, cornerY);
  },

  save(doc, filename) {
    doc.save(filename);
  },
};
