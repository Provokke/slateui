import pc from "picocolors";

let silent = false;

export function setSilent(value: boolean) {
  silent = value;
}

export const logger = {
  info: (...args: unknown[]) => {
    if (!silent) console.log(...args);
  },
  success: (msg: string) => {
    if (!silent) console.log(pc.green("✔ ") + msg);
  },
  warn: (msg: string) => {
    if (!silent) console.warn(pc.yellow("! ") + msg);
  },
  error: (msg: string) => {
    console.error(pc.red("✖ ") + msg);
  },
  step: (msg: string) => {
    if (!silent) console.log(pc.cyan("› ") + msg);
  },
};

export class CliError extends Error {}
