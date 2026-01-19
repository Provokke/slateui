#!/usr/bin/env node
import { run } from "./cli.js";

run(process.argv).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  },
);
