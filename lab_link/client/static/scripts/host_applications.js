import { getApplications } from "./fetch.js";
import { Loading, createElem, FuzzySearch } from "./script.js";

const tbody = document.querySelector(".apps-table-body");
const searchInput = document.getElementById("search");
const selectAllButton = document.querySelector(".select-all-button");
const loading = new Loading(document.querySelector(".preloader"));
const searchCancel = document.querySelector(".search-cancel");
const countDisplay = document.querySelector(".count");
const goUpButton = document.querySelector(".go-up");
const goDownButton = document.querySelector(".go-down");

let fuzzy = new FuzzySearch([], { key: "name", all: true });
let lastChecked = 0;
let allState = true;

// Fetch and populate applications data
async function getApps() {
	try {
		loading.setLoading(true);
		const data = await getApplications(hostId);
		populateHostAppsTable(data);
		fuzzy.list = data;
	} catch (error) {
		console.error("Failed to fetch applications:", error);
	} finally {
		loading.setLoading(false);
	}
}

// Populate table for host apps
function populateHostAppsTable(data) {
	const fragment = document.createDocumentFragment();
	data.forEach((item, index) => {
		const row = createElem("tr", "", { class: `check-row-${index} check-row visible` });

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
});

// Initial call to fetch and display applications
getApps();

