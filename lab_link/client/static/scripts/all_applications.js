import { getApplications } from "./fetch.js";
import { Loading, createElem } from "./script.js";
import { downloadAsExcel__HTMLTable } from "./excel.js";

const tbody = document.querySelector(".apps-table-body");
const loading = new Loading(document.querySelector(".preloader"));
const goUpButton = document.querySelector(".go-up");
const goDownButton = document.querySelector(".go-down");
const downloadExcelButton = document.querySelector(".download-excel-button");

var appsData = null;

// Fetch and populate applications data
async function getApps() {
	try {
		loading.setLoading(true);
		const data = await getApplications();
		appsData = data;
		populateAllAppsTable(data);
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
	// Attach scroll buttons event listeners
	if (goUpButton) {
		goUpButton.addEventListener("click", () => {
			window.scrollTo({ top: 0, behavior: "smooth" });
		});
	}

	if (goDownButton) {
		goDownButton.addEventListener("click", () => {
			window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
		});
	}

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

