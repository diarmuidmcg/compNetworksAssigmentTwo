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
    let newForwarder = new Forwarder(info.port, info.address, withoutHeader);
    forwarders.push(newForwarder);
    // forwarders.push({
    //   port: info.port,
    //   address: info.address,
    //   receivers: withoutHeader,
    // });
  }
  // if header is 4, the forwarder is asking for a destination
  else if (headerByteOne == 4) {
    // identify the address & send it
    locateDestinationForForwarder(info);
  }
  // if header is 7, the forwarder is shutting down
  else if (headerByteOne == 7) {
    // remove forwarder from list
    forwarders = forwarders.filter((item) => item.port !== info.port);
  }

  console.log("forwarders are " + JSON.stringify(forwarders));
  // const data = Buffer.from(header);
  // controller.send(
  //   [data, info.payload],
  //   destinationPort,
  //   info.address,
  //   (error, bytes) => {
  //     if (error) {
  //       console.log("udp_controller", "error", error);
  //       controller.close();
  //     } else {
  //       console.log("udp_controller", "info", "Data forwarded");
  //     }
  //   }
  // );
}); // end controller.on

function locateDestinationForForwarder(info) {
  // create header
  const header = new Uint8Array(2);
  // find address

  // if found, set header to 5
  header[0] = 5;
  // if not found, set header to 6
  header[0] = 6;
  const data = Buffer.from(header);

  let payload;
  // if found, payload is header AND address
  payload = [data, "44:44:44"];
  // else
  payload = data;

  //sending msg
  controller.send(payload, info.port, info.serverHost, (error) => {
    if (error) {
      console.log(error);
      controller.close();
    } else {
      console.log(
        "single msg sent to forwarder from ",
        conf.serverHost,
        conf.port
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
