import dgram from "node:dgram";

import conf from "./config.js";
import * as readline from "readline";

// creating a client socket
const client = dgram.createSocket("udp4");

// Setup readline functionalities
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// var for how many file reqs sent at once, used to prompt user input again
let numberOfReqs;

function readLineAsync(message) {
  return new Promise((resolve, reject) => {
    rl.question(message, (answer) => {
      // exit process if exit
      if (answer == "exit") {
        sendCloseDownMessage();
      } else {
        // get all requests
        let requestedFiles = answer.split(" ");
        numberOfReqs = requestedFiles.length;
        // iterate thru & send to server
        for (let i = 0; i < numberOfReqs; i++) {
          let data = Buffer.from(requestedFiles[i]);
          sendMessage(data);
        }
      }
      resolve(answer);
    });
  });
}
async function handleServerInput() {
  await readLineAsync(
    "what would you like to query?\nLeave spaces between files to serve more than one\n"
  );
}
// initial ask for user input
handleServerInput();
sendSetUpMessage();

client.on("message", (msg, info) => {
  console.log("Data received from server : " + msg.toString());
  const payload = new TextDecoder().decode(msg);
  const genMsg = payload.toString();

  let buff = new Buffer.from(genMsg, "base64");
  let text = buff.toString("ascii");
  console.log("\nFile contents are\n" + text);

  // decrement since its been answered
  numberOfReqs--;
  // show input when everything answered
  if (numberOfReqs == 0) {
    console.log("\n");
    handleServerInput();
  }
});

function sendMessage(payload) {
  console.log("payload is ");
  // create header
  const header = new Uint8Array(2);
  // since client msg, first header byte is 9
  header[0] = 9;
  // set 3rd object to payload

  const data = Buffer.from(header);
  //sending msg
  client.send([data, payload], conf.port, conf.serverHost, (error) => {
    if (error) {
      console.log(error);
      client.close();
    } else {
      console.log(
        "single msg sent to forwarder from ",
        conf.serverHost,
        conf.port
      );
    }
  });
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
//   client.send(data, conf.port, conf.serverHost, (error) => {
//     if (error) {
//       console.log(error);
//       client.close();
//     } else {
//       console.log(
//         "single msg sent to ingress from ",
//         conf.serverHost,
//         conf.port
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
//   client.send(data, conf.port, conf.serverHost, (error) => {
//     if (error) {
//       console.log(error);
//       client.close();
//     } else {
//       console.log(
//         "single msg sent to ingress from ",
//         conf.serverHost,
//         conf.port
//       );
//       client.close();
//       process.exit();
//     }
//   });
// }
