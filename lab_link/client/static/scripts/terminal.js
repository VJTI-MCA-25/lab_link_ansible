const terminal = new Terminal();
const fitAddon = new FitAddon.FitAddon();
const webLinksAddon = new WebLinksAddon.WebLinksAddon();
terminal.loadAddon(fitAddon);
terminal.loadAddon(webLinksAddon);

const openTerminalButton = document.querySelector(".open-terminal");
let terminalPrompt = "aashay@lab_link:~$ ";
let promptPosition = terminalPrompt.length;
let terminalWindow = null;

openTerminalButton.addEventListener("click", () => {
	if (terminalWindow && !terminalWindow.closed) {
		terminalWindow.focus();
	} else {
		terminalWindow = window.open("", "_blank", "width=800,height=600");

		terminalWindow.addEventListener("resize", () => {
			fitAddon.fit();
		});

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
		terminal.focus();
		terminal.write(terminalPrompt);

		terminal.onData((data) => {
			processUserInput(data);
		});
	}
});

function processUserInput(data) {
	switch (data) {
		case "\r": // Enter key
			terminal.write("\r\n" + terminalPrompt);
			promptPosition = terminal.buffer.active.cursorX;
			break;
		case "\u007F": // Backspace key
			// Only delete the character if the cursor is after the prompt
			if (terminal.buffer.active.cursorX > promptPosition) {
				terminal.write("\b \b");
			}
			break;
		default:
			terminal.write(data);
			break;
	}
}

