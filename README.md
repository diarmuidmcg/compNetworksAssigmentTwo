## Usage

### Ingress

There's one ingress server

```
npm run ingress
```

### Dockerizing Ingress

Build an image from a Dockerfile and run in a new container

```
docker build .
```

Get the image id of the docker you just built

```
docker images
```

Run the image

```
docker run -i -p 8080:8080/udp [IMAGE_ID]
```

- -i parameter allows the user to **work with IO inside the Docker container** for Server Broadcasting
- -p parameter exposes the port 8080 for UDP use (see [Dockerfile](./Dockerfile))
- [IMAGE_ID] is the build ID that is run in the second command

> ![StartServer](./Misc/StartServer.png)

### Client

There can be many clients

```
npm run client
```

> ![StartClient](./Misc/StartClient.png)
> Starting the Client sends a message to the Server and the Server response with the current time
