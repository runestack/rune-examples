# Build
FROM golang:1.23-alpine AS build
WORKDIR /build
COPY go.mod .
COPY main.go .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o hello .

# Run — static binary, distroless-style scratch image
FROM scratch
COPY --from=build /build/hello /hello
USER 1000
EXPOSE 8080
ENTRYPOINT ["/hello"]
