import { getApplications, uninstallPackages, installPackages } from "./fetch.js";
import { Loading, createElem, FuzzySearch } from "./script.js";
import { downloadAsExcel__HTMLTable } from "./excel.js";
import { InstallModal } from "./installModal.js";

const loading = new Loading(document.querySelector(".preloader"));
let fuzzy = new FuzzySearch([], { key: "name", all: true });

const tbody = document.querySelector(".apps-table-body");
const searchInput = document.getElementById("search");
const selectAllButton = document.querySelector(".select-all-button");
const searchCancel = document.querySelector(".search-cancel");
const countDisplay = document.querySelector(".count");
const removeButton = document.querySelector(".remove-button");
const downloadExcelButton = document.querySelector(".download-excel-button");
const uncacheAndRefresh = document.querySelector(".refresh-button");
const installButton = document.querySelector(".install-app-host");

let lastChecked = 0;
let allState = true;
let appData = null;

// Fetch and populate applications data
async function getApps(uncached = false) {
	try {
		loading.setLoading(true);
		tbody.innerHTML = "";
		toggleOptions(false);
		const data = await getApplications(hostId, uncached);
		populateHostAppsTable(data);
		toggleOptions(true);
		fuzzy.list = data;
		appData = data;
	} catch (error) {
		console.error("Failed to fetch applications:", error);
	} finally {
		loading.setLoading(false);
	}
}

function toggleOptions(show = true) {
	[selectAllButton, downloadExcelButton, uncacheAndRefresh, installButton, removeButton].forEach((button) => {
		if (!show) {
			button.classList.add("disabled");
		} else {
			button.classList.remove("disabled");
		}
	});
}

// Populate table for host apps
function populateHostAppsTable(data) {
	const fragment = document.createDocumentFragment();
	data.forEach((item, index) => {
		const row = createElem("tr", "", { class: `check-row-${index} check-row visible`, "data-index": index });

		const checkBoxCell = createElem("td", "", { id: `item-${index}` });
		checkBoxCell.innerHTML = `
		<label>
			<input type="checkbox" class="checkbox-${index} checkbox" />
			<span></span>
		</label>
		`;
		row.appendChild(checkBoxCell);

		row.appendChild(createElem("td", item.name));
		row.appendChild(createElem("td", item.version));
		row.appendChild(createElem("td", item.size));
		fragment.appendChild(row);
	});
	tbody.innerHTML = ""; // Clear tbody before appending new content
	tbody.appendChild(fragment);
}

// Event delegation for checkbox row click
tbody.addEventListener("click", (e) => {
	if (e.target.closest(".check-row")) {
		const row = e.target.closest(".check-row");
		const index = Array.from(tbody.children).indexOf(row);
		checkBoxRowEventHandler(e, index);
	}
});

// Event handler for checkbox row click
function checkBoxRowEventHandler(e, index) {
	if (e.shiftKey) {
		let start = Math.min(lastChecked, index);
		let end = Math.max(lastChecked, index);
		for (let i = start; i <= end; i++) {
			check(i, true);
		}
	} else {
		check(index);
		lastChecked = index;
	}
}

function getSelected() {
	const elems = document.querySelectorAll(".checked");
	const indices = [];
	elems.forEach((elem) => {
		if (elem?.dataset?.index) {
			indices.push(elem.dataset.index);
		}
	});
	return indices;
}

// Toggle checkbox state and update count
function check(index, check = "toggle") {
	const checkbox = document.querySelector(`.checkbox-${index}`);
	const checkboxRow = document.querySelector(`.check-row-${index}`);
	if (!checkbox || !checkboxRow) return;

	checkbox.checked = check === "toggle" ? !checkbox.checked : check;
	checkbox.checked ? checkboxRow.classList.add("checked") : checkboxRow.classList.remove("checked");

	updateCheckedCount();
}

// Update the count of checked checkboxes
function updateCheckedCount() {
	const count = document.querySelectorAll(".checkbox:checked").length;
	countDisplay.textContent = count;
}

// Handle fuzzy search input
function fuzzySearch(e) {
	const searchText = e.target.value;
	const indices = fuzzy.indices(searchText);
	rerenderHostTable(indices);
}

