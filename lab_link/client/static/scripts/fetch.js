async function pingHosts() {
	try {
		let response = await fetch("/api/ping");
		let data = await response.json();
		return data;
	} catch (error) {
		console.error(error);
	}
}

async function getHostDetails(host_id) {
	try {
		let response = await fetch(`/api/host/${host_id}`);
		let data = await response.json();
		return data;
	} catch (error) {
		console.error(error);
	}
}

export { pingHosts, getHostDetails };

