# Replace this directory with your application source and a Dockerfile.

Keep it minimal: one endpoint (plus a health endpoint) is enough. The app is
the boring part of an example — the Rune spec in ../deploy is what readers
came for.

Dockerfile guidelines:
- Multi-stage build; final image as small as practical.
- Non-root user when the base image supports it.
- EXPOSE the port your service spec declares.
