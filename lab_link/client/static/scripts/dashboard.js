import { addHost, pingHosts, shutdownHost, deleteHost } from "./fetch.js";
import { Loading } from "./script.js";

const container = document.querySelector(".hosts-container");
const addHostModal = document.querySelector("#add-host-modal");
const addHostForm = document.querySelector("#add-host-form");
const deleteHostButton = document.querySelector(".delete-host-button");
const refreshButton = document.querySelector(".refresh-list-button");
const shutdownAllButton = document.querySelector(".shutdown-all-hosts");
const showPassword = document.querySelector(".password-field>i");
const loading = new Loading(container);

async function getHosts(uncached = false) {
	loading.setLoading(true);
	container.classList.remove("delete-mode");
	try {
		const data = await pingHosts(uncached);
		const { params, ...hosts } = data;
		loading.setLoading(false);
		populateHosts(hosts);
	} catch (err) {
		loading.setError({ code: err.code, message: err.message });
		modalAlert("Something went wrong while fetching the hosts.");
	}
}

function populateHosts(data) {
	let hosts = Object.keys(data);

	hosts
		.sort((a, b) => a.localeCompare(b))
		.forEach((host) => {
			let div = document.createElement("div");
			div.classList.add("host", "col", "s1");
			div.innerHTML = `
			<i class="material-icons delete-host-icon" data-delete-host-name="${host}">clear</i>
			<a class="host-link" href="/host/${host}">
				<i class="${data[host].status} host-status material-icons">desktop_windows</i>
				<div class=	"host-name">${host}</div>
				<div class="host-ip">${data[host].ip}</div>
			</a>
            `;
			container.appendChild(div);
		});

	document.querySelectorAll(".delete-host-icon").forEach((icon) => {
		icon.addEventListener("click", deleteHostHandler);
	});
}

async function deleteHostHandler(e) {
	const hostName = e.target.dataset.deleteHostName;
	const modalConfirmRes = await modalStrictConfirm(`Are you sure you want to delete ${hostName}?`);

	if (modalConfirmRes) {
		try {
			const res = await deleteHost(hostName);
			if (res.status === "success") {
				modalAlert("Host deleted successfully. The list will refresh to reflect the changes.", () =>
					getHosts(true)
				);
			}
		} catch (err) {
			console.error(err);
			modalAlert("Something went wrong. Could not delete the host.");
		}
	}
}

async function shutdownAllHosts() {
	const modalConfirmRes = await modalConfirm("Are you sure you want to switch off all hosts?");

	if (modalConfirmRes) {
		try {
			await shutdownHost();
			modalAlert("Shutdown signal sent. The list will refresh to reflect the new state.", getHosts);
		} catch (err) {
			console.error(err);
			modalAlert("Something went wrong. Cannot verify if the hosts are down.");
		}
	}
}

async function addHostHandler(e) {
	e.preventDefault();
	const name = e.target.querySelector("#host-id").value;
	const ip = e.target.querySelector("#host-ip").value;
	const user = e.target.querySelector("#host-user").value;
	const password = e.target.querySelector("#host-password").value;

	try {
		const res = await addHost({ name, ip, user, password });
		console.log(res);
		modalAlert("Host added successfully, Please Refresh the list to reflect the changes.", () => getHosts(true));
	} catch (err) {
		modalAlert("Something went wrong. Could not add the host.");
	}
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

	if (deleteHostButton) {
		deleteHostButton.addEventListener("click", () => {
			container.classList.toggle("delete-mode");
		});
	}

	getHosts();
});

