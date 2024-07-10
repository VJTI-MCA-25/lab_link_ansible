import { pingHosts, shutdownHost } from "./fetch.js";
import { Loading } from "./script.js";

const container = document.querySelector(".hosts-container");
const refreshButton = document.querySelector(".refresh-list-button");
const shutdownAllButton = document.querySelector(".shutdown-all-hosts");
const loading = new Loading(container);

async function getHosts() {
	loading.setLoading(true);
	const data = await pingHosts();
	loading.setLoading(false);
	populateHosts(data);
	console.log("running");
}

function populateHosts(data) {
	let hosts = Object.keys(data);

	hosts.forEach((host) => {
		let div = document.createElement("div");
		div.classList.add("host");
		div.innerHTML = `
			<i class="${data[host].status} host-status material-icons">desktop_windows</i>
			<div class=	"host-name">${host}</div>
			<div class="host-ip">${data[host].ip}</div>
            `;
		let a = document.createElement("a");
		a.href = `/host/${host}`;
		a.classList.add("host-link");
		a.appendChild(div);
		container.appendChild(a);
	});
}

async function shutdownAllHosts() {
	const modalConfirmRes = await modalConfirm("Are you sure you want to switch off all hosts?");

	if (modalConfirmRes) {
		try {
			const response = await shutdownHost();
			modalAlert("Shutdown signal sent. The list will refresh to reflect the new state.", getHosts);
		} catch (err) {
			console.error(err);
			modalAlert("Something went wrong.");
		}
	}
}

document.addEventListener("DOMContentLoaded", () => {
	if (refreshButton) {
		refreshButton.addEventListener("click", getHosts);
	}
	if (shutdownAllButton) {
		shutdownAllButton.addEventListener("click", shutdownAllHosts);
	}
	getHosts();
});

