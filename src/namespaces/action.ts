import * as fight from "./fight"

export abstract class Action {
  abstract priority: number

  constructor(public readonly owner: fight.Fighter) {}

  abstract run(ctx: fight.FightContext): boolean // success?
}

export class Debuff extends Action {
  priority = -1

  run(ctx: fight.FightContext): boolean {
    return true
  }
}

/**
 * bloque 50% des dégats de la prochaine attaque adverse
 */
export class Block extends Action {
  priority = 1

  run(ctx: fight.FightContext): boolean {
    const enemy = ctx.enemyOf(this.owner)

    enemy.stats.strength.value =
      enemy.stats.strength.value <= 1
        ? 0
        : Math.round(enemy.stats.strength.value * 0.5)

    ctx.log(
      this.owner,
      `${this.owner} reduces the ${enemy}'s attack by \`50%\`. (\`${enemy.stats.strength}\` strength points left)`
    )

    return true
  }
}

/**
 * recupère autant d'energie qu'il a de force
 */
export class Sleep extends Action {
  priority = -1

  run(ctx: fight.FightContext): boolean {
    // partially rebuff
    for (const stat of this.owner.buffAbleStats)
      if (stat.factor > 1) stat.value++

    // increase energy by strength
    this.owner.stats.energy.value += this.owner.stats.strength.value

    // heal max 10% of hp (energy based)
    this.owner.stats.hp.value += Math.round(
      Math.min(this.owner.stats.energy.value, this.owner.stats.hp.value * 0.1)
    )

    // reset life if life is too high
    if (this.owner.stats.hp.factor > 1) this.owner.stats.hp.reset()

    ctx.log(this.owner, `${this.owner} rests and is partially cured by rest.`)

    return true
  }
}

export class Attack extends Action {
  priority = 0

  run(ctx: fight.FightContext): boolean {
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

    enemy.stats.hp.value -= damages

    ctx.log(
      this.owner,
      `${this.owner} deals \`${damages}\` damage to ${enemy}! (\`${enemy.stats.hp.value}%\` life points left)`
    )

    if (enemy.stats.hp.value > 0 && this.owner.stats.energy.value <= 0) {
      ctx.log(this.owner, `${this.owner} has exhausted his energy reserve.`)

      this.owner.ableToUseEnergy = false
    }

    return true
  }
}
