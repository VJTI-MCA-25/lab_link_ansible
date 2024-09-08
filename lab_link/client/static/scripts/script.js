import fuzzysort from "https://cdn.jsdelivr.net/npm/fuzzysort@3.0.2/+esm";
import { searchPackage } from "./fetch.js";

class AlertModal {
	constructor() {
		// No need to manually create modal elements, as SweetAlert2 handles this
	}

	alert(html, callback, persistent = false) {
		Swal.fire({
			title: "Alert",
			html: html,
			icon: "info",
			allowOutsideClick: !persistent,
			allowEscapeKey: !persistent,
			confirmButtonText: "OK",
		}).then(() => {
			if (callback && typeof callback === "function") {
				callback();
			}
		});
	}

	async awaitAlert(htmlPromise, callback, persistent = false) {
		Swal.fire({
			title: "Alert",
			html: preloaderHtml, // Preloader HTML injected here
			allowOutsideClick: !persistent,
			allowEscapeKey: !persistent,
			showConfirmButton: false, // Hide the confirm button while loading
		});

		const html = await htmlPromise;

		Swal.fire({
			title: "Alert",
			html: html,
			icon: "info",
			confirmButtonText: "OK",
			allowOutsideClick: !persistent,
			allowEscapeKey: !persistent,
		}).then(() => {
			if (callback && typeof callback === "function") {
				callback();
			}
		});
	}

	confirm(text) {
		return Swal.fire({
			title: "Confirm",
			text: text,
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Yes",
			cancelButtonText: "Cancel",
		}).then((result) => {
			return result.isConfirmed;
		});
	}

	strictConfirm({ text = "Are you sure?", html = "" }) {
		const manualConfirmText = "Confirm";
		return Swal.fire({
			title: "Alert",
			html: `
                <p>${text}</p>
                <div class="install-modal-html">${html}</div>
                <input type='text' id="install-modal-strict-input" class="swal2-input" placeholder="Please enter '${manualConfirmText}'" />
            `,
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Yes",
			cancelButtonText: "Cancel",
			preConfirm: () => {
				const inputValue = Swal.getPopup().querySelector("#install-modal-strict-input").value;
				if (inputValue !== manualConfirmText) {
					Swal.showValidationMessage(`You need to enter '${manualConfirmText}'`);
					return false;
				}
				return true;
			},
		}).then((result) => {
			return result.isConfirmed;
		});
	}
}

export class Loading {
	constructor(container, initial = false, preserveOriginalContent = false) {
		this._container = container;
		this._status = initial;
		this._preserve = preserveOriginalContent;

		if (preserveOriginalContent) {
			this._content = this._container.innerHTML;
		}
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
			if (this._preserve) {
				this._container.innerHTML = this._content;
			} else {
				this._container.innerHTML = "";
			}
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
	elem.innerHTML = text;
	Object.entries(attr).forEach(([key, value]) => elem.setAttribute(key, value));
	return elem;
}

export function snakeToTitleCase(str) {
	return str.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function titleToHyphenCase(str) {
	return str.replace(/\s/g, "-").toLowerCase();
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
	constructor(element, data = {}) {
		this._element = element;
		this._instance = M.Chips.init(this._element, {
			placeholder: "Package Name",
			secondaryPlaceholder: "+Package",
			autocompleteOptions: {
				data,
				limit: 5,
				minLength: 1,
			},
		});
	}

	get chipsData() {
		return this._instance.chipsData.map((item) => item["tag"]);
	}
}

export function parseTime(time /*inseconds*/) {
	const hours = Math.floor(time / 3600);
	const minutes = Math.floor((time % 3600) / 60);
	const seconds = Math.floor(time % 60);
	const timeString = ""
		.concat(hours > 0 ? hours + "h " : "")
		.concat(minutes > 0 ? minutes + "m " : "")
		.concat(seconds > 0 ? seconds + "s " : "");
	return timeString;
}

const alertModal = new AlertModal();

window.modalAlert = alertModal.alert.bind(alertModal);
window.modalAwaitAlert = alertModal.awaitAlert.bind(alertModal);
window.modalConfirm = alertModal.confirm.bind(alertModal);
window.modalStrictConfirm = alertModal.strictConfirm.bind(alertModal);

document.addEventListener("DOMContentLoaded", function () {
	var sidenav = document.querySelectorAll(".sidenav");
	M.Sidenav.init(sidenav, {
		edge: "left",
		draggable: true,
	});
});

