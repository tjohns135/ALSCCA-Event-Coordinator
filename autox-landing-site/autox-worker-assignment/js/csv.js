/**
 * CSV parsing — reads entry list CSV into entrant objects
 */

const CSV = {
  /**
   * Parse CSV file into array of entrant objects
   * Expected columns: Competitor, Class, PAX, #, SCCA Member
   */
  parse(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const results = this.parseText(e.target.result);
          resolve(results);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
  },

  /**
   * Parse CSV text content
   */
  parseText(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have a header row and at least one data row');
    }

    const header = this._parseLine(lines[0]);
    const colMap = this._mapColumns(header);

    const entrants = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = this._parseLine(line);
      const entrant = {
        competitor: (fields[colMap.competitor] || '').trim(),
        class: (fields[colMap.class] || '').trim().toUpperCase(),
        pax: (fields[colMap.pax] || '').trim().toUpperCase(),
        number: (fields[colMap.number] || '').trim(),
        sccaMember: (fields[colMap.sccaMember] || '').trim(),
        // New MotorsportReg columns (metadata, not displayed in spreadsheet)
        preference1: colMap.preference1 !== undefined ? (fields[colMap.preference1] || '').trim() : '',
        eventPreference: colMap.eventPreference !== undefined ? (fields[colMap.eventPreference] || '').trim() : '',
        vehicle: colMap.vehicle !== undefined ? (fields[colMap.vehicle] || '').trim() : '',
        phone: colMap.phone !== undefined ? (fields[colMap.phone] || '').trim() : '',
        trailer: colMap.trailer !== undefined ? (fields[colMap.trailer] || '').trim() : '',
        // These get filled in by group splitting and worker assignment
        classPaxNum: '', // formatted as Class_PAX_#
        running: '',
        working: '',
        position: '',
        checkin: '',
        comments: '',
      };

      if (entrant.competitor) {
        entrant.classPaxNum = `${entrant.class}_${entrant.pax}_${entrant.number}`;
        entrants.push(entrant);
      }
    }

    return entrants;
  },

  /**
   * Parse a single CSV line, handling quoted fields
   */
  _parseLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current);
    return fields;
  },

  /**
   * Map header names to column indices
   */
  _mapColumns(header) {
    const normalize = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const map = {};

    for (let i = 0; i < header.length; i++) {
      const col = normalize(header[i]);
      if (col === 'competitor' || col === 'name' || col.includes('fullname')) map.competitor = i;
      else if (col === 'class') map.class = i;
      else if (col === 'pax' || col === 'modifierpax') map.pax = i;
      else if (col === '' || col === 'number' || col === 'carno' || col === 'carnum' || col === 'no') {
        if (header[i].trim() === '#' || col === 'number' || col === 'carno' || col === 'carnum' || col === 'no') {
          map.number = i;
        }
      }
      else if (col === 'sccamember' || col === 'member') map.sccaMember = i;
      // New MotorsportReg columns
      else if (col === 'preference1') map.preference1 = i;
      else if (col === 'eventpreference') map.eventPreference = i;
      else if (col.includes('vehicle') || col.includes('yearmakemodel')) map.vehicle = i;
      else if (col.includes('phone') || col.includes('mobile')) map.phone = i;
      else if (col === 'trailer') map.trailer = i;
    }

    // Handle '#' specifically
    if (map.number === undefined) {
      for (let i = 0; i < header.length; i++) {
        if (header[i].trim() === '#') {
          map.number = i;
          break;
        }
      }
    }

    if (map.competitor === undefined || map.class === undefined || map.pax === undefined) {
      throw new Error(
        'CSV must have Competitor, Class, and PAX columns. Found: ' + header.join(', ')
      );
    }

    if (map.number === undefined) map.number = 3;
    if (map.sccaMember === undefined) map.sccaMember = 4;

    return map;
  },
};
