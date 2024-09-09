import { showMessage } from "./script.js";

async function fetchWithErrorHandler(url, options = {}) {
	const { params, includeSource, ...rest } = options;

	const urlObj = new URL(url, window.location.origin);
	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined) {
				urlObj.searchParams.append(key, value.toString());
			}
		});
	}
	url = urlObj.toString();

	const response = await fetch(url, rest);
	if (!response.ok) {
		showMessage(false, `Error: ${response.status} ${response.statusText}`);
		throw { status: response.status, statusText: response.statusText };
	}

	const data = await response.json();
	const dataSource = response.headers.get("X-Data-Source") || "DATABASE";
	showMessageBySource(dataSource);

	if (includeSource) {
		data.dataSource = dataSource;
	}

	return data;
}

function showMessageBySource(source) {
	let message = "";
	switch (source) {
		case "CACHE":
			message = "You are viewing a cached page. Press the Uncache & Refresh Button to get a new list.";
			break;
		case "DATABASE":
			message = "The Host was unreachable, you are viewing data saved previously from an earlier request.";
			break;
	}
	return showMessage(message);
}

async function pingHosts(uncached = false) {
	return fetchWithErrorHandler("/api/ping", { params: { uncached } });
}

async function getHostDetails(hostId, uncached = false) {
	return fetchWithErrorHandler(`/api/host/${hostId}`, { params: { uncached }, includeSource: true });
}

async function shutdownHost(hostId) {
	const url = hostId ? `/api/shutdown/${hostId}` : "/api/shutdown";
	return fetchWithErrorHandler(url);
}

async function getApplications(hostId, uncached = false) {
	if (hostId) {
		return fetchWithErrorHandler(`/api/applications/${hostId}`, { params: { uncached } });
	}

	return fetchWithErrorHandler("/api/applications/", { params: { uncached } });
}

async function uninstallPackages(hostId, list) {
	const url = hostId ? `/api/uninstall/${hostId}/` : "/api/uninstall/";
	return fetchWithErrorHandler(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": window.CSRF_TOKEN,
		},
		body: JSON.stringify({ app_list: list }),
	});
}

async function installPackages(hostId, list) {
	const url = hostId ? `/api/install/${hostId}/` : "/api/install/";
	return fetchWithErrorHandler(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": window.CSRF_TOKEN,
		},
		body: JSON.stringify({ app_list: list }),
	});
}

async function getLogs(hostId, uncached = false) {
	return fetchWithErrorHandler(`/api/logs/${hostId}`, {
		params: { uncached },
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": window.CSRF_TOKEN,
		},
	});
}

async function addHost(data) {
	return fetchWithErrorHandler("/api/add-host", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-CSRFToken": window.CSRF_TOKEN,
		},
		body: JSON.stringify(data),
	});
}

export {
	pingHosts,
	getHostDetails,
	shutdownHost,
	getApplications,
	uninstallPackages,
	installPackages,
	getLogs,
	addHost,
};

