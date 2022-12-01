import dgram from "node:dgram";
import Receiver from "./Objects/Receiver.js";
import Forwarder from "./Objects/Forwarder.js";
import config from "./config.js";

// --------------------creating a udp forwarder --------------------

// creating a udp forwarder
const forwarder = dgram.createSocket("udp4");

// export default class Receiver {
//   constructor(port, address, id) {
//     this.port = port;
//     this.address = address;
//     this.id = id;
//   }
// }

let thisForwarder;

// emits when any error occurs
forwarder.on("error", (error) => {
  console.log("udp_forwarder", "error", error);
  forwarder.close();
});

// emits on new datagram msg
forwarder.on("message", (msg, info) => {
  // check header for where it's going
  const headerByteOne = msg[0];
  console.log("header on  forwarder is " + headerByteOne);
  // if the header is a client, try to route it
  if (headerByteOne == 9) {
    const payload = new TextDecoder().decode(msg);
    const genMsg = payload.toString();
    const destination = genMsg.slice(1);
    console.log("requested destination " + destination);
    // check if destination in forwards
    let result = thisForwarder.searchForReceiver(info.id);
    console.log("target forward is " + targetForward);
    // create header
    const header = new Uint8Array(3);
    // define destination port
    let destinationPort;

    // if it exists locally, forward it
    if (targetForward[0]) {
      console.log("exists locally");
      // set header
      header[0] = 6;
      // set destination to forwarder
      destinationPort = targetForward[0].port;
    }
    // if not in table, ask controller
    else {
      console.log("does not exist locally");
      // set header
      header[0] = 7;
      // set destination to controller
      destinationPort = info.port;
    }

    const data = Buffer.from(header);
    forwarder.send(
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
  }
  // if receiver being init, header is 0
  else if (headerByteOne == 0) {
    const payload = new TextDecoder().decode(msg);
    const genMsg = payload.toString();
    const withoutHeader = genMsg.slice(1);
    console.log("receiver is " + withoutHeader);
    const newReceiver = new Receiver(info.port, info.address, withoutHeader);
    // append to receiver array
    thisForwarder.addReceiver(newReceiver);
    // receivers.push({
    //   port: info.port,
    //   address: info.address,
    //   receiverId: withoutHeader,
    // });
    // tell controller
    updateControllerOnReceiver();
  }
  // if receiver is being stopped, header is 1
  else if (headerByteOne == 1) {
    // remove receiver by port number
    // receivers = receivers.filter((item) => item.port !== info.port);
    // tell controller
    updateControllerOnReceiver();
  }
  console.log("receivers are " + JSON.stringify(thisForwarder));
}); // end forwarder.on

//emits when socket is ready and listening for datagram msgs
forwarder.on("listening", () => {
  const address = forwarder.address();
  const port = address.port;
  const family = address.family;
  const ipaddr = address.address;

  thisForwarder = new Forwarder(address.port, address.addReceiver);

  updateControllerOnReceiver();

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
// console.log("receivers are " + JSON.stringify(receivers));
function updateControllerOnReceiver() {
  // create header
  const header = new Uint8Array(1);
  // since forwarder updating controller, first header byte is 3
  header[0] = 3;
  const data = Buffer.from(header);
  // console.log("receivers are " + JSON.stringify(receivers));
  let payload = Buffer.from(JSON.stringify(thisForwarder.receivers));
  // console.log("receivers are " + payload);
  //sending msg
  forwarder.send(
    [data, payload],
    config.controller_port,
    config.serverHost,
    (error) => {
      if (error) {
        console.log(error);
        forwarder.close();
      } else {
        console.log(
          "single msg sent to controller from ",
          config.serverHost,
          config.port
        );
      }
    }
  );
}

function sendCloseDownMessage(fileToReturn) {
  // create header
  const header = new Uint8Array(1);
  // since forwarder close down, first header byte is 7
  header[0] = 7;
  const data = Buffer.from(header);
  console.log("sending close down forwarder");

  //sending msg
  forwarder.send(data, config.controller_port, config.serverHost, (error) => {
    if (error) {
      console.log(error);
      forwarder.close();
    } else {
      console.log(
        "single msg sent to controller from ",
        config.serverHost,
        config.port
      );
      forwarder.close();
      process.exit();
    }
  });
}

forwarder.bind(config.port);
