import * as app from "../app.js"

export default new app.Command({
  name: "fight",
  description: "The fight command",
  channelType: "all",
  async run(message) {
    // todo: code here
    return message.send("fight command is not yet implemented.")
  },
})