// Re-render host table based on fuzzy search results
function rerenderHostTable(indices) {
	const rows = document.querySelectorAll(".check-row");
	rows.forEach((row, index) => {
		if (!indices.includes(index)) {
			row.classList.add("hide");
			row.classList.remove("visible");
		} else {
			row.classList.add("visible");
			row.classList.remove("hide");
		}
	});
}

function toggleAll() {
	document.querySelectorAll(".visible").forEach((item, index) => {
		check(index, allState);
	});
	allState = !allState;
}

async function installAppsFromList(list) {
	const htmlPromise = new Promise(async (resolve) => {
		const response = await installPackages(hostId, list);
		const html = getAppStatus(response);
		resolve(html);
	});
	modalAwaitAlert(htmlPromise, () => getApps(true), true);
}

async function uninstallAppsFromList(list) {
	const htmlPromise = new Promise(async (resolve) => {
		const response = await uninstallPackages(hostId, list);
		const html = getAppStatus(response, false);
		resolve(html);
	});
	modalAwaitAlert(htmlPromise, () => getApps(true), true);
}

function getAppStatus(data, forInstall = true) {
	const fragment = createElem("div");
	const h5 = createElem("h5", `${forInstall ? "Installation" : "Removal"} Status`);
	const ul = createElem("ul");
	Object.entries(data).forEach(([key, value]) => {
		const text = `${key}: <b>${value}</b>`;
		const li = createElem("li", text, { class: value ? "custom-highlight-text" : "danger-text" });
		ul.append(li);
	});
	fragment.appendChild(h5);
	fragment.appendChild(ul);
	return fragment.innerHTML;
}

// Handle Ctrl+A key press for selecting/deselecting all checkboxes
document.addEventListener("keydown", (e) => {
	if (e.ctrlKey && (e.key === "a" || e.key === "A")) {
		e.preventDefault(); // Prevent default browser behavior
		toggleAll();
	}
});

document.addEventListener("DOMContentLoaded", () => {
	// Attach search input event listener
	if (searchInput) {
		searchInput.addEventListener("input", fuzzySearch);
	}

	if (selectAllButton) {
		selectAllButton.addEventListener("click", () => {
			toggleAll();
		});
	}

	if (searchCancel) {
		searchCancel.addEventListener("click", () => {
			searchInput.value = "";
			const inputEvent = new InputEvent("input", {
				bubbles: true,
				cancelable: true,
				composed: true,
			});
			searchInput.dispatchEvent(inputEvent);
		});
	}

	if (removeButton) {
		removeButton.addEventListener("click", async () => {
			const selectedApps = getSelected();
			if (selectedApps.length < 1) {
				return modalAlert("Please select an app first.");
			}
			const confirmText = `Are you sure you want to uninstall ${
				selectedApps.length === 1 ? "the selected app?" : `all ${selectedApps.length} selected apps?`
			}`;

			const selectedAppNames = selectedApps.map((index) => appData[index].name);
			const selectedAppsListHtml = `<ul>${selectedAppNames.map((item) => `<li>${item}</li>`).join("")}</ul>`;
			const strictConfirmRes = await modalStrictConfirm({
				text: confirmText,
				html: selectedAppsListHtml,
			});
			if (strictConfirmRes) {
				uninstallAppsFromList(selectedAppNames);
			}
		});
	}

	if (downloadExcelButton) {
		downloadExcelButton.addEventListener("click", () => {
			const table = document.querySelector(".apps-table");
			const rows = table.querySelectorAll(".checked");
			const filename = `Lab Link ${hostId} Applications Report - ${new Date().toISOString()}`;

			if (rows.length === 0) {
				return downloadAsExcel__HTMLTable(table, filename);
			}

			const tableDuplicate = table.cloneNode();
			const thead = table.querySelector("thead").cloneNode(true);
			tableDuplicate.appendChild(thead);

			const tbody = table.querySelector("tbody").cloneNode();
			tableDuplicate.appendChild(tbody);
			downloadAsExcel__HTMLTable(tableDuplicate, filename);
		});
	}

	if (uncacheAndRefresh) {
		uncacheAndRefresh.addEventListener("click", () => getApps(true));
	}

	new InstallModal(installAppsFromList);

	M.Tooltip.init(document.querySelectorAll(".tooltipped"), {});
});

// Initial call to fetch and display applications
getApps();

