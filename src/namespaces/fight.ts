import * as app from "../app.js"

export interface FrozenFightContext {
  ticker: number
  fighters: [FrozenFighter, FrozenFighter]
}

export interface FightResult {
  winner: app.User | null
  logs: FightLog[]
}

export interface FightLog {
  message: string
  fighter: FrozenFighter
  time: number
  ctx: FrozenFightContext
}

export interface FrozenFighter {
  userId: string
  stats: Record<keyof Fighter["stats"], app.FrozenStat>
  lastTick: number
  ableToUseEnergy: boolean
}

export interface FightContext {
  logs: FightLog[]
  ticker: number
  fighters: [Fighter, Fighter]
  enemyOf(fighter: Fighter): Fighter
  freeze(): FrozenFightContext
  log(fighter: Fighter, message: string): void
}

export type FighterData = Omit<FrozenFighter, "stats"> &
  Record<keyof Fighter["stats"], app.StatData>

export class Fighter {
  public lastTick = 0
  public ableToUseEnergy = true

  constructor(
    public user: app.User,
    public stats: {
      hp: app.Stat
      speed: app.Stat
      luck: app.Stat
      strength: app.Stat
      energy: app.Stat
    }
  ) {}

  get arrayStats(): app.Stat[] {
    return Object.values(this.stats)
  }

  get buffAbleStats(): app.Stat[] {
    return this.arrayStats.filter((stat) => stat.buffAble)
  }

  canPlay(ctx: FightContext): boolean {
    return this.lastTick < ctx.ticker - Math.max(1, 10 - this.stats.speed.value)
  }

  getAction(ctx: FightContext): app.Action {
    // get action related to fight context

    if (
      this.buffAbleStats.some((stat) => stat.factor < 1) &&
      Math.random() < 0.2
    ) {
      return new app.Debuff(this)
    }

    if (!this.ableToUseEnergy) {
      const random = Math.random()

      if (random > 0.5) {
        return new app.Sleep(this)
      } else {
        return new app.Block(this)
      }
    }

    return new app.Attack(this)
  }

  freeze(): FrozenFighter {
    return {
      stats: {
        hp: this.stats.hp.freeze(),
        luck: this.stats.luck.freeze(),
        energy: this.stats.energy.freeze(),
        strength: this.stats.strength.freeze(),
        speed: this.stats.speed.freeze(),
      },
      ableToUseEnergy: this.ableToUseEnergy,
      lastTick: this.lastTick,
      userId: this.user.id,
    }
  }

  toString(): string {
    return `**${this.user.username}**`
  }

  toJSON(): object {
    return this.freeze()
  }
}

export function startFight(
  fighters: [Fighter, Fighter],
  maxTicks = Infinity
): FightResult {
  const ctx: FightContext = {
    logs: [],
    ticker: -1,
    fighters,
    enemyOf(fighter: Fighter) {
      return this.fighters.find((f) => f !== fighter) as Fighter
    },
    freeze() {
      return {
        ticker: this.ticker,
        fighters: [this.fighters[0].freeze(), this.fighters[1].freeze()],
      }
    },
    log(fighter, message) {
      this.logs.push({
        message,
        time: Date.now(),
        ctx: this.freeze(),
        fighter: fighter.freeze(),
      })
    },
  }

  // game loop
  while (
    maxTicks > ctx.ticker &&
    fighters.every((fighter) => fighter.stats.hp.value > 0)
  ) {
    ctx.ticker++

    const actions: app.Action[] = []

    for (const fighter of fighters) {
      if (fighter.canPlay(ctx)) {
        actions.push(fighter.getAction(ctx))
      }

      if (
        !fighter.ableToUseEnergy &&
        fighter.stats.energy.value < fighter.stats.energy.max
      ) {
        fighter.stats.energy.value++

        if (fighter.stats.energy.value >= fighter.stats.energy.initial) {
          fighter.ableToUseEnergy = true
        }
      }
    }

    for (const action of actions.sort((a, b) => a.priority - b.priority)) {
      action.owner.lastTick = ctx.ticker
      action.run(ctx)
    }
  }

  let winner = fighters.find((fighter) => fighter.stats.hp.value > 0) ?? null

  return { winner: winner?.user ?? null, logs: ctx.logs }
}
