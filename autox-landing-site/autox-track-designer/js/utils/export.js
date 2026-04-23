// Export utility functions for AutoX Track Designer

const ExportUtils = {
    // Export map as PNG image — opens a new tab with a letter-landscape page,
    // auto-fits the track, captures it as PNG, and triggers download.
    exportToPNG: async function(mapElementId, courseName) {
        const original = document.getElementById(mapElementId);
        if (!original) {
            throw new Error('Map element not found');
        }

        const svgClone = original.cloneNode(true);
        svgClone.removeAttribute('style');
        svgClone.removeAttribute('width');
        svgClone.removeAttribute('height');
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        svgClone.querySelectorAll('image').forEach(el => el.remove());
        ['#racechrono-overlay-layer', '#rotation-handles-layer'].forEach(sel => {
            const el = svgClone.querySelector(sel);
            if (el) el.remove();
        });
        svgClone.querySelectorAll('foreignObject').forEach(el => el.remove());

        ['track-surface', 'cones-layer', 'markers-layer'].forEach(id => {
            const el = svgClone.querySelector('#' + id);
            if (el) el.style.opacity = '1';
        });

        const svgHtml = svgClone.outerHTML;
        const safeName = escapeHtml(courseName || '');
        const filename = `${(courseName || 'track').replace(/[^a-z0-9]/gi, '-').toLowerCase()}-track.png`;

        const html = buildExportHtml(safeName, svgHtml, filename);

        const w = window.open('', '_blank');
        if (!w) {
            throw new Error('Popup blocked. Please allow popups for this site to export PNG.');
        }
        w.document.open();
        w.document.write(html);
        w.document.close();

        return true;
    },

    // Export map as SVG file
    exportToSVG: function(mapElementId, courseName) {
        const svgEl = document.getElementById(mapElementId);
        if (!svgEl) {
            throw new Error('Map element not found');
        }

        const clone = svgEl.cloneNode(true);
        clone.removeAttribute('style');
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('width', '1920');
        clone.setAttribute('height', '1080');

        const svgData = '<?xml version="1.0" encoding="UTF-8"?>\n' + clone.outerHTML;
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `${courseName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-track.svg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

function escapeHtml(s) {
    return String(s).replace(/[<>&"']/g, c => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function escapeJsString(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

// Build a self-contained HTML document for the new export tab. The page is
// sized to letter-landscape (1100×850 logical, 2× pixelRatio → 2200×1700 PNG).
function buildExportHtml(safeName, svgHtml, filename) {
    const titleHtml = safeName ? `<h1 class="title">${safeName}</h1>` : '';
    const escFilename = escapeJsString(filename);
    const docTitle = safeName ? `${safeName} — Track Map` : 'Track Map';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${docTitle}</title>
<style>
  html, body { margin: 0; padding: 0; background: #e8e8ec; font-family: sans-serif; }
  body { padding: 24px 0; min-height: 100vh; box-sizing: border-box; }
  .page {
    width: 1100px; height: 850px;
    background: #fff; margin: 0 auto;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    display: flex; flex-direction: column;
    padding: 24px 32px; box-sizing: border-box;
  }
  .title {
    font: 600 30px/1.2 sans-serif;
    color: #000; text-align: center;
    margin: 0 0 14px 0;
  }
  .map-container {
    flex: 1; min-height: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .map-container svg { width: 100%; height: 100%; display: block; }
  .status {
    position: fixed; top: 12px; right: 12px;
    background: rgba(0,0,0,0.75); color: #fff;
    padding: 8px 14px; font: 12px sans-serif;
    border-radius: 4px; z-index: 9999;
    transition: opacity 0.4s ease;
  }
</style>
<script src="https://unpkg.com/html-to-image@1.11.11/dist/html-to-image.js"></script>
</head>
<body>
<div class="page" id="exportPage">
  ${titleHtml}
  <div class="map-container">${svgHtml}</div>
</div>
<div class="status" id="status">Generating PNG…</div>
<script>
(function () {
  function onReady() {
    requestAnimationFrame(function () {
      var svg = document.querySelector('#exportPage svg');
      try {
        var bb = svg.getBBox();
        if (bb && bb.width > 0 && bb.height > 0) {
          var pad = 4;
          svg.setAttribute('viewBox',
            (bb.x - pad) + ' ' + (bb.y - pad) + ' ' +
            (bb.width + pad * 2) + ' ' + (bb.height + pad * 2));
        }
      } catch (e) { /* ignore; keep existing viewBox */ }

      requestAnimationFrame(function () {
        if (typeof htmlToImage === 'undefined') {
          setStatus('Failed to load html-to-image library');
          return;
        }
        htmlToImage.toPng(document.getElementById('exportPage'), {
          quality: 1.0,
          backgroundColor: '#ffffff',
          pixelRatio: 2
        }).then(function (dataUrl) {
          var link = document.createElement('a');
          link.download = '${escFilename}';
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setStatus('PNG downloaded \u2713');
          setTimeout(function () {
            var s = document.getElementById('status');
            if (s) s.style.opacity = '0';
          }, 1500);
        }).catch(function (err) {
          setStatus('Export failed: ' + (err && err.message ? err.message : err));
          console.error(err);
        });
      });
    });
  }

  function setStatus(msg) {
    var s = document.getElementById('status');
    if (s) s.textContent = msg;
  }

  if (document.readyState === 'complete') {
    onReady();
  } else {
    window.addEventListener('load', onReady);
  }
})();
</script>
</body>
</html>`;
}

// Make available globally
window.ExportUtils = ExportUtils;
