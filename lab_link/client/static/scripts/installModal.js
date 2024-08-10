import { ChipsAutocomplete } from "./script.js";

export class InstallModal {
	constructor(callback) {
		this._modalElem = document.getElementById("install-modal");
		this._button = this._modalElem.querySelector("#install-button");
		if (!this._modalElem && !this._button) throw new Error("Modal elements not found");
		this._callback = callback;

		// Initialize the modal
		this._modalInstance = M.Modal.init(this._modalElem);

		// Initialize the chips autocomplete
		const chipsElem = this._modalElem.querySelector(".chips-autocomplete");
		if (chipsElem) {
			this._chipsInstance = new ChipsAutocomplete(chipsElem);
		} else {
			throw new Error("Chips autocomplete element not found");
		}

		// Add event listener to the button
		if (this._button) {
			this._button.addEventListener("click", () => {
				if (typeof this._callback === "function") {
					const list = this._chipsInstance.chipsData;
					const message = this._modalElem.querySelector("#message");
					if (list.length === 0) {
						message.textContent = "Please Enter a Package Name. Make sure to select it or press Enter.";
						setTimeout(() => {
							message.innerHTML = "";
						}, 1000 * 5);
					} else {
						this._callback(this._chipsInstance.chipsData);
						this._modalInstance.close();
					}
				}
			});
		} else {
			throw new Error("Button element not found");
		}
	}
}

