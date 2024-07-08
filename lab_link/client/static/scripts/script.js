import fuzzysort from "https://cdn.jsdelivr.net/npm/fuzzysort@3.0.2/+esm";

document.addEventListener("DOMContentLoaded", function () {
	var sidenav = document.querySelectorAll(".sidenav");
	M.Sidenav.init(sidenav, {
		edge: "left",
		draggable: true,
	});
});

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

