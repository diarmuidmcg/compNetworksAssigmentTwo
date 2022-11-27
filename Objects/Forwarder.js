import Receiver from "./Receiver.js";

export default class Forwarder {
  receivers = [];
  constructor(port, address, arrayOfReceivers) {
    this.port = port;
    this.address = address;
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
