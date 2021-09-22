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
    log(fighter: FrozenFighter, message: string) {
      this.logs.push({
        fighter,
        message,
        time: Date.now(),
        ctx: this.freeze(),
      })
    },
  }

  // game loop
  while (
    maxTicks > ctx.ticker &&
    fighters.every((fighter) => fighter.stats.hp.value > 0)
  ) {
    ctx.ticker++

    const actions: Action[] = []

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

  return { winner, logs: ctx.logs }
}

export class Fighter {
  public lastTick = 0
  public ableToUseEnergy = true

  constructor(
    public name: string,
    public stats: {
      hp: Stat
      slowness: Stat
      luck: Stat
      strength: Stat
      energy: Stat
    }
  ) {}

  canPlay(ctx: FightContext): boolean {
    return this.lastTick < ctx.ticker - this.stats.slowness.value
  }

  getAction(ctx: FightContext): Action {
    // get action related to fight context
    return new Attack(this)
  }

  freeze(): FrozenFighter {
    return {
      stats: {
        hp: this.stats.hp.freeze(),
        luck: this.stats.luck.freeze(),
        energy: this.stats.energy.freeze(),
        strength: this.stats.strength.freeze(),
        slowness: this.stats.slowness.freeze(),
      },
      ableToUseEnergy: this.ableToUseEnergy,
      lastTick: this.lastTick,
      name: this.name,
    }
  }

  toString(): string {
    return `**${this.name}**`
  }

  toJSON(): object {
    return this.freeze()
  }
}

export class Stat {
  public value: number

  constructor(public readonly initial: number, public readonly max = initial) {
    this.value = initial
  }

  get factor(): number {
    return this.value / this.max
  }

  get percents(): number {
    return Math.floor(this.factor * 100)
  }

  reset() {
    this.value = this.initial
  }

  freeze(): FrozenStat {
    return {
      initial: this.initial,
      value: this.value,
      max: this.max,
    }
  }
}

export class Luck extends Stat {}

export abstract class Action {
  abstract priority: number

  protected constructor(public readonly owner: Fighter) {}

  abstract run(ctx: FightContext): boolean // success?
}

export interface FrozenFighter {
  name: string
  stats: Record<keyof Fighter["stats"], FrozenStat>
  lastTick: number
  ableToUseEnergy: boolean
}

export interface FightContext {
  logs: FightLog[]
  ticker: number
  fighters: [Fighter, Fighter]
  enemyOf(fighter: Fighter): Fighter
  freeze(): FrozenFightContext
  log(fighter: FrozenFighter, message: string): void
}

export interface FrozenStat {
  initial: number
  max: number
  value: number
}

export interface FrozenFightContext {
  ticker: number
  fighters: [FrozenFighter, FrozenFighter]
}

export interface FightResult {
  winner: Fighter | null
  logs: FightLog[]
}

export interface FightLog {
  message: string
  fighter: FrozenFighter
  time: number
  ctx: FrozenFightContext
}

export class Attack extends Action {
  priority = 1

  constructor(owner: Fighter) {
    super(owner)
  }

  run(ctx: FightContext): boolean {
    if (!this.owner.ableToUseEnergy) {
      ctx.log(
        this.owner,
        `${this.owner} doesn't have enough energy to attack. (\`${this.owner.stats.energy.percents}%\` of full energy)`
      )

      return false
    }

    const enemy = ctx.enemyOf(this.owner)
    const critical = Math.random() < this.owner.stats.luck.factor
    const usedEnergy = Math.ceil(Math.random() * this.owner.stats.energy.value)

    let damages = this.owner.stats.strength.value * usedEnergy

    if (critical) {
      ctx.log(
        this.owner,
        `${this.owner}'s next damages are doubled! (critical hit)`
      )

      damages *= 2
    }

    this.owner.stats.energy.value -= usedEnergy

    if (this.owner.stats.energy.value <= 0) {
      ctx.log(this.owner, `${this.owner} has exhausted his energy reserve.`)

      this.owner.ableToUseEnergy = false
    }

    enemy.stats.hp.value -= damages

    ctx.log(
      this.owner,
      `${this.owner} deals \`${damages}\` damage to ${enemy}! (\`${enemy.stats.hp.value}%\` life points left)`
    )

    return true
  }
}
