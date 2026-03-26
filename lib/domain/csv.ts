// lib/domain/csv.ts
const normalizeLineEndings = (input: string) => {
  return input
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
};

const pushField = (row: string[], field: string) => {
  row.push(field);
};

const pushRow = (rows: string[][], row: string[], field: string) => {
  pushField(row, field);
  rows.push(row);
};

export const parseCsv = (input: string) => {
  const source = normalizeLineEndings(input);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (insideQuotes) {
      if (character === '"') {
        if (nextCharacter === '"') {
          currentField += '"';
          index += 1;
          continue;
        }

        insideQuotes = false;
        continue;
      }

      currentField += character;
      continue;
    }

    if (character === '"') {
      insideQuotes = true;
      continue;
    }

    if (character === ",") {
      pushField(currentRow, currentField);
      currentField = "";
      continue;
    }

    if (character === "\n") {
      pushRow(rows, currentRow, currentField);
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += character;
  }

  if (insideQuotes) {
    throw new Error("CSV_PARSE_FAILED");
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    pushRow(rows, currentRow, currentField);
  }

  return rows;
};

export const toDataTable = (rows: string[][]) => {
  const [headerRow = [], ...bodyRows] = rows;
  const maxColumnCount = Math.max(
    headerRow.length,
    ...bodyRows.map((row) => row.length),
    0,
  );

  if (maxColumnCount === 0) {
    throw new Error("CSV_EMPTY");
  }

  const columns = Array.from({ length: maxColumnCount }, (_, index) => {
    return headerRow[index]?.trim() || `column_${index + 1}`;
  });

  const normalizedRows = bodyRows
    .map((row) => columns.map((_, index) => row[index] ?? ""))
    .filter((row) => row.some((cell) => cell.trim().length > 0));

  return {
    columns,
    rows: normalizedRows,
  };
};
