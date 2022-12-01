FROM node:16.10.0

WORKDIR /

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=8081

# HTTP Server Port
EXPOSE 8080

# UDP Datagram Server Port
EXPOSE 8080/udp

# Start Broker Server
CMD [ "npm", "run", "controller" ]