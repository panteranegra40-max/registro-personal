const STORAGE_KEY = "registroPersonalDatosForense";
const PEOPLE_KEY = "registroPersonalListaForense";

const defaultPeople = [
  "CORREA ILLESCA JORGE ALEJANDRO",
  "CHAVEZ SANHUEZA CRISTIAN EDUARDO",
  "OTAROLA MUÑOZ JOHNSON ©",
  "JIMENEZ VALDIVIA JUAN ESTEBAN ©",
  "GONZALEZ BECERRA ERNESTO EDUARDO",
];

const form = document.querySelector("#attendanceForm");
const dateInput = document.querySelector("#dateInput");
const dayInput = document.querySelector("#dayInput");
const gradeInput = document.querySelector("#gradeInput");
const personInput = document.querySelector("#personInput");
const phoneInput = document.querySelector("#phoneInput");
const serviceInput = document.querySelector("#serviceInput");
const startInput = document.querySelector("#startInput");
const endInput = document.querySelector("#endInput");
const hoursInput = document.querySelector("#hoursInput");
const resetButton = document.querySelector("#resetButton");
const exportButton = document.querySelector("#exportButton");
const clearButton = document.querySelector("#clearButton");
const recordsBody = document.querySelector("#recordsBody");
const personSummaryBody = document.querySelector("#personSummaryBody");
const emptyStateWrap = document.querySelector(".table-wrap");
const summaryTableWrap = document.querySelector(".summary-table-wrap");
const totalRecords = document.querySelector("#totalRecords");
const totalHours = document.querySelector("#totalHours");
const lastRecord = document.querySelector("#lastRecord");
const todayDay = document.querySelector("#todayDay");
const todayDate = document.querySelector("#todayDate");
const newPersonInput = document.querySelector("#newPersonInput");
const addPersonButton = document.querySelector("#addPersonButton");
const peopleList = document.querySelector("#peopleList");

let people = loadJSON(PEOPLE_KEY, defaultPeople);
let records = loadJSON(STORAGE_KEY, []);

