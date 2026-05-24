# Build stage
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /mcp-filesystem ./cmd/mcp-filesystem/

# Runtime stage
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /mcp-filesystem .
EXPOSE 3003
ENTRYPOINT ["/app/mcp-filesystem"]
