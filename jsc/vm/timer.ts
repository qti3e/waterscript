class Timer {
  private timeout = -1;
  private currentStart = 0;

  check(): void {
    if (this.timeout < 0) return;

    if (Date.now() - this.currentStart > this.timeout)
      throw new Error("Timeout");
  }

  start(timeout: number): void {
    this.currentStart = Date.now();
    this.timeout = timeout;
  }
}

export const timer = new Timer();
