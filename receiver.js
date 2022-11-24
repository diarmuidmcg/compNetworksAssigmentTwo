import dgram from "node:dgram";

import conf from "./config.js";
import * as readline from "readline";

import fs from "fs";
var files = fs.readdirSync("./filesToReturn");

console.log("creating receiver");
// creating a receiver socket
const receiver = dgram.createSocket("udp4");

// Setup readline functionalities
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
// var for how many file reqs sent at once, used to prompt user input again
let fileReturned;
function readLineAsync(message) {
  return new Promise((resolve, reject) => {
    rl.question(message, (answer) => {
      const underCaseAnswer = answer.toLowerCase();

      // exit process if exit
      if (underCaseAnswer == "exit") sendCloseDownMessage();
      else {
        // try to parse to be proper format
        if (false) {
          fileReturned = 0;
        } else {
          console.log("That is not valid input. try again\n");
          handleServerInput(
            "What id will you accept?\nProper format is DD:AA:AA"
          );
        }
        sendSetUpMessage(fileReturned);
        handleServerInput("\ntype 'exit' to quit\n");
      }
      // send init msg
      resolve(answer);
    });
  });
}
async function handleServerInput(msg) {
  await readLineAsync(msg);
}
// initial ask for user input
handleServerInput("What id will you accept?\nProper format is DD:AA:AA");

receiver.on("message", (msg, info) => {
  console.log("Data received from server : " + msg.toString());
  let particularFile;
  switch (fileReturned) {
    case 0:
      particularFile = "refunk.txt";
      break;
    case 1:
      particularFile = "weeve.txt";
      break;
    case 2:
      particularFile = "basic_pic.jpg";
      break;
    default:
  }
  const contents = fs.readFileSync(`./filesToReturn/${particularFile}`, {
    encoding: "base64",
  });
  sendFileMessage(msg, contents);
});

function sendSetUpMessage(fileToReturn) {
  // create header
  const header = new Uint8Array(2);
  // since receiver setup, first header byte is 0
  header[0] = 0;
  const data = Buffer.from(header);

  //sending msg
  receiver.send(data, conf.port, conf.serverHost, (error) => {
    if (error) {
      console.log(error);
      receiver.close();
    } else {
      console.log(
        "single msg sent to ingress from ",
        conf.serverHost,
        conf.port
      );
    }
  });
}
// function sendFileMessage(msg, file) {
  console.log("sending file ");
  console.log("client id is " + msg[2]);
  // create header
  const header = new Uint8Array(3);
  // since receiver returning file, first header byte is 3
  header[0] = 3;
  // set second headerbyte to file to be returned
  header[1] = fileReturned;
  header[2] = msg[2];
  const data = Buffer.from(header);

  //sending msg
  receiver.send([data, file], conf.port, conf.serverHost, (error) => {
    if (error) {
      console.log(error);
      receiver.close();
    } else {
      console.log(
        "single msg sent to ingress from ",
        conf.serverHost,
        conf.port
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
  receiver.send(data, conf.port, conf.serverHost, (error) => {
    if (error) {
      console.log(error);
      receiver.close();
    } else {
      console.log(
        "single msg sent to forwarder from ",
        conf.serverHost,
        conf.port
      );
      receiver.close();
      process.exit();
    }
  });
}