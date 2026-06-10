package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

type helloResponse struct {
	Message  string `json:"message"`
	Instance string `json:"instance"`
}

func main() {
	hostname, _ := os.Hostname()

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(helloResponse{
			Message:  "hello from go on rune",
			Instance: hostname,
		})
	})

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	addr := ":8080"
	log.Printf("listening on %s (instance %s)", addr, hostname)
	log.Fatal(http.ListenAndServe(addr, mux))
}
