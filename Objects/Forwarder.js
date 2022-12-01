import Receiver from "./Receiver.js";

export default class Forwarder {
  receivers = [];

  constructor({ port = 0, address = 0, arrayOfReceivers = null }) {
    this.port = port;
    this.address = address;
    if (arrayOfReceivers) {
      let elReceivers = JSON.parse(arrayOfReceivers);
      for (let i = 0; i < elReceivers.length; i++) {
        let newReceiver = new Receiver(
          elReceivers[i]["port"],
          elReceivers[i]["address"],
          elReceivers[i]["id"]
        );
        this.receivers.push(newReceiver);
      }
    }
  }

  addReceiver(receiver) {
    this.receivers.push(receiver);
  }

  removeReceiverByPort(receiverPort) {
    for (let i = 0; i < this.receivers.length; i++) {
      if (this.receivers[i].port == receiverPort) {
        this.receivers.remove(this.receivers[i]);
      }
    }
  }

  searchForReceiver(idInQuestion) {
    console.log("searching for " + idInQuestion);
    for (let i = 0; i < this.receivers.length; i++) {
      const currentId = this.receivers[i].id.replace(/\W/g, "").trim();
      console.log("currentId is " + currentId);
      if (
        JSON.stringify(currentId) ==
        JSON.stringify(idInQuestion.replace(/\W/g, "").trim())
      ) {
        console.log("found it!");
        return this.port;
      } else {
        console.log("dont agree");
        console.log(JSON.stringify(currentId) + "!");
        console.log(
          JSON.stringify(idInQuestion.replace(/\W/g, "").trim() + "!")
        );
      }
    }
  }
  getReceiver(idInQuestion) {
    console.log("searching for " + idInQuestion);
    for (let i = 0; i < this.receivers.length; i++) {
      const currentId = this.receivers[i].id.replace(/\W/g, "").trim();
      console.log("currentId is " + currentId);
      if (
        JSON.stringify(currentId) ==
        JSON.stringify(idInQuestion.replace(/\W/g, "").trim())
      ) {
        console.log("found it!");
        return this.receivers[i].port;
      } else {
        console.log("dont agree");
        console.log(JSON.stringify(currentId) + "!");
        console.log(
          JSON.stringify(idInQuestion.replace(/\W/g, "").trim() + "!")
        );
      }
    }
  }
}
