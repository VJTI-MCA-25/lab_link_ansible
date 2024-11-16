import { Terminal } from "https://cdn.jsdelivr.net/npm/xterm@5.3.0/+esm";
import { FitAddon } from "https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/+esm";
import { WebLinksAddon } from "https://cdn.jsdelivr.net/npm/xterm-addon-web-links@0.9.0/+esm";
import { AttachAddon } from "https://cdn.jsdelivr.net/npm/xterm-addon-attach@0.9.0/+esm";

const fitAddon = new FitAddon();
const webLinksAddon = new WebLinksAddon();

const uri = `ws://localhost:8000/ws/ssh/${hostId}/`;

let terminalWindow = null;

function createTerminalWindow() {
	try {
		const terminal = new Terminal({
			disableStdin: false, // Ensures input is handled
			cursorBlink: true, // Optional: make cursor blink
		});
		terminal.loadAddon(fitAddon);
		terminal.loadAddon(webLinksAddon);

		const websocket = new WebSocket(uri);

		websocket.onmessage = (message) => {
			if (message.data.startsWith("Error")) {
				console.error("WebSocket error: ", message.data);
				modalAlert(
					"Something went wrong when establishing connection. Look at the console for more Information."
				);
				if (terminalWindow) terminalWindow.close();
			}
		};

		websocket.onopen = () => {
			const attachAddon = new AttachAddon(websocket);
			terminal.loadAddon(attachAddon);
			console.log("WebSocket connection opened.");
		};

		websocket.onclose = () => {
			console.log("WebSocket connection closed.");
			if (terminalWindow) terminalWindow.close();
			terminal.dispose();
			terminalWindow = null;
		};

		terminalWindow = window.open("", "_blank", "width=800,height=600");

		terminalWindow.addEventListener("resize", () => {
			fitAddon.fit();
		});

		terminalWindow.addEventListener("beforeunload", () => {
			websocket.close();
			terminal.reset();
			terminal.dispose();
			terminalWindow = null;
		});

		setupTerminalWindow(terminal);
	} catch (error) {
		console.error("Failed to initialize terminal: ", error);
		if (terminalWindow) terminalWindow.close();
	}
}

function setupTerminalWindow(terminal) {
	terminalWindow.document.title = "Terminal";
	terminalWindow.document.body.style.margin = "0";
	terminalWindow.document.body.style.backgroundColor = "#000";
	terminalWindow.document.body.style.height = "100%";
	terminalWindow.document.body.style.width = "100%";

	const link = terminalWindow.document.createElement("link");
	link.href = "https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css";
	link.rel = "stylesheet";
	terminalWindow.document.head.appendChild(link);

	const terminalContainer = terminalWindow.document.body;
	terminalContainer.id = "terminal";

	terminal.open(terminalContainer);

	terminalWindow.addEventListener("load", () => {
		fitAddon.fit(); // Use the fitAddon to resize the terminal
		terminal.focus();
	});

	// Prevent default behavior when terminal has focus to avoid double entry
	terminal.onKey(({ domEvent }) => {
		const printable = domEvent.key.length === 1;
		if (printable && !domEvent.ctrlKey && !domEvent.altKey && !domEvent.metaKey) {
			domEvent.preventDefault();
		}
	});
}

document.addEventListener("DOMContentLoaded", () => {
	document.querySelector(".open-terminal").addEventListener("click", () => {
		if (terminalWindow && !terminalWindow.closed) {
			terminalWindow.focus();
			return;
		} else {
			createTerminalWindow();
		}
	});
});

