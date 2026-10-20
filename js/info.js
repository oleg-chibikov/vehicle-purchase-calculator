// The "i" icons, their tooltips and the table "Sources for every number".
// Where a SOURCES entry comes from: its links and the check date, or why it has none.
function sourceLinks(s) {
  return s.links
    ? s.links.map(function (l) { return '<a href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + esc(l[0]) + '</a>'; }).join('<br>') + '<br><small class="lbl">Checked on ' + RULES_CHECKED + '</small>'
    : '<span class="assume">' + esc(s.note || 'Assumption, no source. Change the input to your own number.') + '</span>';
}

// The i icon. Its tooltip shows the formula when given, then names each source, the value used, and links to the page it came from.
function info(keys, formula) {
  keys = [].concat(keys);
  var body = (formula ? [esc(formula)] : []).concat(keys.map(function (k) {
    var s = SOURCES[k];
    if (!s) throw new Error('SOURCES.' + k + ' must exist');
    return '<b>' + esc(s.name) + '</b><br>' + esc(s.value) + '<br>' + sourceLinks(s);
  })).join('<hr>');
  var names = keys.map(function (k) { return SOURCES[k].name; }).join(', ');
  return '<span class="i" tabindex="0" role="button" aria-label="Source: ' + esc(names) + '">i<span class="tip" role="tooltip">' + body + '</span></span>';
}

// Tooltips use fixed positioning so tables and formula boxes with scrollbars do not clip them.
function placeTip(icon) {
  var tip = icon.querySelector('.tip');
  if (!tip) return;
  var r = icon.getBoundingClientRect(), w = Math.min(340, window.innerWidth - 16);
  tip.style.width = w + 'px';
  tip.style.left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8) + 'px';
  var below = r.bottom + 2;
  tip.style.top = below + 'px';
  var h = tip.offsetHeight;
  if (h && below + h > window.innerHeight - 8 && r.top - h - 2 > 8) tip.style.top = (r.top - h - 2) + 'px';
}
['mouseover', 'focusin'].forEach(function (ev) {
  document.addEventListener(ev, function (e) {
    var icon = e.target.closest && e.target.closest('.i');
    if (icon) placeTip(icon);
  });
});
// A click on an icon inside a label or a summary opens the tooltip. The input and the fold stay as they are.
document.addEventListener('click', function (e) {
  var icon = e.target.closest && e.target.closest('.i');
  if (icon && !e.target.closest('a')) { e.preventDefault(); icon.focus(); placeTip(icon); }
});

function fillStaticSources() {
  SOURCES.assumeRates.value = 'Lease ' + $('leaseRate').defaultValue + '%, loan ' + $('loanRate').defaultValue + '%, account ' + $('accountRate').defaultValue + '% are examples. Use the rates on your own quote and account';
  Array.prototype.forEach.call(document.querySelectorAll('[data-src]'), function (el) {
    el.outerHTML = info(el.getAttribute('data-src').split(','));
  });
  $('sources').innerHTML = Object.keys(SOURCES).map(function (k) {
    var s = SOURCES[k];
    return '<tr><td>' + esc(s.name) + '</td><td>' + esc(s.value) + '</td><td>' + sourceLinks(s) + '</td></tr>';
  }).join('');
}
