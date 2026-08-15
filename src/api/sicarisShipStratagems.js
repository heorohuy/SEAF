const SHEET_ID = "1a0TOlJ2p6ViOglDPnADO41zlM08GyKIcVcS1W4wUfTc";
const SHEET_NAME = "Streamer Stratagems";

export async function getSheetData() {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq` +
    `?sheet=${encodeURIComponent(SHEET_NAME)}` +
    `&tqx=out:json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch Google Sheet");
  }

  const text = await response.text();

  // Google returns JSON wrapped in a function call.
  const json = JSON.parse(
    text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1)
  );

  const rows = json.table.rows;

  return rows.map((row) => row.c.map((cell) => cell?.v ?? null));
}