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
	return { data, isCached };
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
	url.searchParams.append("limit", 100);
	const { data } = await fetchWithHttpErrorHandling(url);
	return data;
}

export { pingHosts, getHostDetails, shutdownHost, getApplications, searchPackage };

