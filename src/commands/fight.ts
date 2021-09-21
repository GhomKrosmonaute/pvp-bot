import * as app from "../app.js"

export default new app.Command({
  name: "fight",
  description: "The fight command",
  channelType: "all",
  async run(message) {
    return message.send(
      app.code.stringify({
        lang: "json",
        format: true,
        content: JSON.stringify(
          app.startFight([
            new app.Fighter("Billy", {
              hp: new app.Stat(1000),
              slowness: new app.Stat(5),
              energy: new app.Stat(50),
              luck: new app.Stat(3),
              strength: new app.Stat(6),
            }),
            new app.Fighter("Bob", {
              hp: new app.Stat(1000),
              slowness: new app.Stat(4),
              energy: new app.Stat(50),
              luck: new app.Stat(4),
              strength: new app.Stat(5),
            }),
          ])
        ),
      })
    )
  },
})
