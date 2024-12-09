/* istanbul ignore next */
import EventEmitter from "node:events";

export async function sleep(ms: number): Promise<any> {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

export interface Deferred<T = any> {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  promise: Promise<T>;
}

export function createDeferred<T = any>(noUncaught?: boolean): Deferred<T> {
  const dfd: any = {};
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  /* istanbul ignore next */
  if (noUncaught) {
    // eslint-disable-line
    dfd.promise.catch(() => {});
  }
  return dfd;
}

export async function expectEvent<T = any>(
  emitter: EventEmitter,
  name: string | symbol,
): Promise<T> {
  return await new Promise<T>((resolve) => {
    emitter.once(name, resolve);
  });
}

export function getCurrentDateYYYYMMDD() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}
