import dgram from "node:dgram";

import config from "./config.js";
import * as readline from "readline";

// creating a client socket
const client = dgram.createSocket("udp4");

// Setup readline functionalities
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let forwarderPort;
let receiverId;

function readForwardLineAsync(message) {
  return new Promise((resolve, reject) => {
    rl.question(message, (answer) => {
      const underCaseAnswer = answer.toLowerCase();

      // exit process if exit
      if (underCaseAnswer == "exit") console.log("quit");
      else {
        forwarderPort = underCaseAnswer;
        handleDestinationReq(
          "What are you looking for?\nProper format is DD:AA:AA\n\n"
        );

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
function readDestinationAsync(message) {
  return new Promise((resolve, reject) => {
    rl.question(message, (answer) => {
      const underCaseAnswer = answer.toLowerCase();

      // exit process if exit
      if (underCaseAnswer == "exit") console.log("quit");
      else {
        receiverId = underCaseAnswer;
        sendMessage(underCaseAnswer);
        handleDestinationReq("\ntype 'exit' to quit\n");
      }
      // send init msg
      resolve(answer);
    });
  });
}
async function handleDestinationReq(msg) {
  await readDestinationAsync(msg);
}
// initial ask for user input
handleForwardJoiner("What forwarder are you a member of?\n\n");

// sendSetUpMessage();

client.on("message", (msg, info) => {
  console.log("Data received from server : " + msg.toString());
  const payload = new TextDecoder().decode(msg);
  const genMsg = payload.toString();
});

function sendMessage(destinationId) {
  console.log("payload is ");
  // create header
  const header = new Uint8Array(1);
  // since client msg, first header byte is 9
  header[0] = 9;
  const data = Buffer.from(header);
  //sending msg
  client.send(
    [data, destinationId],
    forwarderPort,
    config.serverHost,
    (error) => {
      if (error) {
        console.log(error);
        client.close();
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
// function sendSetUpMessage() {
//   // create header
//   const header = new Uint8Array(2);
//   // since client setup, first header byte is 0
//   header[0] = 0;
//   // set second headerbyte to 0
//   header[1] = 0;
//   const data = Buffer.from(header);
//   //sending msg
//   client.send(data, config.port, config.serverHost, (error) => {
//     if (error) {
//       console.log(error);
//       client.close();
//     } else {
//       console.log(
//         "single msg sent to ingress from ",
//         config.serverHost,
//         config.port
//       );
//     }
//   });
// }
// function sendCloseDownMessage() {
//   // create header
//   const header = new Uint8Array(2);
//   // since client setup, first header byte is 0
//   header[0] = 4;
//   // set second headerbyte to 0
//   header[1] = 0;
//   const data = Buffer.from(header);
//   console.log("sending close down client");
//
//   //sending msg
//   client.send(data, config.port, config.serverHost, (error) => {
//     if (error) {
//       console.log(error);
//       client.close();
//     } else {
//       console.log(
//         "single msg sent to ingress from ",
//         config.serverHost,
//         config.port
//       );
//       client.close();
//       process.exit();
//     }
//   });
// }