function loadJSON(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function getDayName(dateValue) {
  if (!dateValue) return "";
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("es-CL", { weekday: "long" }).format(date).replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatDateCL(dateValue) {
  if (!dateValue) return "";
  const [year, month, day] = dateValue.split("-");
  return `${day}-${month}-${year}`;
}

function calculateHours(start, end) {
  if (!start || !end) return "";
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const startMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;
  if (endMinutes < startMinutes) endMinutes += 24 * 60;
  return ((endMinutes - startMinutes) / 60).toFixed(2);
}

function excelText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeRecord(record) {
  const date = record.date || "";
  const start = record.start || "";
  const end = record.end || "";
  return {
    id: record.id || crypto.randomUUID(),
    date,
    day: record.day || getDayName(date),
    grade: record.grade || "",
    person: record.person || "",
    phone: record.phone || "",
    service: record.service || "",
    start,
    end,
    hours: record.hours || calculateHours(start, end),
  };
}

function getRecordsSortedAscending() {
  return records.map(normalizeRecord).sort((a, b) => `${a.date} ${a.start} ${a.person}`.localeCompare(`${b.date} ${b.start} ${b.person}`));
}

function getRecordsSortedDescending() {
  return records.map(normalizeRecord).sort((a, b) => `${b.date} ${b.start} ${b.person}`.localeCompare(`${a.date} ${a.start} ${a.person}`));
}

function getPersonTotals() {
  const totals = new Map();
  records.map(normalizeRecord).forEach((record) => {
    if (!record.person) return;
    const current = totals.get(record.person) || { person: record.person, count: 0, hours: 0 };
    current.count += 1;
    current.hours += Number(record.hours || 0);
    totals.set(record.person, current);
  });
  return [...totals.values()].sort((a, b) => a.person.localeCompare(b.person, "es"));
}

function setInitialDates() {
  const now = new Date();
  const today = toISODate(now);
  dateInput.value = today;
  todayDay.textContent = getDayName(today);
  todayDate.textContent = new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);
  updateCalculatedFields();
}

function updateCalculatedFields() {
  dayInput.value = getDayName(dateInput.value);
  hoursInput.value = calculateHours(startInput.value, endInput.value);
}

function renderPeople() {
  personInput.innerHTML = '<option value="">Seleccionar</option>';
  people.forEach((person) => {
    const option = document.createElement("option");
    option.value = person;
    option.textContent = person;
    personInput.append(option);
  });

  peopleList.innerHTML = "";
  people.forEach((person, index) => {
    const item = document.createElement("li");
    const name = document.createElement("span");
    const button = document.createElement("button");
    name.textContent = person;
    button.type = "button";
    button.textContent = "Quitar";
    button.addEventListener("click", () => {
      people = people.filter((_, personIndex) => personIndex !== index);
      saveJSON(PEOPLE_KEY, people);
      renderPeople();
    });
    item.append(name, button);
    peopleList.append(item);
  });
}

function renderRecords() {
  recordsBody.innerHTML = "";
  const sortedRecords = getRecordsSortedDescending();

  sortedRecords.forEach((record, index) => {
    const row = document.createElement("tr");
    const fields = [
      index + 1,
      formatDateCL(record.date),
      record.day,
      record.grade,
      record.person,
      record.phone,
      record.service,
      record.start,
      record.end,
      record.hours,
    ];

    fields.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value || "";
      row.append(cell);
    });

    const actions = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "row-delete";
    deleteButton.textContent = "Borrar";
    deleteButton.addEventListener("click", () => {
      records = records.filter((item) => item.id !== record.id);
      saveJSON(STORAGE_KEY, records);
      renderAll();
    });
    actions.append(deleteButton);
    row.append(actions);
    recordsBody.append(row);
  });

  emptyStateWrap.classList.toggle("is-empty", records.length === 0);
  totalRecords.textContent = records.length;
  const hours = records.reduce((sum, record) => sum + Number(normalizeRecord(record).hours || 0), 0);
  totalHours.textContent = hours.toFixed(2);
  lastRecord.textContent = sortedRecords[0] ? `${sortedRecords[0].person} - ${formatDateCL(sortedRecords[0].date)}` : "Sin datos";
}

function renderPersonSummary() {
  if (!personSummaryBody || !summaryTableWrap) return;
  const totals = getPersonTotals();
  personSummaryBody.innerHTML = "";
  totals.forEach((item) => {
    const row = document.createElement("tr");
    [item.person, item.count, item.hours.toFixed(2)].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    personSummaryBody.append(row);
  });
  summaryTableWrap.classList.toggle("is-empty", totals.length === 0);
}

function renderAll() {
  renderRecords();
  renderPersonSummary();
}

function resetForm() {
  form.reset();
  dateInput.value = toISODate(new Date());
  gradeInput.value = "SGTO. 2°";
  updateCalculatedFields();
  personInput.focus();
}

function addRecord(event) {
  event.preventDefault();
  updateCalculatedFields();

  const record = {
    id: crypto.randomUUID(),
    date: dateInput.value,
    day: dayInput.value,
    grade: gradeInput.value.trim(),
    person: personInput.value,
    phone: phoneInput.value.trim(),
    service: serviceInput.value,
    start: startInput.value,
    end: endInput.value,
    hours: hoursInput.value,
  };

  records.push(record);
  saveJSON(STORAGE_KEY, records);
  renderAll();
  resetForm();
}

function buildDailyRows() {
  const grouped = new Map();
  getRecordsSortedAscending().forEach((record) => {
    if (!grouped.has(record.date)) grouped.set(record.date, []);
    grouped.get(record.date).push(record);
  });

  if (!grouped.size) {
    return '<tr><td class="center" colspan="8">SIN REGISTROS</td></tr>';
  }

  let html = "";
  grouped.forEach((dailyRecords, date) => {
    html += `
      <tr><th class="day-title" colspan="8">${excelText(getDayName(date).toUpperCase())} ${excelText(formatDateCL(date))}</th></tr>
      <tr>
        <th class="green">N°</th>
        <th class="green">GRADO</th>
        <th class="green">APELLIDOS Y NOMBRE</th>
        <th class="green">FONO</th>
        <th class="yellow">SERVICIO</th>
        <th class="yellow">HORA DE INGRESO</th>
        <th class="yellow">HORA DE SALIDA</th>
        <th class="yellow">HORAS</th>
      </tr>`;

    dailyRecords.forEach((record, index) => {
      html += `
        <tr>
          <td class="center">${index + 1}</td>
          <td class="center">${excelText(record.grade)}</td>
          <td>${excelText(record.person)}</td>
          <td class="center">${excelText(record.phone)}</td>
          <td class="center">${excelText(record.service)}</td>
          <td class="center">${excelText(record.start)}</td>
          <td class="center">${excelText(record.end)}</td>
          <td class="center">${excelText(record.hours)}</td>
        </tr>`;
    });
  });
  return html;
}

