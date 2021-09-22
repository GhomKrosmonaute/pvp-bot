import * as app from "../app.js"

export default new app.Command({
  name: "fight",
  description: "The fight command",
  channelType: "all",
  async run(message) {
    const fightResult = app.startFight([
      new app.Fighter("Billy", {
        hp: new app.Stat(100),
        slowness: new app.Stat(3),
        energy: new app.Stat(20),
        luck: new app.Stat(10, 100),
        strength: new app.Stat(3),
      }),
      new app.Fighter("Bob", {
        hp: new app.Stat(100),
        slowness: new app.Stat(4),
        energy: new app.Stat(20),
        luck: new app.Stat(15, 100),
        strength: new app.Stat(4),
      }),
    ])

    return message.send(
      `Winner: **${fightResult.winner}**\n${fightResult.logs
        .map((log) => log.message)
        .join("\n")}`
    )
  },
})
