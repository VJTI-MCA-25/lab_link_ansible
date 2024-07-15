import fuzzysort from "https://cdn.jsdelivr.net/npm/fuzzysort@3.0.2/+esm";
import { searchPackage } from "./fetch.js";

class AlertModal {
	constructor() {
		this._modalElem = document.getElementById("alert-modal");

		if (!this._modalElem) {
			throw new Error("Modal element with id 'alert-modal' not found.");
		}
	}

	alert(text, callback) {
		const instance = M.Modal.init(this._modalElem, {});
		const respond = () => {
			instance.close();
			instance.destroy();
			if (callback && typeof callback === "function") {
				callback();
			}
		};

		this._modalElem.innerHTML = `
		<div class="modal-content">
			<h4>Alert</h4>
			<p>${text}</p>
			<div class="modal-footer">
				<a class="modal-close waves-effect waves-light btn-flat custom-highlight-text">OK</a>
			</div>
		</div>`;
		this._modalElem.querySelector("a.modal-close").addEventListener("click", () => {
			respond(true);
		});
		instance.open();
	}

	confirm(text) {
		return new Promise((resolve) => {
			const instance = M.Modal.init(this._modalElem, {
				onCloseEnd: () => resolve(false),
			});
			const respond = (response) => {
				resolve(response);
				instance.close();
				instance.destroy();
			};

			this._modalElem.innerHTML = `
			<div class="modal-content">
				<h4>Confirm</h4>
				<p>${text}</p>
				<div class="modal-footer">
					<a id="install-modal-confirm-button-accept" class="modal-close waves-effect waves-light btn danger">Yes</a>
					<a id="install-modal-confirm-button-reject" class="modal-close waves-effect waves-light btn-flat custom-highlight-text">Cancel</a>
				</div>
			</div>`;

			this._modalElem
				.querySelector("#install-modal-confirm-button-accept")
				.addEventListener("click", () => respond(true));
			this._modalElem
				.querySelector("#install-modal-confirm-button-reject")
				.addEventListener("click", () => respond(false));
			instance.open();
		});
	}

	strictConfirm({ text = "Are you sure?", html = "" }) {
		return new Promise((resolve) => {
			const manualConfirmText = "Confirm";
			const instance = M.Modal.init(this._modalElem, {
				onCloseEnd: () => {
					resolve(false);
				},
			});
			const respond = (response) => {
				resolve(response);
				instance.close();
				instance.destroy();
			};

			this._modalElem.innerHTML = `
			<div class="modal-content">
				<h4>Alert</h4>
				<p>${text}</p>
				<div class="install-modal-html">${html}</div>
				<input type='text' id="install-modal-strict-input" placeholder="Please enter '${manualConfirmText}'" />
				<div class="modal-footer">
					<a id="install-modal-strict-button-accept" class="modal-close waves-effect waves-light btn danger">Yes</a>
					<a id="install-modal-strict-button-reject" class="modal-close waves-effect waves-light btn-flat custom-highlight-text">Cancel</a>
				</div>
			</div>`;

			const confirmButton = this._modalElem.querySelector("#install-modal-strict-button-accept");
			const cancelButton = this._modalElem.querySelector("#install-modal-strict-button-reject");

			const input = this._modalElem.querySelector("#install-modal-strict-input");
			input.addEventListener("input", (e) => {
				if (e.target.value === manualConfirmText) {
					confirmButton.classList.remove("disabled");
				} else {
					confirmButton.classList.add("disabled");
				}
			});

			confirmButton.addEventListener("click", () => respond(input.value === manualConfirmText));
			cancelButton.addEventListener("click", () => respond(false));
			instance.open();
		});
	}
}

export class Loading {
	constructor(container, initial = false) {
		this._container = container;
		this._status = initial;
	}

	get container() {
		return this._container;
	}

	get status() {
		return this._status;
	}

	setLoading(state) {
		if (state) {
			this._container.innerHTML = preloaderHtml;
		} else {
			this._container.innerHTML = "";
		}
		this._status = state;
	}
}

export class FuzzySearch {
	constructor(list = [], options = {}) {
		this._list = list.map((item, index) => ({ ...item, index }));
		this._options = options;
	}

	get list() {
		return this._list;
	}

	get options() {
		return this._options;
	}

	set list(newList) {
		this._list = newList.map((item, index) => ({ ...item, index }));
	}

	search(text) {
		const results = fuzzysort.go(text, this._list, this._options);
		return results;
	}

	indices(text) {
		const results = fuzzysort.go(text, this._list, this._options);
		const indexList = results.map((item) => item.obj.index);
		return indexList;
	}
}

export function createElem(tag, text = "", attr = {}) {
	const elem = document.createElement(tag);
	elem.textContent = text;
	Object.entries(attr).forEach(([key, value]) => elem.setAttribute(key, value));
	return elem;
}

export function snakeToTitleCase(str) {
	return str.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function showMessage(message = "") {
	const container = document.querySelector(".message-container");
	if (message == "") {
		return container.classList.add("hide");
	}
	container.firstChild.textContent = message;
	container.classList.remove("hide");
}

export class ChipsAutocomplete {
	constructor(element) {
		this._element = element;
		this._instance = M.Chips.init(this._element, {
			placeholder: "Package Name",
			secondaryPlaceholder: "+Package",
			autocompleteOptions: {
				data: {},
				limit: 5,
				minLength: 1,
			},
		});

		if (this._element) {
			this._element.querySelector("input").addEventListener("input", async (e) => {
				const value = e.target.value;
				try {
					const newData = await searchPackage(value);
					this.updateAutocompleteData(newData);
				} catch (error) {
					console.error(error);
				}
			});
		}
	}

	static arrayToObject(array) {
		return array.reduce((obj, item) => {
			obj[item] = null;
			return obj;
		}, {});
	}

	updateAutocompleteData(data) {
		if (this._instance.hasAutocomplete) {
			this._instance.autocomplete.updateData(ChipsAutocomplete.arrayToObject(data));
		}
	}

	get chipsData() {
		return this._instance.chipsData.map((item) => item["tag"]);
	}
}

const alertModal = new AlertModal();

window.modalAlert = alertModal.alert.bind(alertModal);
window.modalConfirm = alertModal.confirm.bind(alertModal);
window.modalStrictConfirm = alertModal.strictConfirm.bind(alertModal);

document.addEventListener("DOMContentLoaded", function () {
	var sidenav = document.querySelectorAll(".sidenav");
	M.Sidenav.init(sidenav, {
		edge: "left",
		draggable: true,
	});
});

