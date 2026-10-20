// The form fields: reading them and setting them back to their defaults.
var FIELDS = Array.prototype.slice.call(document.querySelectorAll('.wrap input[id], .wrap select[id]'));
function readInputs() {
  var o = {};
  FIELDS.forEach(function (el) {
    if (el.type === 'checkbox') o[el.id] = el.checked;
    else if (el.type === 'number') { var v = parseFloat(el.value); o[el.id] = isFinite(v) ? v : 0; }
    else o[el.id] = el.value;
  });
  o.years = Math.max(1, Math.min(5, Math.round(+o.years)));
  o.startDate = o.startDate || today();
  return o;
}

function setDefaults() {
  FIELDS.forEach(function (el) {
    if (el.type === 'checkbox') el.checked = el.defaultChecked;
    else if (el.tagName === 'SELECT') Array.prototype.forEach.call(el.options, function (o) { o.selected = o.defaultSelected; });
    else el.value = el.defaultValue;
  });
  $('startDate').value = today();
  $('charging').value = CAR_TYPES[$('carType').value].fuel;
}
