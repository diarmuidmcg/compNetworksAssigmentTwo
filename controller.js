import dgram from "node:dgram";

import config from "./config.js";

// --------------------creating a udp controller --------------------

// creating a udp ingress
const controller = dgram.createSocket("udp4");

let forwarders = [];
let workers = [];

let availableClients = [0, 1, 2, 3, 4, 5, 6, 7];
let takenClients = [];

// emits when any error occurs
controller.on("error", (error) => {
  console.log("udp_controller", "error", error);
  controller.close();
});

// emits on new datagram msg
controller.on("message", (msg, info) => {
  // check header for where it's going
  const headerByteOne = msg[0];
  // check if destination in forwards
  let targetForward = forwarders.filter((item) => item.port === headerByteOne);

  // create header
  const header = new Uint8Array(3);
  // define destination port
  let destinationPort;

  // if it exists, forward it
  if (targetForward[0]) {
    // set header to 4 for 'controller to forwarder w data'
    header[0] = 4;
    // set destination to forwarder
    destinationPort = targetForward[0].port;
  }
  // if not in table, drop it & inform that it doesnt exist
  else {
    // set header to 5 for 'controller to forwarder withOUT data'
    header[0] = 5;
    // set destination to sender
    destinationPort = info.port;
  }

  const data = Buffer.from(header);
  controller.send(
    [data, info.payload],
    destinationPort,
    info.address,
    (error, bytes) => {
      if (error) {
        console.log("udp_controller", "error", error);
        controller.close();
      } else {
        console.log("udp_controller", "info", "Data forwarded");
      }
    }
  );
}); // end controller.on

//emits when socket is ready and listening for datagram msgs
controller.on("listening", () => {
  const address = ingress.address();
  const port = address.port;
  const family = address.family;
  const ipaddr = address.address;

  console.log(
    "udp_controller",
    "info",
    "controller is listening at port " + port
  );
  console.log("udp_controller", "info", "controller ip :" + ipaddr);
  console.log("udp_controller", "info", "controller is IP4/IP6 : " + family);
});

//emits after the socket is closed using socket.close()
controller.on("close", () => {
  console.log("udp_controller", "info", "Socket is closed !");
});

controller.bind(config.port);
