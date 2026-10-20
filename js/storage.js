// localStorage keeps only the fields the person changed. An untouched start date stays today on the next visit.
var STORE_KEY = 'vehicle-purchase-calculator.inputs';
var saved = loadSaved();
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
}
function writeSaved() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch (e) { /* Storage is off. The values last until the page closes. */ }
}
function save(ids) {
  ids.forEach(function (id) { var el = $(id); saved[id] = el.type === 'checkbox' ? el.checked : el.value; });
  writeSaved();
}
function restoreSaved() {
  FIELDS.forEach(function (el) {
    if (!(el.id in saved)) return;
    var v = saved[el.id];
    if (el.type === 'checkbox') el.checked = v === true;
    else if (el.tagName !== 'SELECT' || Array.prototype.some.call(el.options, function (o) { return o.value === v; })) el.value = v;
  });
}
