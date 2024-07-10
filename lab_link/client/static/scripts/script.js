import fuzzysort from "https://cdn.jsdelivr.net/npm/fuzzysort@3.0.2/+esm";

document.addEventListener("DOMContentLoaded", function () {
	var sidenav = document.querySelectorAll(".sidenav");
	M.Sidenav.init(sidenav, {
		edge: "left",
		draggable: true,
	});

	const goUp = document.querySelector(".go-up");
	const goDown = document.querySelector(".go-down");

	console.log(goUp, goDown);

	if (goUp && goDown) {
		goUp.addEventListener("click", () => {
			window.scrollTo({ top: 0, behavior: "smooth" });
		});

		goDown.addEventListener("click", () => {
			window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
		});
	}
});

class AlertModal {
	constructor() {
		this._modalElem = document.getElementById("alert-modal");

		if (!this._modalElem) {
			throw new Error("Modal element with id 'alert-modal' not found.");
		}
	}

	alert(text, callback) {
		this._modalElem.innerHTML = "";
		const instance = M.Modal.init(this._modalElem, {});
		const respond = () => {
			instance.close();
			instance.destroy();
			if (callback && typeof callback === "function") {
				callback();
			}
		};

		const fragment = document.createDocumentFragment();
		const content = createElem("div", "", { class: "modal-content" });
		const header = createElem("h4", "Alert");
		const p = createElem("p", text);
		content.appendChild(header);
		content.appendChild(p);
		fragment.appendChild(content);

		const footer = createElem("div", "", { class: "modal-footer" });
		const confirmButton = createElem("a", "OK", {
			class: "modal-close waves-effect waves-light btn-flat custom-highlight-text",
		});
		confirmButton.addEventListener("click", () => respond());
		footer.appendChild(confirmButton);
		fragment.appendChild(footer);

		this._modalElem.appendChild(fragment);
		instance.open();
	}

	confirm(text) {
		return new Promise((resolve) => {
			this._modalElem.innerHTML = "";
			const instance = M.Modal.init(this._modalElem, {
				onCloseEnd: () => resolve(false),
			});
			const respond = (response) => {
				resolve(response);
				instance.close();
				instance.destroy();
			};

			const fragment = document.createDocumentFragment();

			const content = createElem("div", "", { class: "modal-content" });
			const header = createElem("h4", "Confirm");
			const p = createElem("p", text);
			content.appendChild(header);
			content.appendChild(p);
			fragment.appendChild(content);

			const footer = createElem("div", "", { class: "modal-footer" });
			const confirmButton = createElem("a", "Yes", {
				class: "modal-close waves-effect waves-light btn danger",
			});
			const cancelButton = createElem("a", "Cancel", {
				class: "modal-close waves-effect waves-light btn-flat custom-highlight-text",
			});
			confirmButton.addEventListener("click", () => respond(true));
			cancelButton.addEventListener("click", () => respond(false));
			footer.appendChild(confirmButton);
			footer.appendChild(cancelButton);
			fragment.appendChild(footer);

			this._modalElem.appendChild(fragment);
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

export function showCachedMessage() {
	document.querySelector(".cache-message-container")?.remove();

	const div = createElem(
		"div",
		"You are viewing a cached page. Use the Uncache & Refresh Button to get a new list.",
		{ class: "cache-message-container" }
	);
	const icon = createElem("i", "close", { class: "material-icons cache-message-close-icon" });

	div.appendChild(icon);

	icon.addEventListener("click", () => {
		div.remove();
	});

	document.body.appendChild(div);
}

const alertModal = new AlertModal();

window.modalAlert = alertModal.alert.bind(alertModal);
window.modalConfirm = alertModal.confirm.bind(alertModal);

