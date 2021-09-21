export function startFight(fighters: [Fighter, Fighter]) {
  const ctx: FightContext = {
    elapsedTime: -1,
  }

  // game loop
  while (fighters.every((fighter) => fighter.stats.hp.value > 0)) {
    ctx.elapsedTime++

    const actions: Action[] = []

    for (const fighter of fighters) {
      if (fighter.canPlay(ctx)) {
        actions.push(fighter.getAction(ctx))
      }
    }

    for (const action of actions.sort((a, b) => a.priority - b.priority)) {
      action.run(ctx)
    }
  }
}

export class Fighter {
  public lastElapsedTime = 0

  constructor(
    public name: string,
    public stats: {
      hp: Stat
      speed: Stat
      luck: Stat
      strength: Stat
      energy: Stat
    }
  ) {}

  canPlay(ctx: FightContext): boolean {
    return (
      this.lastElapsedTime <
      ctx.elapsedTime + this.stats.speed.finalValue / this.stats.speed.value
    )
  }

  getAction(ctx: FightContext): Action {
    return new Action(1)
  }
}

export class Stat {
  public value: number

  constructor(
    public readonly initialValue: number,
    public readonly finalValue: number
  ) {
    this.value = initialValue
  }

  get factor(): number {
    return (
      this.value /
      (this.initialValue < this.finalValue
        ? this.finalValue
        : this.initialValue)
    )
  }

  get percents(): number {
    return this.factor * 100
  }
}

export class Action {
  constructor(public readonly priority: number) {}

  run(ctx: FightContext) {}
}

export interface FightContext {
  elapsedTime: number
}
