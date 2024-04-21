import { shutdownHost } from "./fetch.js";

document.addEventListener("DOMContentLoaded", function () {
	var sidenav = document.querySelectorAll(".sidenav");
	M.Sidenav.init(sidenav, {
		edge: "left",
		draggable: true,
	});

	sidenav[0].querySelector(".shutdown-all").addEventListener("click", async function (e) {
		e.preventDefault();
		if (confirm("Are you sure you want to switch off all hosts?")) {
			const response = await shutdownHost();
			sessionStorage.setItem("shutdownData", JSON.stringify(response));
			window.location.href = "/shutdown";
		}
	});
});

