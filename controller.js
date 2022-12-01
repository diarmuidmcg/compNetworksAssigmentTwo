import dgram from "node:dgram";
import Forwarder from "./Objects/Forwarder.js";
import Receiver from "./Objects/Receiver.js";
import config from "./config.js";

// --------------------creating a udp controller --------------------

// creating a udp ingress
const controller = dgram.createSocket("udp4");

let forwarders = [];

// emits when any error occurs
controller.on("error", (error) => {
  console.log("udp_controller", "error", error);
  controller.close();
});

// emits on new datagram msg
controller.on("message", (msg, info) => {
  // check header for where it's going
  const headerByteOne = msg[0];
  console.log("header on  controller is " + headerByteOne);
  // if header is 3, the forwarder is updating the controller
  if (headerByteOne == 3) {
    const payload = new TextDecoder().decode(msg);
    const genMsg = payload.toString();
    const withoutHeader = genMsg.slice(1);
    console.log("receivers are " + withoutHeader);

    // if the forwarder exists, remove it
    forwarders = forwarders.filter((item) => item.port !== info.port);
    // if it doesnt, add it
    let newForwarder = new Forwarder({
      port: info.port,
      address: info.address,
      arrayOfReceivers: withoutHeader,
    });
    forwarders.push(newForwarder);
    // forwarders.push({
    //   port: info.port,
    //   address: info.address,
    //   receivers: withoutHeader,
    // });
  }
  // if header is 4, the forwarder is asking for a destination
  else if (headerByteOne == 4) {
    const payload = new TextDecoder().decode(msg);
    const genMsg = payload.toString();
    const destinationRequested = genMsg.slice(1);
    console.log("destination requested is " + destinationRequested);
    // identify the address & send it
    locateDestinationForForwarder(info, destinationRequested);
  }
  // if header is 7, the forwarder is shutting down
  else if (headerByteOne == 7) {
    // remove forwarder from list
    forwarders = forwarders.filter((item) => item.port !== info.port);
  }

  console.log("forwarders are " + JSON.stringify(forwarders));
}); // end controller.on

function locateDestinationForForwarder(info, destinationRequested) {
  // create header
  const header = new Uint8Array(2);
  // find address
  let port;
  // break up clientDetails to client Port & destinationId
  const ports = destinationRequested.split(",");
  const clientPort = ports[0].replace(",", "");
  const destinationId = ports[1].replace(",", "");
  for (let i = 0; i < forwarders.length; i++) {
    let result = forwarders[i].searchForReceiver(destinationId);
    if (result) port = result;
  }
  console.log("clientPort is " + clientPort);
  console.log("destinationId is " + destinationId);
  console.log("port is " + port);
  // if found, set header to 5
  if (port) header[0] = 5;
  // if not found, set header to 6
  else header[0] = 6;
  const data = Buffer.from(header);

  let payload;
  // if found, payload is header AND new forwarder address
  if (port) {
    const portResult = destinationRequested + "," + port;
    console.log("controller will send " + portResult);
    payload = [data, Buffer.from(JSON.stringify(portResult))];
  }
  // else payload is header & destination id
  else payload = [data, destinationRequested];

  //sending msg
  controller.send(payload, info.port, info.serverHost, (error) => {
    if (error) {
      console.log(error);
      controller.close();
    } else {
      console.log(
        "msg sent to forwarder " + info.port + " from " + config.port
      );
    }
  });
}

//emits when socket is ready and listening for datagram msgs
controller.on("listening", () => {
  const address = controller.address();
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

controller.bind(config.controller_port);
