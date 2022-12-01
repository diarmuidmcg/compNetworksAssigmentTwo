import dgram from "node:dgram";

import config from "./config.js";
import * as readline from "readline";

import fs from "fs";
var files = fs.readdirSync("./filesToReturn");

console.log("creating receiver");
// creating a receiver socket
const receiver = dgram.createSocket("udp4");
let receiverId;
let forwarderPort;

// Setup readline functionalities
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
// var for how many file reqs sent at once, used to prompt user input again
let fileReturned;
function readForwardLineAsync(message) {
  return new Promise((resolve, reject) => {
    rl.question(message, (answer) => {
      const underCaseAnswer = answer.toLowerCase();

      // exit process if exit
      if (underCaseAnswer == "exit") sendCloseDownMessage();
      else {
        forwarderPort = underCaseAnswer;
        handleRecIdJoiner(
          "What id will you accept?\nProper format is DD:AA:AA\n\n"
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
function readRecIdLineAsync(message) {
  return new Promise((resolve, reject) => {
    rl.question(message, (answer) => {
      const underCaseAnswer = answer.toLowerCase();

      // exit process if exit
      if (underCaseAnswer == "exit") sendCloseDownMessage();
      else {
        receiverId = underCaseAnswer;
        sendSetUpMessage(fileReturned);
        handleRecIdJoiner("\ntype 'exit' to quit\n");
      }
      // send init msg
      resolve(answer);
    });
  });
}
async function handleRecIdJoiner(msg) {
  await readRecIdLineAsync(msg);
}
// initial ask for user input
handleForwardJoiner("What forwarder are you a member of?\n\n");

receiver.on("message", (msg, info) => {
  console.log("Data received from server : " + msg.toString());
});

function sendSetUpMessage(fileToReturn) {
  // create header
  const header = new Uint8Array(1);
  // since receiver setup, first header byte is 0
  header[0] = 0;
  const data = Buffer.from(header);
  const payload = Buffer.from(JSON.stringify(receiverId));
  //sending msg
  receiver.send([data, payload], forwarderPort, config.serverHost, (error) => {
    if (error) {
      console.log(error);
      receiver.close();
    } else {
      console.log(
        "single msg sent to ingress from ",
        config.serverHost,
        config.port
      );
    }
  });
}

function sendCloseDownMessage(fileToReturn) {
  // create header
  const header = new Uint8Array(2);
  // since receiver close down, first header byte is 1
  header[0] = 1;
  const data = Buffer.from(header);
  console.log("sending close down receiver");

  //sending msg
  receiver.send(data, config.port, config.serverHost, (error) => {
    if (error) {
      console.log(error);
      receiver.close();
    } else {
      console.log(
        "single msg sent to forwarder from ",
        config.serverHost,
        config.port
      );
      receiver.close();
      process.exit();
    }
  });
}

receiver.on("message", (msg, info) => {
  console.log("Data received from server : " + msg.toString());
  console.log("data coming from " + info.port);
  const payload = new TextDecoder().decode(msg);
  const genMsg = payload.toString();
});
