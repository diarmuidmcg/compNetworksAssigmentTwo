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

  searchForReceiver(idInQuestion) {
    for (let i = 0; i < receivers.length; i++) {
      if (receivers[i].id == idInQuestion) return this.address;
    }
  }
}
