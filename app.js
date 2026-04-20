const fileInput = document.getElementById('file-input');
const dropZone  = document.getElementById('drop-zone');
const errorMsg  = document.getElementById('error-msg');

function showError(msg) {
  errorMsg.textContent = msg;
}

/**
 * Parses mammoth.js HTML into structured teleprompter data.
 * Returns { rows: Array }
 *   Section row:  { type: 'section', html: string }
 *   Content row:  { type: 'content', sceneNumber: string, bildebene: string,
 *                   tonebene: string, bemerkung: string }
 * Throws Error if structure is unexpected.
 */
function parseDocxHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) { throw new Error('Kein Table im Dokument gefunden.'); }

  const allRows = Array.from(table.rows);
  if (allRows.length < 2) { throw new Error('Tabelle hat zu wenig Zeilen.'); }

  // Validate header row
  const headerCells = Array.from(allRows[0].querySelectorAll('td, th'));
  const headerTexts = headerCells.map(function(c) { return c.textContent.trim().toLowerCase(); });
  const hasExpectedHeaders = (
    headerTexts.some(function(t) { return t.includes('#'); }) &&
    headerTexts.some(function(t) { return t.includes('bildebene'); }) &&
    headerTexts.some(function(t) { return t.includes('tonebene'); })
  );
  if (!hasExpectedHeaders) {
    throw new Error(
      'Unerwartetes Tabellenformat. Erwartet: # | Bildebene | Tonebene | Bemerkung. ' +
      'Gefunden: ' + headerTexts.join(' | ')
    );
  }

  const rows = [];
  for (let i = 1; i < allRows.length; i++) {
    const cells = Array.from(allRows[i].querySelectorAll('td, th'));
    if (cells.length === 0) { continue; }

    const firstCell = cells[0];
    const colspan = parseInt(firstCell.getAttribute('colspan') || '1', 10);

    // Section header: cell spans 3+ columns or row has only 1 cell
    if (colspan >= 3 || cells.length === 1) {
      rows.push({ type: 'section', html: firstCell.innerHTML });
      continue;
    }

    // Content row: 4 cells
    if (cells.length >= 4) {
      rows.push({
        type: 'content',
        sceneNumber: cells[0].innerHTML,
        bildebene:   cells[1].innerHTML,
        tonebene:    cells[2].innerHTML,
        bemerkung:   cells[3].innerHTML
      });
    } else {
      console.warn('parseDocxHtml: skipping row with unexpected cell count:', cells.length, 'at row index', i);
    }
  }

  if (rows.length === 0) { throw new Error('Keine Tabellenzeilen gefunden.'); }
  return { rows: rows };
}

/** Wraps [bracketed text] in an orange-coloured span. */
function wrapBrackets(html) {
  return html.replace(/\[([^\]]*)\]/g, '<span class="bracket-text">[$1]</span>');
}

/**
 * Builds sanitized HTML for the teleprompter table.
 * All cell content from mammoth is sanitized with DOMPurify before DOM insertion.
 */
function renderTeleprompter(data) {
  const tbodyRows = data.rows.map(function(row) {
    if (row.type === 'section') {
      const sectionHtml = DOMPurify.sanitize(row.html);
      const tr = document.createElement('tr');
      tr.className = 'section-row';
      const td = document.createElement('td');
      td.setAttribute('colspan', '4');
      td.innerHTML = sectionHtml;
      tr.appendChild(td);
      return tr.outerHTML;
    }
    const numHtml  = DOMPurify.sanitize(wrapBrackets(row.sceneNumber));
    const bildHtml = DOMPurify.sanitize(wrapBrackets(row.bildebene));
    const tonHtml  = DOMPurify.sanitize(wrapBrackets(row.tonebene));
    const bemHtml  = DOMPurify.sanitize(wrapBrackets(row.bemerkung));
    return (
      '<tr>' +
        '<td class="col-num">'       + numHtml  + '</td>' +
        '<td class="col-bildebene">' + bildHtml + '</td>' +
        '<td class="col-tonebene">'  + tonHtml  + '</td>' +
        '<td class="col-bemerkung">' + bemHtml  + '</td>' +
      '</tr>'
    );
  }).join('');

  return (
    '<table class="teleprompter">' +
      '<thead><tr>' +
        '<th class="col-num">#</th>' +
        '<th class="col-bildebene">Bildebene</th>' +
        '<th class="col-tonebene">Tonebene</th>' +
        '<th class="col-bemerkung">Bemerkung</th>' +
      '</tr></thead>' +
      '<tbody>' + tbodyRows + '</tbody>' +
    '</table>'
  );
}

