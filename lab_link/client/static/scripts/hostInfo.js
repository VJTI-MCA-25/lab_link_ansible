import { getHostDetails, shutdownHost } from "./fetch.js";
import { createElem, parseTime, snakeToTitleCase, titleToHyphenCase, Loading } from "./script.js";

const mainContainer = document.querySelector(".host-container");
const loading = new Loading(mainContainer);

async function getHostData(uncached = false) {
	try {
		hideOptions(true);
		loading.setLoading(true);
		const { dataSource, ...data } = await getHostDetails(hostId, uncached);
		loading.setLoading(false);
		populateHostData(data);
		hideOptions(false);
		disableOptions(dataSource === "DATABASE");
	} catch (error) {
		hideOptions(true);
		loading.setError({ code: error.code, message: error.message });
		modalAlert("Something went wrong while fetching the host details.");
	}
}

function hideOptions(state) {
	const options = document.querySelector(".options-container");
	options.classList.toggle("hide", state);
}

function checkIfDevice(device) {
	if (/mouse/gi.test(device)) return "Mouse";
	if (/keyboard/gi.test(device)) return "Keyboard";
	if (/cam/gi.test(device)) return "Camera";
	return null;
}

function getPercentageUsed(used, total) {
	if (!used || !total) return 0;
	const usedValue = parseInt(used.match(/\d+/)?.[0] || 0);
	const totalValue = parseInt(total.match(/\d+/)?.[0] || 1); // Prevent division by zero

	return (usedValue / totalValue) * 100;
}

function populateHostData(data) {
	mainContainer.innerHTML = "";

	Object.entries(data).forEach(([key, value]) => {
		const section = createElem("section", "", { class: `host-section ${titleToHyphenCase(key)}` });
		const title = createElem("h4", key, { class: "section-title underline" });
		const sectionData = createElem("div", "", { class: "section-data" });

		if (key === "Peripheral Devices") {
			const deviceCount = {
				Mouse: 0,
				Keyboard: 0,
				Camera: 0,
			};
			value.forEach((device, index) => {
				const deviceType = checkIfDevice(device);
				if (deviceType) deviceCount[deviceType]++;
				const div = createElem("div", device, {
					class: `key-value-container peripheral-device-${index} ${deviceType || ""} custom-hover-highlight ${
						deviceType ? "custom-highlight-text" : ""
					} ${deviceType ? "tooltipped" : ""}`,
					"data-position": "top",
					"data-tooltip": deviceType ? `${deviceType}.` : "",
				});
				sectionData.append(div);
			});

			const deviceCountList = createElem("ul", "", { class: "device-count" });
			Object.entries(deviceCount).forEach(([device, count]) => {
				const li = createElem("li", `${device} Connected: ${count}`);
				deviceCountList.append(li);
			});
			sectionData.append(deviceCountList);
		} else if (key === "Storage And Memory") {
			const storageMemoryContainer = createElem("div", "", { class: "storage-memory-container" });
			const storage = createElem("div", "", { class: "storage" });
			const memory = createElem("div", "", { class: "memory" });

			const storageTitle = createElem("h5", "Storage", { class: "underline" });
			const memoryTitle = createElem("h5", "Memory", { class: "underline" });

			const storagePercentage = getPercentageUsed(value.Disk.Used, value.Disk.Total);
			const maxStorage = createElem("div", "", { class: "storage-data total-container" });
			const usedStorage = createElem("div", "", {
				class: `storage-data used-container ${storagePercentage > 90 ? "danger" : ""}`,
				style: `width: ${storagePercentage}%`,
			});
			const storageString = `<div>Total: <b>${value.Disk.Total}</b></div>
									<div>Used: <b>${value.Disk.Used}</b></div>
									<div>Available: <b>${value.Disk.Free}</b></div>`;
			const stgStrContainer = createElem("span", storageString, { class: "storage-string-container" });

			const memoryPercentage = getPercentageUsed(value.Memory.Used, value.Memory.Total);
			const maxMemory = createElem("div", "", { class: "memory-total total-container" });
			const usedMemory = createElem("div", "", {
				class: `memory-used used-container ${memoryPercentage > 90 ? "danger" : ""}`,
				style: `width: ${memoryPercentage}%`,
			});
			const memoryString = `<div>Total: <b>${value.Memory.Total}</b></div>
									<div>Used: <b>${value.Memory.Used}</b></div>
									<div>Available: <b>${value.Memory.Free}</b></div>`;
			const memStrContainer = createElem("span", memoryString, { class: "memory-string-container" });

			maxStorage.append(usedStorage);
			storage.append(storageTitle, maxStorage, stgStrContainer);

			maxMemory.append(usedMemory);
			memory.append(memoryTitle, maxMemory, memStrContainer);

			storageMemoryContainer.append(storage, memory);
			sectionData.append(storageMemoryContainer);
		} else {
			Object.entries(value).forEach(([k, v]) => {
				const div = createElem("div", "", {
					class: `key-value-container ${titleToHyphenCase(k)} custom-hover-highlight`,
				});
				if (typeof v === "string" || typeof v === "number") {
					const keyElem = createElem("span", snakeToTitleCase(k), { class: "key" });
					const valueElem = createElem("span", k === "Uptime" ? parseTime(v) : v, { class: "value" });

					div.append(keyElem, valueElem);
				} else if (Array.isArray(v)) {
					div.classList.add("list");
					const keyElem = createElem("span", snakeToTitleCase(k), { class: "key" });
					const ul = createElem("ul");
					v.forEach((item) => {
						const li = createElem("li", item);
						ul.append(li);
					});
					div.append(keyElem, ul);
				} else {
					console.warn(`Unhandled data type for key: ${k}`, v);
				}
				sectionData.append(div);
			});
		}
		section.append(title, sectionData);
		mainContainer.append(section);
	});

	// Initialize tooltips after all elements are added to the DOM
	const tooltipped = document.querySelectorAll(".tooltipped");
	M.Tooltip.init(tooltipped, { enterDelay: 500, exitDelay: 100 });
}

function disableOptions(state) {
	const manageApplicaionButton = document.querySelector(".applications-host");
	const shutdownButton = document.querySelector(".shutdown-host");
	const openTerminalButton = document.querySelector(".open-terminal");

	[manageApplicaionButton, shutdownButton, openTerminalButton].forEach((button) => {
		if (state) {
			button.classList.add("disabled");
		} else {
			button.classList.remove("disabled");
		}
	});
}

document.addEventListener("DOMContentLoaded", () => {
	getHostData();

	const shutdownBtn = document.querySelector(".shutdown-host");
	if (shutdownBtn) {
		shutdownBtn.addEventListener("click", async () => {
			const confirmRes = await modalConfirm(`Are you sure you want to switch off ${hostId}?`);

			if (confirmRes) {
				try {
					const result = await shutdownHost(hostId);
					const alertText = result[hostId]?.shutdown
						? "has been switched off."
						: "could not be switched off.";
					const alertIcon = result[hostId]?.shutdown ? "info" : "error";
					modalAlert(`${hostId} ${alertText}`);
				} catch (err) {
					console.error("Error during shutdown:", err);
					modalAlert("An error occurred while trying to switch off the host.");
				}
			}
		});
	} else {
		console.error("Shutdown button not found.");
	}

	const refreshBtn = document.querySelector(".refresh-host");
	if (refreshBtn) {
		refreshBtn.addEventListener("click", () => getHostData(true));
	}
});

