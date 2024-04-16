import { getHostDetails } from "./fetch.js";

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
	const data = await getHostDetails(hostId);
	console.log(data);
	setLoading(false);
	populateHostData(data);
}

function setLoading(isLoading = false) {
	const container = document.querySelector(".host-container");

	if (isLoading) {
		container.innerHTML = preloaderHtml;
	} else {
		container.innerHTML = "";
	}
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
		let h3 = createElem("h3", snakeToTitleCase(keySet), { class: "section-title" });
		section.appendChild(h3);
		const sectionData = createElem("div", "", { class: "section-data" });

		for (let key of keysList) {
			const value = data[key];

			let keyTextSelector = (key) => {
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
					let listKey = createElem("span", `${keyTextSelector(key)}:`, { class: "key" });
					div.appendChild(listKey);
					let ul = createElem("ul");
					for (let item of value) {
						let li = createElem("li", item);
						ul.appendChild(li);
					}
					div.appendChild(ul);
					sectionData.appendChild(div);
				} else if (typeof value === "string" || typeof value === "number") {
					let keySpan = createElem("span", `${keyTextSelector(key)}:`, { class: "key" });
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
});

