import { showMessage } from "./script.js";

async function fetchWithHttpErrorHandling(url, options = {}) {
	const { uncached, ...rest } = options;

	if (uncached) {
		const urlObj = new URL(url, window.location.origin);
		urlObj.searchParams.append("uncached", "true");
		url = urlObj.toString();
	}

	const response = await fetch(url, rest);
	if (!response.ok) {
		throw { status: response.status, statusText: response.statusText };
	}
	const data = await response.json();
	const isCached = response.headers.get("X-Cache-Status") === "HIT";
	const isFromDb = response.headers.get("X-Db-Status") === "HIT";
	isFromDb
		? showMessage(isFromDb, "The Host was Unreachable, you are viewing data saved from earlier request.")
		: showMessage(isCached, "You are viewing a cached page. Use the Uncache & Refresh Button to get a new list.");
	return data;
}

async function pingHosts(uncached = false) {
	return await fetchWithHttpErrorHandling("/api/ping", { uncached });
}

async function getHostDetails(hostId, uncached = false) {
	return await fetchWithHttpErrorHandling(`/api/host/${hostId}`, { uncached });
}

async function shutdownHost(hostId) {
	const url = hostId ? `/api/shutdown/${hostId}` : "/api/shutdown";
	const { data } = await fetchWithHttpErrorHandling(url);
	return data;
}

async function getApplications(hostId, uncached = false) {
	const url = hostId ? `/api/applications/${hostId}` : "/api/applications";
	return await fetchWithHttpErrorHandling(url, { uncached });
}

async function searchPackage(query) {
	const url = new URL("/api/search-package", window.location.origin);
	url.searchParams.append("q", query);
	url.searchParams.append("limit", 10);
	return await fetchWithHttpErrorHandling(url);
}

export { pingHosts, getHostDetails, shutdownHost, getApplications, searchPackage };

