async function ping_hosts() {
    try {
        let response = await fetch('/api/ping')
        let data = await response.json()
        return data
    } catch (error) {
        console.error(error)
    }
}

export { ping_hosts };