import * as XLSX from "https://unpkg.com/xlsx/xlsx.mjs";

export function downloadAsExcel__HTMLTable(tableElem, filename = "lab_link_excel_sheet") {
	try {
		const workbook = XLSX.utils.table_to_book(tableElem, { raw: true });
		const worksheet = workbook.Sheets["Sheet1"];
		XLSX.utils.sheet_add_aoa(worksheet, [[`Created ${new Date().toISOString()}`]], { origin: -1 });
		XLSX.writeFile(workbook, filename + ".xlsx");
	} catch (err) {
		console.error(err);
		modalAlert("Something went wrong while trying to download the Excel.");
	}
}

