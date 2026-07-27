import "vitest";

interface CustomMatchers<R = unknown> {
  toHaveJRefCount(expected: number): R;
}

declare module "vitest" {
  interface Assertion<T = unknown> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
