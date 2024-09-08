import { getLogs } from "./fetch.js";
import { Loading, createElem } from "./script.js";
import jszip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";

const container = document.querySelector(".logs-container");
const contentContainer = document.querySelector(".content-container");
const fileTitle = document.querySelector(".file-title");
const downloadBtn = document.querySelector(".download-logs");
const refreshBtn = document.querySelector(".uncache-btn");
const loading = new Loading(container);
var content = null;

async function fetchData(uncached = false) {
	loading.setLoading(true);
	contentContainer.innerHTML = "";
	fileTitle.innerHTML = "";
	const data = await getLogs(hostId, uncached);
	content = data;
	loading.setLoading(false);
	populateLogs(data);
}

function setContent(key) {
	if (content) {
		fileTitle.innerHTML = key;
		contentContainer.innerHTML = content[key];
	}
}

function populateLogs(data) {
	Object.keys(data).forEach((log) => {
		let div = createElem("div", "", { class: " btn log waves-effect waves-light" });
		let icon = createElem("i", "insert_drive_file", { class: "material-icons" });
		let text = createElem("div", log);
		div.append(icon, text);
		div.addEventListener("click", () => setContent(log));
		container.appendChild(div);
	});
}

function downloadLogs() {
	const zip = new jszip();
	Object.keys(content).forEach((key) => {
		const filename = key.endsWith(".log") ? key : key + ".log";
		zip.file(filename, content[key]);
	});
	zip.generateAsync({ type: "blob" }).then((blob) => {
		const url = URL.createObjectURL(blob);
		const a = createElem("a", "", { href: url, download: new Date().toISOString() + ".zip" });
		a.click();
		URL.revokeObjectURL(url);
		a.remove();
	});
}

document.addEventListener("DOMContentLoaded", () => {
	fetchData();

	downloadBtn.addEventListener("click", downloadLogs);
	refreshBtn.addEventListener("click", () => fetchData(true));
});