function buildPersonTotalsRows() {
  const totals = getPersonTotals();
  if (!totals.length) {
    return '<tr><td class="center" colspan="3">SIN HORAS ACUMULADAS</td></tr>';
  }
  return totals.map((item) => `
    <tr>
      <td>${excelText(item.person)}</td>
      <td class="center">${item.count}</td>
      <td class="center">${item.hours.toFixed(2)}</td>
    </tr>`).join("");
}

function buildExcelTable() {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12pt; }
    td, th { border: 1px solid #000000; padding: 4px 6px; vertical-align: middle; }
    .title { background: #ffff00; color: #ff0000; font-size: 20pt; font-weight: 700; text-align: center; }
    .day-title { background: #d9eaf7; color: #000000; font-size: 13pt; font-weight: 700; text-align: left; }
    .green { background: #00b050; color: #000000; font-size: 12pt; font-weight: 700; text-align: center; }
    .yellow { background: #ffff00; color: #000000; font-size: 12pt; font-weight: 700; text-align: center; }
    .center { text-align: center; }
    .spacer td { border: 0; height: 12px; }
  </style>
</head>
<body>
  <table>
    <colgroup>
      <col style="width:55px" />
      <col style="width:115px" />
      <col style="width:410px" />
      <col style="width:110px" />
      <col style="width:90px" />
      <col style="width:155px" />
      <col style="width:150px" />
      <col style="width:85px" />
    </colgroup>
    <tr><th class="title" colspan="8">ANALISIS E INTELIGENCIA CRIMINAL</th></tr>
    ${buildDailyRows()}
    <tr class="spacer"><td colspan="8"></td></tr>
    <tr><th class="title" colspan="3">HORAS ACUMULADAS POR PERSONAL</th></tr>
    <tr>
      <th class="green">APELLIDOS Y NOMBRE</th>
      <th class="green">REGISTROS</th>
      <th class="green">HORAS</th>
    </tr>
    ${buildPersonTotalsRows()}
  </table>
</body>
</html>`;
}

function exportExcel() {
  const html = buildExcelTable();
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `analisis_inteligencia_criminal_${toISODate(new Date())}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

function clearRecords() {
  if (!records.length) return;
  const confirmed = confirm("Esto borrara todos los registros guardados en este navegador. ¿Continuar?");
  if (!confirmed) return;
  records = [];
  saveJSON(STORAGE_KEY, records);
  renderAll();
}

function addPerson() {
  const person = newPersonInput.value.trim().toUpperCase();
  if (!person) return;
  if (!people.includes(person)) {
    people.push(person);
    people.sort((a, b) => a.localeCompare(b, "es"));
    saveJSON(PEOPLE_KEY, people);
    renderPeople();
  }
  newPersonInput.value = "";
  personInput.value = person;
}

dateInput.addEventListener("input", updateCalculatedFields);
startInput.addEventListener("input", updateCalculatedFields);
endInput.addEventListener("input", updateCalculatedFields);
form.addEventListener("submit", addRecord);
resetButton.addEventListener("click", resetForm);
exportButton.addEventListener("click", exportExcel);
clearButton.addEventListener("click", clearRecords);
addPersonButton.addEventListener("click", addPerson);
newPersonInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addPerson();
  }
});

renderPeople();
setInitialDates();
gradeInput.value = "SGTO. 2°";
renderAll();
