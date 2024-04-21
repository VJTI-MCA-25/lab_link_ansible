import { getHostDetails, shutdownHost } from "./fetch.js";

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

async function getHostData() {
	setLoading(true);
	try {
		const data = await getHostDetails(hostId);
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
		document.querySelector(".preloader").remove();
		optionsContainer.classList.remove("hide");
	}
}

function setError(error) {
	const container = document.querySelector(".host-page");
	container.innerHTML = `
							<div class="error">
								<div class="error-status">${error.status}</div>
								<div class="error-status-text">${error.statusText}</div>
							</div>`;
}

function populateHostData(data) {
	const mainContainer = document.querySelector(".host-container");

	function createElem(tag, text = "", attr = {}) {
		const elem = document.createElement(tag);
		elem.textContent = text;
		for (const [key, value] of Object.entries(attr)) {
			elem.setAttribute(key, value);
		}
		return elem;
	}

	function snakeToTitleCase(str) {
		return str.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
	}

	for (let [keySet, keysList] of Object.entries(keys)) {
		const section = createElem("section", "", { class: `host-section ${keySet}` });
		let h3 = createElem("h3", snakeToTitleCase(keySet), { class: "section-title title-marker" });
		section.appendChild(h3);
		const sectionData = createElem("div", "", { class: "section-data" });

		for (let key of keysList) {
			const value = data[key];

			let keyTextFormatter = (key) => {
				switch (key) {
					case "system":
						return "OS";
					case "ip_address":
						return "IP Address";
					case "network_interfaces":
						return "Interface";
					case "mac_addresses":
						return "MAC Address";
					case "ipv4_addresses":
						return "IPv4 Address";
					case "ipv6_addresses":
						return "IPv6 Address";
					case "dns_servers":
						return "DNS Server";
					case "cpus":
						return "CPU";
					default:
						return snakeToTitleCase(key);
				}
			};

			if (value) {
				let div = createElem("div", "", { class: `key-value-container ${key}` });
				if (Array.isArray(value)) {
					div.classList.add("list");
					let listKey = createElem("span", `${keyTextFormatter(key)}:`, { class: "key" });
					div.appendChild(listKey);
					let ul = createElem("ul");
					for (let item of value) {
						if (key === "mac_addresses") item = item.toUpperCase();
						let li = createElem("li", item);
						ul.appendChild(li);
					}
					div.appendChild(ul);
					sectionData.appendChild(div);
				} else if (typeof value === "string" || typeof value === "number") {
					let keySpan = createElem("span", `${keyTextFormatter(key)}:`, { class: "key" });
					let valueSpan = createElem("span", value, { class: "value" });
					div.appendChild(keySpan);
					div.appendChild(valueSpan);
					sectionData.appendChild(div);
				}
			}
		}
		section.appendChild(sectionData);
		mainContainer.appendChild(section);
	}
}

document.addEventListener("DOMContentLoaded", () => {
	getHostData();
	const shutdownBtn = document.querySelector(".shutdown-host");
	shutdownBtn.addEventListener("click", async () => {
		if (confirm(`Are you sure you want to switch off ${hostId}?`)) {
			try {
				const result = await shutdownHost(hostId);
				if (result.hasOwnProperty(hostId)) {
					let alertText = result[hostId].shutdown ? "has been switched off." : "could not be switched off.";
					alert(`${hostId} ${alertText}`);
				} else {
					alert("An error occurred while trying to switch off the host.");
				}
			} catch (err) {
				console.error(err);
			}
		}
	});

	document.querySelector(".refresh-host").addEventListener("click", getHostData);
});

