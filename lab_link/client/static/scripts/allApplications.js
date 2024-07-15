import { getApplications } from "./fetch.js";
import { Loading, createElem } from "./script.js";
import { downloadAsExcel__HTMLTable } from "./excel.js";

const tbody = document.querySelector(".apps-table-body");
const loading = new Loading(document.querySelector(".preloader"));
const downloadExcelButton = document.querySelector(".download-excel-button");

var appsData = null;

// Fetch and populate applications data
async function getApps(uncached = false) {
	try {
		loading.setLoading(true);
		appsData = await getApplications(false, uncached);
		populateAllAppsTable(appsData);
	} catch (error) {
		console.error("Failed to fetch applications:", error);
	} finally {
		loading.setLoading(false);
	}
}

// Populate table for all apps
function populateAllAppsTable(data) {
	const colspan = packageNames.length * 2;
	const fragment = document.createDocumentFragment();
	for (const host in data) {
		const row = createElem("tr");
		row.appendChild(createElem("td", host));
		if (data[host] === "unreachable") {
			row.appendChild(createElem("td", "Unreachable", { colspan }));
		} else {
			packageNames.forEach((item) => {
				row.appendChild(createElem("td", data[host][item]["installed"] ? "Yes" : "No"));
				row.appendChild(createElem("td", data[host][item]["version_short"]));
			});
		}
		fragment.appendChild(row);
	}
	tbody.innerHTML = "";
	tbody.appendChild(fragment);
}

document.addEventListener("DOMContentLoaded", () => {
	if (downloadExcelButton) {
		downloadExcelButton.addEventListener("click", () => {
			if (appsData) {
				const tableElem = document.querySelector(".apps-table");
				const fileName = `Lab Link Applications Report - ${new Date().toISOString()}`;
				downloadAsExcel__HTMLTable(tableElem, fileName);
			}
		});
	}
});

// Initial call to fetch and display applications
getApps();

