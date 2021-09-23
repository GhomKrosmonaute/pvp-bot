export interface FrozenStat {
  initial: number
  max: number
  value: number
}

export interface StatData {
  initial: number
  max: number
}

export class Stat {
  public value: number

  constructor(
    public readonly initial: number,
    public readonly max = initial,
    public readonly buffAble = false
  ) {
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

  toString(): string {
    return String(this.value)
  }
}

export class Luck extends Stat {
  constructor(value: number) {
    super(value, 100, true)
  }
}
export class Speed extends Stat {
  constructor(value: number) {
    super(value, 10, true)
  }
}
export class HP extends Stat {
  constructor() {
    super(100, 100, false)
  }
}
