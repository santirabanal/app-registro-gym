export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function round1(n) {
  return Math.round(n * 10) / 10;
}

export function epley(peso, reps) {
  return peso * (1 + reps / 30);
}
