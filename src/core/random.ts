/**
 * Seedable PRNG (Linear Congruential Generator)
 * Produces deterministic sequences for reproducible debugging/testing.
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0x100000000
  }
}
