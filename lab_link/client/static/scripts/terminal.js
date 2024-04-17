import { Terminal } from "https://cdn.jsdelivr.net/npm/xterm@5.3.0/+esm";
import { FitAddon } from "https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/+esm";
import { WebLinksAddon } from "https://cdn.jsdelivr.net/npm/xterm-addon-web-links@0.9.0/+esm";
import { AttachAddon } from "https://cdn.jsdelivr.net/npm/xterm-addon-attach@0.9.0/+esm";

const fitAddon = new FitAddon();
const webLinksAddon = new WebLinksAddon();

const uri = `ws://localhost:8000/ws/ssh/${hostId}/`;

const openTerminalButton = document.querySelector(".open-terminal");
let terminalWindow = null;

function createTerminalWindow() {
	const terminal = new Terminal();
	terminal.loadAddon(fitAddon);
	terminal.loadAddon(webLinksAddon);

	const websocket = new WebSocket(uri);
	websocket.onopen = () => {
		const attachAddon = new AttachAddon(websocket);
		terminal.loadAddon(attachAddon);
	};

	terminalWindow = window.open("", "_blank", "width=800,height=600");

	websocket.onerror = (error) => {
		console.error("WebSocket error: ", error);
		terminalWindow.close();
	};

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
		terminal.focus();
	});
}

openTerminalButton.addEventListener("click", () => {
	if (terminalWindow && !terminalWindow.closed) {
		terminalWindow.focus();
	} else {
		createTerminalWindow();
	}
});
