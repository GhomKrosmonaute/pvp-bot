import chalk from "chalk"

export function startFight(
  fighters: [Fighter, Fighter],
  maxTicks = Infinity
): FightResult {
  const ctx: FightContext = {
    ticker: -1,
    fighters,
    enemyOf(fighter: Fighter): Fighter {
      return this.fighters.find((f) => f !== fighter) as Fighter
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

  return { winner }
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
    return new Attack(this)
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
}

export class Luck {}

export abstract class Action {
  abstract priority: number

  protected constructor(public readonly owner: Fighter) {}

  abstract run(ctx: FightContext): boolean // success?
}

export interface FightContext {
  ticker: number
  fighters: [Fighter, Fighter]
  enemyOf(fighter: Fighter): Fighter
}

export interface FightResult {
  winner: Fighter | null
}

export class Attack extends Action {
  priority = 1

  constructor(owner: Fighter) {
    super(owner)
  }

  run(ctx: FightContext): boolean {
    if (!this.owner.ableToUseEnergy) {
      console.log(
        `${this.owner.name} doesn't have enough energy to attack. (energy:`,
        this.owner.stats.energy.percents,
        "%)"
      )

      return false
    }

    const enemy = ctx.enemyOf(this.owner)
    const critical = Math.random() < this.owner.stats.luck.factor
    const usedEnergy = Math.ceil(Math.random() * this.owner.stats.energy.value)

    let damages = this.owner.stats.strength.value * usedEnergy

    if (critical) damages *= 2

    this.owner.stats.energy.value -= usedEnergy

    if (this.owner.stats.energy.value <= 0) this.owner.ableToUseEnergy = false

    enemy.stats.hp.value -= damages

    console.log(
      chalk[critical ? "red" : "blue"](
        `${this.owner.name} attack ${enemy.name} by`,
        damages,
        "at",
        ctx.ticker,
        "ticks. (life: ",
        enemy.stats.hp.percents,
        "%)"
      )
    )

    return true
  }
}
