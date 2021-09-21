export function startFight(fighters: [Fighter, Fighter]) {
  let elapsedTime = 0
}

export class Fighter {
  constructor(
    public name: string,
    public stats: {
      hp: number
      speed: number
      luck: number
      strength: number
      energy: number
    }
  ) {}
}

export class Stat {
  public value: number

  constructor(
    public readonly initialValue: number,
    public readonly finalValue: number
  ) {
    this.value = initialValue
  }
}