function readDocx(file) {
  if (!file || !file.name.toLowerCase().endsWith('.docx')) {
    showError('Bitte eine .docx-Datei auswählen.');
    return;
  }
  showError('');
  const reader = new FileReader();
  reader.onload = function(e) {
    mammoth.convertToHtml({ arrayBuffer: e.target.result })
      .then(function(result) {
        var data;
        try {
          data = parseDocxHtml(result.value);
        } catch (parseErr) {
          // Readable .docx but wrong structure — show error on teleprompter screen
          const errNode = document.createElement('div');
          errNode.style.cssText = 'padding:3rem;color:#ff6b6b;';
          const heading = document.createElement('p');
          heading.style.cssText = 'font-size:1.2rem;margin-bottom:1rem;';
          heading.textContent = '\u26A0 Dateistruktur nicht erkannt';
          const detail = document.createElement('p');
          detail.textContent = parseErr.message;
          const backWrap = document.createElement('p');
          backWrap.style.marginTop = '1.5rem';
          const backLink = document.createElement('button');
          backLink.textContent = '\u2190 Andere Datei w\u00e4hlen';
          backLink.style.cssText = 'background:transparent;border:1px solid #555;color:#aaa;' +
            'padding:0.4rem 0.8rem;border-radius:6px;cursor:pointer;';
          backLink.addEventListener('click', function() {
            document.getElementById('back-btn').click();
          });
          backWrap.appendChild(backLink);
          errNode.appendChild(heading);
          errNode.appendChild(detail);
          errNode.appendChild(backWrap);
          document.getElementById('table-container').innerHTML = '';
          document.getElementById('table-container').appendChild(errNode);
          document.getElementById('upload-screen').style.display = 'none';
          document.getElementById('teleprompter-screen').style.display = 'block';
          console.error('parse error:', parseErr);
          return;
        }
        const tableHtml = renderTeleprompter(data);
        const container = document.getElementById('table-container');
        container.innerHTML = DOMPurify.sanitize(tableHtml);
        document.getElementById('upload-screen').style.display = 'none';
        document.getElementById('teleprompter-screen').style.display = 'block';
      })
      .catch(function(err) {
        showError('Datei konnte nicht gelesen werden. Bitte eine gültige .docx-Datei auswählen.');
        console.error('mammoth error:', err);
      });
  };
  reader.onerror = function() {
    showError('Fehler beim Lesen der Datei.');
  };
  reader.readAsArrayBuffer(file);
}

fileInput.addEventListener('change', function(e) {
  readDocx(e.target.files[0]);
  fileInput.value = '';
});

dropZone.addEventListener('dragover', function(e) {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', function(e) {
  if (!dropZone.contains(e.relatedTarget)) {
    dropZone.classList.remove('drag-over');
  }
});
dropZone.addEventListener('drop', function(e) {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  readDocx(e.dataTransfer.files[0]);
});

dropZone.addEventListener('click', function(e) {
  if (e.target !== document.getElementById('choose-label') && e.target !== fileInput) {
    fileInput.click();
  }
});

document.getElementById('toggle-btn').addEventListener('click', function() {
  const table = document.querySelector('table.teleprompter');
  if (!table) { return; }
  table.classList.toggle('columns-visible');
  this.classList.toggle('active');
});

document.getElementById('back-btn').addEventListener('click', function() {
  const tbl = document.querySelector('table.teleprompter');
  if (tbl) { tbl.classList.remove('columns-visible'); }
  document.getElementById('teleprompter-screen').style.display = 'none';
  document.getElementById('table-container').innerHTML = '';
  document.getElementById('upload-screen').style.display = 'flex';
  document.getElementById('error-msg').textContent = '';
  document.getElementById('file-input').value = '';
  document.getElementById('toggle-btn').classList.remove('active');
  dropZone.classList.remove('drag-over');
  window.scrollTo(0, 0);
});
