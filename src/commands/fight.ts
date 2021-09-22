import * as app from "../app.js"
import mapValues from "lodash/mapValues.js"

export default new app.Command({
  name: "fight",
  description: "The fight command",
  channelType: "all",
  positional: [
    {
      name: "user",
      required: true,
      description: "User to fight",
      castValue: "user+",
    },
  ],
  async run(message) {
    const fightResult = app.startFight([
      new app.Fighter(message.author, {
        hp: new app.Stat(100),
        slowness: new app.Stat(3),
        energy: new app.Stat(20),
        luck: new app.Stat(10, 100),
        strength: new app.Stat(3),
      }),
      new app.Fighter(message.args.user, {
        hp: new app.Stat(100),
        slowness: new app.Stat(4),
        energy: new app.Stat(20),
        luck: new app.Stat(15, 100),
        strength: new app.Stat(4),
      }),
    ])

    const success = fightResult.winner === message.author

    const p1 = message.author.username
    const p2 = message.args.user.username

    return new app.Paginator({
      channel: message.channel,
      filter: (reaction, user) =>
        user === message.author || user === message.args.user,
      idleTime: 60000 * 5,
      pageCount: fightResult.logs.length + 2,
      placeHolder: new app.MessageEmbed()
        .setColor("RED")
        .setTitle("Oops... Paginator is void!"),
      pages: [
        new app.MessageEmbed()
          .setColor("BLURPLE")
          .setTitle(`Fight: ${p1} VS ${p2}`)
          .addField(p1, `...`, true)
          .addField(p2, `...`, true),
        ...fightResult.logs.map((log, i) =>
          new app.MessageEmbed()
            .setColor("BLURPLE")
            .setTitle(`Round ${i + 1} of the fight against ${p2}`)
            .setDescription(log.message)
            .addField(
              p1,
              app.code.stringify({
                lang: "json",
                content: JSON.stringify(
                  mapValues(log.ctx.fighters[0].stats, (stat) => stat.value),
                  null,
                  2
                ),
              }),
              true
            )
            .addField(
              p2,
              app.code.stringify({
                lang: "json",
                content: JSON.stringify(
                  mapValues(log.ctx.fighters[1].stats, (stat) => stat.value),
                  null,
                  2
                ),
              }),
              true
            )
        ),
        new app.MessageEmbed()
          .setColor(success ? "GREEN" : "RED")
          .setTitle(`Result: You ${success ? "win!" : "lose..."}`),
      ],
    })
  },
})
