export class IterLines {
  public position: number = 0;
  constructor(public text: string) {}

  next() {
    if (this.position >= this.text.length) {
      return undefined; // no more lines
    }

    const start = this.position;
    while (
      this.position < this.text.length &&
      this.text[this.position] !== "\n"
    ) {
      this.position++;
    }

    const line = this.text.slice(start, this.position);
    this.position++; // skip the newline character
    return line;
  }

  [Symbol.iterator](): Iterator<string> {
    let line: string | undefined = this.next()!;
    return {
      next: () => {
        const nextLine = this.next();
        const r = { value: line as string, done: nextLine === undefined };
        line = nextLine;
        return r;
      },
    };
  }
}
