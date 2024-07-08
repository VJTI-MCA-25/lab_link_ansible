async function fetchWithHttpErrorHandling(url, options) {
	const response = await fetch(url, options);
	if (!response.ok) {
		throw { status: response.status, statusText: response.statusText };
	}
	return response.json();
}

async function pingHosts() {
	let data = await fetchWithHttpErrorHandling("/api/ping");
	return data;
}

async function getHostDetails(hostId) {
	let data = await fetchWithHttpErrorHandling(`/api/host/${hostId}`);
	return data;
}

async function shutdownHost(hostId) {
	let url = hostId ? `/api/shutdown/${hostId}` : "/api/shutdown";
	let data = await fetchWithHttpErrorHandling(url);
	return data;
}

async function getApplications(hostId) {
	let url = hostId ? `/api/applications/${hostId}` : "/api/applications";
	let data = await fetchWithHttpErrorHandling(url);
	return data;
}

export { pingHosts, getHostDetails, shutdownHost, getApplications };

