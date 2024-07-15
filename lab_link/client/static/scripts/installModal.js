import { ChipsAutocomplete } from "./script.js";

const installModal = document.getElementById("install-modal");
const installButton = installModal.querySelector("#install-button");
const message = installModal.querySelector("#message");

document.addEventListener("DOMContentLoaded", () => {
	M.Modal.init(document.getElementById("install-modal"));
	const chips = new ChipsAutocomplete(document.querySelector(".chips-autocomplete"));

	if (installButton) {
		installButton.addEventListener("click", () => {
			const list = chips.chipsData;
			if (!list) {
				message.innerHTML = "Please Enter a Package Name. Make sure to select it or press Enter.";
			}
		});
	}
});

