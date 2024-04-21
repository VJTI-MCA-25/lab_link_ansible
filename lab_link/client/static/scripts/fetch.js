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

async function getHostDetails(host_id) {
	let data = await fetchWithHttpErrorHandling(`/api/host/${host_id}`);
	return data;
}

async function shutdownHost(host_id) {
	let url = host_id ? `/api/shutdown/${host_id}` : "/api/shutdown";
	let data = await fetchWithHttpErrorHandling(url);
	return data;
}

export { pingHosts, getHostDetails, shutdownHost };

