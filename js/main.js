// Wires the page together. Loaded last.
// Picking a car type or a term fills in its default fuel cost or the ATO minimum balloon.
function onInput(e) {
  if (FIELDS.indexOf(e.target) < 0) return;
  var changed = [e.target.id];
  if (e.target.id === 'carType') { $('charging').value = CAR_TYPES[e.target.value].fuel; changed.push('charging'); }
  if (e.target.id === 'years') { $('balloonPct').value = RESIDUAL[parseInt(e.target.value, 10)]; changed.push('balloonPct'); }
  save(changed);
  render();
}

$('reset').addEventListener('click', function () {
  saved = {};
  try { localStorage.removeItem(STORE_KEY); } catch (e) { /* Storage is off. The page has no saved values to clear. */ }
  setDefaults();
  render();
});

document.addEventListener('input', onInput);
document.addEventListener('change', onInput);
setDefaults();
restoreSaved();
fillStaticSources();
render();
