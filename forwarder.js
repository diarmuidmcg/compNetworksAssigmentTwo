import dgram from "node:dgram";

import config from "./config.js";

// --------------------creating a udp forwarder --------------------

// creating a udp forwarder
const forwarder = dgram.createSocket("udp4");

let receivers = [];

// emits when any error occurs
forwarder.on("error", (error) => {
  console.log("udp_forwarder", "error", error);
  forwarder.close();
});

// emits on new datagram msg
forwarder.on("message", (msg, info) => {
  // check header for where it's going
  const headerByteOne = msg[0];
  // check if destination in forwards
  let targetForward = receivers.filter((item) => item.port === headerByteOne);

  // create header
  const header = new Uint8Array(3);
  // define destination port
  let destinationPort;

  // if it exists locally, forward it
  if (targetForward[0]) {
    // set header
    header[0] = 6;
    // set destination to forwarder
    destinationPort = targetForward[0].port;
  }
  // if not in table, ask controller
  else {
    // set header
    header[0] = 7;
    // set destination to controller
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
}); // end forwarder.on

//emits when socket is ready and listening for datagram msgs
forwarder.on("listening", () => {
  const address = forwarder.address();
  const port = address.port;
  const family = address.family;
  const ipaddr = address.address;

  console.log(
    "udp_forwarder",
    "info",
    "forwarder is listening at port " + port
  );
  console.log("udp_forwarder", "info", "forwarder ip :" + ipaddr);
  console.log("udp_forwarder", "info", "forwarder is IP4/IP6 : " + family);
});

//emits after the socket is closed using socket.close()
forwarder.on("close", () => {
  console.log("udp_forwarder", "info", "Socket is closed !");
});

forwarder.bind(config.port);
