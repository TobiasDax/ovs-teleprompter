// Command teleprompter serves the Teleprompter web app as a single,
// dependency-free binary: it embeds the static site, serves it over
// http://localhost, and opens the default browser.
package main

import (
	"embed"
	"fmt"
	"log"
	"net"
	"net/http"
	"os/exec"
	"runtime"
)

//go:embed index.html app.js mammoth.min.js purify.min.js
var staticFiles embed.FS

const defaultAddr = "127.0.0.1:3000"

func main() {
	listener, err := net.Listen("tcp", defaultAddr)
	if err != nil {
		// Default port is taken (e.g. by a dev server) - fall back to any free port.
		listener, err = net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			log.Fatalf("could not open a listening port: %v", err)
		}
	}

	url := fmt.Sprintf("http://%s/", listener.Addr().String())
	fmt.Printf("Teleprompter läuft auf %s (zum Beenden dieses Fenster schließen oder Strg+C drücken)\n", url)

	if err := openBrowser(url); err != nil {
		fmt.Printf("Browser konnte nicht automatisch geöffnet werden, bitte manuell aufrufen: %s\n", url)
	}

	log.Fatal(http.Serve(listener, http.FileServer(http.FS(staticFiles))))
}

// openBrowser opens url in the user's default browser, per OS.
func openBrowser(url string) error {
	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", url).Start()
	case "windows":
		return exec.Command("cmd", "/c", "start", "", url).Start()
	default: // linux, bsd, ...
		return exec.Command("xdg-open", url).Start()
	}
}
