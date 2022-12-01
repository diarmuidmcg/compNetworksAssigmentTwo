import dgram from "node:dgram";
import Receiver from "./Objects/Receiver.js";
import Forwarder from "./Objects/Forwarder.js";

import config from "./config.js";
import * as readline from "readline";

// --------------------creating a udp forwarder --------------------

// creating a udp forwarder
const forwarder = dgram.createSocket("udp4");
let forwarderPort;

let clients = [];

// Setup readline functionalities
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
// va
let thisForwarder;
function readForwardLineAsync(message) {
  return new Promise((resolve, reject) => {
    rl.question(message, (answer) => {
      const underCaseAnswer = answer.toLowerCase();

      // exit process if exit
      if (underCaseAnswer == "exit") sendCloseDownMessage();
      else {
        forwarderPort = underCaseAnswer;

        forwarder.bind(forwarderPort);
        handleForwardJoiner("\ntype 'exit' to quit\n");
      }
      // send init msg
      resolve(answer);
    });
  });
}
async function handleForwardJoiner(msg) {
  await readForwardLineAsync(msg);
}
// initial ask for user input
handleForwardJoiner("What port would you like to use?\n\n");

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
  // if the header is a client or forwarder, try to route it
  if (headerByteOne == 9 || headerByteOne == 10) {
    const payload = new TextDecoder().decode(msg);
    const genMsg = payload.toString();
    const destination = genMsg.slice(1).replace(/['"]+/g, "");
    let searchReceiverId;
    // if client sending
    if (headerByteOne == 9) {
      console.log("requested destination " + destination);
      clients.push({
        port: info.port,
        destination: destination,
        message: "messageForDest",
      });
      searchReceiverId = destination;
    }
    // if forwarder sending
    else {
      const ports = destination.split(",");

      searchReceiverId = ports[1].replace(",", "");
    }

    // check if destination in forwards
    let result = thisForwarder.getReceiver(searchReceiverId);
    console.log("result is " + result);
    // create header
    const header = new Uint8Array(1);
    // define destination port
    let destinationPort;
    let payloadForNextRequest;
    // if it exists locally, forward it
    if (result) {
      console.log("exists locally");

      sendMessageToClientFound(destination, result);
    }
    // if not in table, ask controller
    else {
      // if coming from client, ask controller
      if (headerByteOne == 9) {
        console.log("does not exist locally");
        // since forwarder asking controller, first header byte is 4
        header[0] = 4;
        // set destination to controller
        destinationPort = config.controller_port;
        // client details will always be client Port then destinationId
        const clientDetails = info.port + "," + destination;
        // set payload to requested destination
        const data = Buffer.from(header);
        payloadForNextRequest = [data, clientDetails];
      }
      // if coming from forwarder, there was mistake, just kill request
      else {
        // set header to 6 to imitate controller returning no data
        header[0] = 6;
        // set destination to forwarder
        destinationPort = info.port;
        // set payload to requested destination
        const data = Buffer.from(header);
        payloadForNextRequest = [data, destination];
      }
      forwarder.send(
        payloadForNextRequest,
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
    thisForwarder.removeReceiverByPort(info.port);
    // receivers = receivers.filter((item) => item.port !== info.port);
    // tell controller
    updateControllerOnReceiver();
  }
  // if controller returns w data
  else if (headerByteOne == 5) {
    const payload = new TextDecoder().decode(msg);
    const genMsg = payload.toString();
    const destinationData = genMsg.slice(1).replace(/['"]+/g, "");
    console.log("destinationData is " + destinationData);

    // forward to next forwarder
    forwardMessageToForwarder("this message", destinationData);
  }
  // if controller returns without data
  else if (headerByteOne == 6) {
    const payload = new TextDecoder().decode(msg);
    const genMsg = payload.toString();
    const destinationData = genMsg.slice(1).replace(/['"]+/g, "");
    console.log("destinationData is " + destinationData);
    // break up clientDetails to client Port & destinationId
    const ports = destinationData.split(",");
    const clientPort = ports[0].replace(",", "");
    const destinationId = ports[1].replace(",", "");
    // get client
    let client = clients.filter((item) => item.destination === destinationId);
    // remove client from clients list
    clients = clients.filter((item) => item.destination === destinationId);
    // msg client saying not valid destination
    sendMessageToClientCouldNotFind(destinationData, clientPort);
  }
  console.log("receivers are " + JSON.stringify(thisForwarder));
}); // end forwarder.on

//emits when socket is ready and listening for datagram msgs
forwarder.on("listening", () => {
  const address = forwarder.address();
  const port = address.port;
  const family = address.family;
  const ipaddr = address.address;

  thisForwarder = new Forwarder({
    port: address.port,
    address: address.address,
  });

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

function sendMessageToClientCouldNotFind(destinationRequested, clientPort) {
  console.log("sending to client " + clientPort);
  // create header
  const header = new Uint8Array(1);
  // since forwarder could not find destination, first header byte is 8
  header[0] = 8;
  const data = Buffer.from(header);
  const message = "the detination " + destinationRequested + " is not valid";
  //sending msg
  forwarder.send(
    [data, message],
    clientPort.replace(/\W/g, "").trim(),
    config.serverHost,
    (error) => {
      if (error) {
        console.log(error);
        forwarder.close();
      } else {
        console.log(
          "single msg sent to forwarder from ",
          config.serverHost,
          config.port
        );
      }
    }
  );
}
function sendMessageToClientFound(destinationRequested, clientPort) {
  console.log("sending to client " + clientPort);
  // create header
  const header = new Uint8Array(1);
  // since forwarder could not find destination, first header byte is 8
  header[0] = 2;
  const data = Buffer.from(header);
  const message = "theres a message for you!";
  //sending msg
  forwarder.send(
    [data, Buffer.from(JSON.stringify(message))],
    clientPort,
    config.serverHost,
    (error) => {
      if (error) {
        console.log(error);
        forwarder.close();
      } else {
        console.log(
          "single msg sent to forwarder from ",
          config.serverHost,
          config.port
        );
      }
    }
  );
}
function forwardMessageToForwarder(destination, destinationData) {
  console.log("forwader to forwarder ");
  // break up clientDetails to client Port & destinationId
  const ports = destinationData.split(",");
  const forwarderPort = ports[2].replace(",", "").replace(/\W/g, "").trim();
  // create header
  const header = new Uint8Array(1);
  // since forwarder to forwarder, first header byte is 10
  header[0] = 10;
  const data = Buffer.from(header);
  //sending msg
  forwarder.send(
    [data, destinationData],
    forwarderPort,
    config.serverHost,
    (error) => {
      if (error) {
        console.log(error);
        forwarder.close();
      } else {
        console.log(
          "single msg sent to forwarder from ",
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
