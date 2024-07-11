import { getHostDetails, shutdownHost } from "./fetch.js";
import { createElem, showCachedMessage, snakeToTitleCase } from "./script.js";

const keys = {
	system_details: ["architecture", "system", "release", "type", "version", "hostname", "users", "uptime"],
	specification: ["cpus", "cores", "memory", "disk_usage"],
	network_details: [
		"ip_address",
		"network_interfaces",
		"mac_addresses",
		"ipv4_addresses",
		"ipv6_addresses",
		"dns_servers",
		"gateway",
		"domain",
		"timezone",
	],
	other_details: ["locale", "python_version"],
	peripherals_devices: ["peripherals"],
};

async function getHostData(uncached = false) {
	setLoading(true);
	try {
		const { data, isCached } = await getHostDetails(hostId, uncached);
		showCachedMessage(isCached);
		setLoading(false);
		populateHostData(data);
	} catch (error) {
		setLoading(false);
		setError(error);
	}
}

function setLoading(isLoading) {
	const mainContainer = document.querySelector(".host-page");
	const dataContainer = document.querySelector(".host-container");
	const optionsContainer = document.querySelector(".options-container");

	if (isLoading) {
		dataContainer.innerHTML = "";
		optionsContainer.classList.add("hide");
		mainContainer.innerHTML += preloaderHtml;
	} else {
		const preloader = document.querySelector(".preloader");
		if (preloader) {
			preloader.remove();
		}
		optionsContainer.classList.remove("hide");
	}
}

function keyTextFormatter(key) {
	const keyMappings = {
		system: "OS",
		ip_address: "IP Address",
		network_interfaces: "Interface",
		mac_addresses: "MAC Address",
		ipv4_addresses: "IPv4 Address",
		ipv6_addresses: "IPv6 Address",
		dns_servers: "DNS Server",
		cpus: "CPU",
	};
	return keyMappings[key] || snakeToTitleCase(key);
}

function populateHostData(data) {
	const mainContainer = document.querySelector(".host-container");
	mainContainer.innerHTML = "";

	Object.entries(keys).forEach(([keySet, keysList]) => {
		const section = createElem("section", "", { class: `host-section ${keySet}` });
		const sectionTitle = createElem("h3", snakeToTitleCase(keySet), { class: "section-title underline" });
		section.appendChild(sectionTitle);

		const sectionData = createElem("div", "", { class: "section-data" });

		if (keySet !== "peripherals_devices") {
			keysList.forEach((key) => {
				const value = data[key];
				if (value) {
					const div = createElem("div", "", { class: `key-value-container ${key} custom-hover-highlight` });
					if (Array.isArray(value)) {
						div.classList.add("list");
						const listKey = createElem("span", `${keyTextFormatter(key)}:`, { class: "key" });
						div.appendChild(listKey);
						const ul = createElem("ul");
						value.forEach((item) => {
							const listItem = createElem("li", key === "mac_addresses" ? item.toUpperCase() : item);
							ul.appendChild(listItem);
						});
						div.appendChild(ul);
					} else if (typeof value === "string" || typeof value === "number") {
						const keySpan = createElem("span", `${keyTextFormatter(key)}:`, { class: "key" });
						const valueSpan = createElem("span", value, { class: "value" });
						div.appendChild(keySpan);
						div.appendChild(valueSpan);
					}
					sectionData.appendChild(div);
				}
			});
		} else {
			const [all, deviceCount] = populatePeripheralDevices(data[keysList]);
			sectionData.appendChild(all);
			sectionData.appendChild(deviceCount);
			section.appendChild(sectionData);
		}

		section.appendChild(sectionData);
		mainContainer.appendChild(section);
	});
}

function populatePeripheralDevices(peripherals) {
	const ul = createElem("ul", "", { class: "collapsible" });
	const li = createElem("li", "");
	const header = createElem("div", "All Peripherals", { class: "collapsible-header" });
	const body = createElem("div", "", { class: "collapsible-body" });
	const bodyUl = createElem("ul");

	const devices = {
		Mouse: [],
		Webcam: [],
		Keyboard: [],
	};

	peripherals.forEach((device) => {
		let highlightFlag = false;

		if (/mouse/gi.test(device)) {
			devices["Mouse"].push(device);
			highlightFlag = true;
		}
		if (/cam/gi.test(device)) {
			devices["Webcam"].push(device);
			highlightFlag = true;
		}
		if (/keyboard/gi.test(device)) {
			devices["Keyboard"].push(device);
			highlightFlag = true;
		}

		const bodyLi = createElem("li", device, {
			class: `${highlightFlag ? "custom-highlight-text" : ""} custom-hover-highlight`,
		});
		bodyUl.appendChild(bodyLi);
	});

	body.appendChild(bodyUl);
	li.appendChild(header);
	li.appendChild(body);
	ul.appendChild(li);
	M.Collapsible.init(ul, {});

	const deviceCountDiv = populateDeviceCount(devices);

	return [ul, deviceCountDiv];
}

function populateDeviceCount(devices) {
	const ul = createElem("ul", "", { class: "collapsible expandable" });
	Object.entries(devices).map(([label, list]) => {
		const li = createElem("li", "", { class: `${list.length === 0 ? "disable" : ""}` });
		const header = createElem("div", "", { class: "collapsible-header" });

		const headerLabel = createElem("div", label, { class: "label" });
		const headerCount = createElem("span", list.length || "No", {
			class: `new badge ${list.length === 0 ? "danger disable" : ""}`,
			"data-badge-caption": `${list.length === 0 ? `${label} Connected` : `${label} Connected`}`,
		});

		header.appendChild(headerLabel);
		header.appendChild(headerCount);

		const body = createElem("div", "", { class: "collapsible-body" });

		const bodyUl = createElem("ul");
		list.map((item) => {
			const bodyLi = createElem("li", item);
			bodyUl.appendChild(bodyLi);
		});
		body.appendChild(bodyUl);
		li.appendChild(header);
		li.appendChild(body);
		ul.appendChild(li);
	});
	M.Collapsible.init(ul, {
		accordion: false,
		onOpenStart: (elem) => {
			if (elem.classList.contains("disable")) throw "No Devices";
		},
	});
	return ul;
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
					console.error(err);
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

	M.Modal.init(document.getElementById("install-modal"));
});

