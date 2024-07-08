import { pingHosts, shutdownHost } from "./fetch.js";
import { Loading } from "./script.js";

const container = document.querySelector(".hosts-container");
const loading = new Loading(container);

async function getHosts() {
	loading.setLoading(true);
	const data = await pingHosts();
	loading.setLoading(false);
	populateHosts(data);
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

getHosts();

document.addEventListener("DOMContentLoaded", () => {
	document.querySelector(".refresh-list-button").addEventListener("click", getHosts);

	document.querySelector(".shutdown-all-hosts").addEventListener("click", async () => {
		if (confirm("Are you sure you want to switch off all hosts?")) {
			const response = await shutdownHost();
			sessionStorage.setItem("shutdownData", JSON.stringify(response));
			window.location.href = "/shutdown";
		}
	});
});

