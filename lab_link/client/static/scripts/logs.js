import { getLogs } from "./fetch.js";
import { Loading, createElem } from "./script.js";

const container = document.querySelector(".logs-container");
const contentContainer = document.querySelector(".content-container");
const fileTitle = document.querySelector(".file-title");
const loading = new Loading(container);
var content = null;

async function fetchData() {
	loading.setLoading(true);
	const data = await getLogs(hostId);
	content = data;
	loading.setLoading(false);
	populateLogs(data);
}

function setContent(key) {
	if (content) {
		fileTitle.innerHTML = key;
		contentContainer.innerHTML = content[key].replace(/\\n/g, "<br>");
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

document.addEventListener("DOMContentLoaded", () => {
	fetchData();
});

