import { addHost, pingHosts, shutdownHost } from "./fetch.js";
import { Loading } from "./script.js";

const container = document.querySelector(".hosts-container");
const addHostModal = document.querySelector("#add-host-modal");
const addHostForm = document.querySelector("#add-host-form");
const refreshButton = document.querySelector(".refresh-list-button");
const shutdownAllButton = document.querySelector(".shutdown-all-hosts");
const showPassword = document.querySelector(".password-field>i");
const loading = new Loading(container);

async function getHosts(uncached = false) {
	loading.setLoading(true);
	const data = await pingHosts(uncached);
	const { params, ...hosts } = data;
	loading.setLoading(false);
	populateHosts(hosts);
}

function populateHosts(data) {
	let hosts = Object.keys(data);

	hosts
		.sort((a, b) => a.localeCompare(b))
		.forEach((host) => {
			let div = document.createElement("div");
			div.classList.add("host", "col", "s1");
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

async function addHostHandler(e) {
	e.preventDefault();
	const name = e.target.querySelector("#host-id").value;
	const ip = e.target.querySelector("#host-ip").value;
	const user = e.target.querySelector("#host-user").value;
	const password = e.target.querySelector("#host-password").value;

	const res = await addHost({ name, ip, user, password });
	console.log(res);
}

document.addEventListener("DOMContentLoaded", () => {
	M.Modal.init(addHostModal, {});
	if (refreshButton) {
		refreshButton.addEventListener("click", () => getHosts(true));
	}
	if (shutdownAllButton) {
		shutdownAllButton.addEventListener("click", shutdownAllHosts);
	}
	if (showPassword) {
		showPassword.addEventListener("click", () => {
			const passwordField = document.querySelector(".password-field input");
			passwordField.type = passwordField.type === "password" ? "text" : "password";
			showPassword.innerHTML = passwordField.type === "password" ? "visibility" : "visibility_off";
		});
	}
	if (addHostForm) {
		addHostForm.addEventListener("submit", addHostHandler);
	}
	getHosts();
});

