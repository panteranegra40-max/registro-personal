import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "outputs/registro_personal";
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const registro = workbook.worksheets.add("Registro");
const config = workbook.worksheets.add("Configuracion");

registro.showGridLines = false;
config.showGridLines = false;

const headers = [
  "Fecha",
  "Dia",
  "Personal",
  "Cargo / Area",
  "Hora entrada",
  "Hora salida",
  "Horas trabajadas",
  "Observaciones",
];

registro.getRange("A1:H1").merge();
registro.getRange("A1").values = [["Registro de personal"]];
registro.getRange("A1").format = {
  fill: "#1F4E79",
  font: { bold: true, color: "#FFFFFF", size: 18 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
registro.getRange("A1:H1").format.rowHeightPx = 38;

registro.getRange("A2:H2").merge();
registro.getRange("A2").values = [["Completa fecha, personal y horarios. El dia y las horas trabajadas se calculan automaticamente."]];
registro.getRange("A2").format = {
  fill: "#EAF2F8",
  font: { color: "#1F2937", italic: true },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
registro.getRange("A2:H2").format.rowHeightPx = 28;

registro.getRange("A4:H4").values = [headers];
registro.getRange("A4:H4").format = {
  fill: "#2E75B6",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
registro.getRange("A4:H4").format.rowHeightPx = 34;

const blankRows = Array.from({ length: 100 }, () => [null, null, null, null, null, null, null, null]);
registro.getRange("A5:H104").values = blankRows;

registro.getRange("B5").formulas = [[
  '=IF(A5="","",CHOOSE(WEEKDAY(A5,2),"Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo"))',
]];
registro.getRange("B5:B104").fillDown();
registro.getRange("G5").formulas = [['=IF(OR(E5="",F5=""),"",IF(F5>=E5,(F5-E5)*24,(F5+1-E5)*24))']];
registro.getRange("G5:G104").fillDown();

registro.getRange("A5:A104").format.numberFormat = "yyyy-mm-dd";
registro.getRange("E5:F104").format.numberFormat = "hh:mm";
registro.getRange("G5:G104").format.numberFormat = "0.00";

registro.getRange("A4:H104").format = {
  borders: {
    insideHorizontal: { style: "continuous", color: "#D9E2EC" },
    insideVertical: { style: "continuous", color: "#D9E2EC" },
    edgeBottom: { style: "continuous", color: "#95A5A6" },
    edgeTop: { style: "continuous", color: "#95A5A6" },
    edgeLeft: { style: "continuous", color: "#95A5A6" },
    edgeRight: { style: "continuous", color: "#95A5A6" },
  },
  verticalAlignment: "center",
};
registro.getRange("A5:H104").format = {
  fill: "#FFFFFF",
  font: { color: "#111827" },
};
registro.getRange("A5:H104").conditionalFormats.add("expression", {
  formula: "=MOD(ROW(),2)=0",
  format: { fill: "#F8FBFD" },
});

registro.getRange("A4:H104").format.autofitColumns();
registro.getRange("A:A").format.columnWidthPx = 112;
registro.getRange("B:B").format.columnWidthPx = 100;
registro.getRange("C:C").format.columnWidthPx = 170;
registro.getRange("D:D").format.columnWidthPx = 145;
registro.getRange("E:F").format.columnWidthPx = 96;
registro.getRange("G:G").format.columnWidthPx = 112;
registro.getRange("H:H").format.columnWidthPx = 220;
registro.getRange("A5:H104").format.rowHeightPx = 25;
registro.freezePanes.freezeRows(4);

const fechas = [];
const startDate = new Date(Date.UTC(2026, 0, 1));
for (let i = 0; i < 730; i += 1) {
  const d = new Date(startDate);
  d.setUTCDate(startDate.getUTCDate() + i);
  fechas.push([d]);
}

config.getRange("A1").values = [["Personal"]];
config.getRange("B1").values = [["Fechas"]];
config.getRange("C1").values = [["Dias"]];
config.getRange("A1:C1").format = {
  fill: "#1F4E79",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
};
config.getRange("A2:A21").values = Array.from({ length: 20 }, (_, i) => [`Empleado ${i + 1}`]);
config.getRange("B2:B731").values = fechas;
config.getRange("B2:B731").format.numberFormat = "yyyy-mm-dd";
config.getRange("C2").formulas = [[
  '=CHOOSE(WEEKDAY(B2,2),"Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo")',
]];
config.getRange("C2:C731").fillDown();
config.getRange("A:C").format.autofitColumns();
config.getRange("A:A").format.columnWidthPx = 150;
config.getRange("B:B").format.columnWidthPx = 115;
config.getRange("C:C").format.columnWidthPx = 105;
config.freezePanes.freezeRows(1);

registro.getRange("A5:A104").dataValidation = {
  rule: { type: "list", formula1: "Configuracion!$B$2:$B$731" },
};
registro.getRange("C5:C104").dataValidation = {
  rule: { type: "list", formula1: "Configuracion!$A$2:$A$21" },
};
registro.getRange("E5:F104").dataValidation = {
  rule: { type: "time", operator: "between", formula1: "00:00", formula2: "23:59" },
};

const table = registro.tables.add("A4:H104", true, "TablaRegistroPersonal");
table.style = "TableStyleMedium2";
table.showFilterButton = true;

const configTable = config.tables.add("A1:C731", true, "TablaConfiguracion");
configTable.style = "TableStyleLight9";
configTable.showFilterButton = true;

const inspect = await workbook.inspect({
  kind: "table",
  range: "Registro!A1:H12",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 8,
});
console.log(inspect.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: "Registro",
  range: "A1:H18",
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}/registro_preview.png`, new Uint8Array(await preview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(`${outputDir}/registro_personal.xlsx`);
