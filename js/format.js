// Formatting helpers: money, percent, dates, HTML escaping and element lookup.
// Loaded first, because the rules and sources build their text with these.
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function $(id) { return document.getElementById(id); }
function usd(x, cents) {
  var d = cents ? 2 : 0;
  var s = Math.abs(x).toLocaleString('en-AU', { minimumFractionDigits: d, maximumFractionDigits: d });
  return (x < -0.5 ? '-$' : '$') + s;
}
function pct(x) { return (Math.round(x * 10000) / 100) + '%'; }
function longDate(iso) { var p = iso.split('-'); return +p[2] + ' ' + MONTHS[p[1] - 1] + ' ' + p[0]; }
function dayBefore(iso) { var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); }
function today() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}


function esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
