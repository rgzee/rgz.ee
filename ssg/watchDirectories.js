import { resolve, join } from "path";
import { existsSync, watch } from "fs";
import { readdir, lstat, access } from "fs/promises";
import { exec } from "child_process";

const THROTTLE_DELAY = 80;

const throttle = (fn, delay) => {
  let lastCalled = 0;
  return (...args) => {
    const now = new Date().getTime();
    if (now - lastCalled < delay) return;
    lastCalled = now;
    return fn(...args);
  };
};

const walk = async (dir, callback, pre = "") => {
  await readdir(dir).then((arr) =>
    Promise.all(
      arr.map((str) => {
        const abs = join(dir, str);
        return lstat(abs).then((stats) => {
          if (!stats.isDirectory()) return;
          callback(join(pre, str), abs, stats);
          return walk(abs, callback, join(pre, str));
        });
      })
    )
  );
};

const setup = async (dir, onChange) => {
  const output = {};

  try {
    output[dir] = watch(dir, { recursive: true }, onChange.bind(0, dir));
  } catch (err) {
    if (err.code !== "ERR_FEATURE_UNAVAILABLE_ON_PLATFORM") throw err;
    output[dir] = watch(dir, onChange.bind(0, dir));
    await walk(dir, (rel, abs) => {
      output[abs] = watch(abs, onChange.bind(0, abs));
    });
  }

  return output;
};

const watchDirectories = async ({
  directories,
  onChange,
  onListening = () => {},
  ignore = [],
  root = ".",
}) => {
  if (directories.length === 0) return;
  if (!onChange.bind) return;
  const cwd = resolve(".", root);
  const dirs = new Set(
    directories.map((str) => resolve(cwd, str)).filter(existsSync)
  );
  const ignores = ["node_modules/", "\\.git"]
    .concat(ignore || [])
    .map((x) => new RegExp(x, "i"));

  const watchers = new Map();

  for (const dir of dirs) {
    const output = await setup(
      dir,
      throttle(async (dir, type, fileName) => {
        const filePath = join(dir, fileName);
        if (ignores.some((x) => x.test(filePath))) return;

        try {
          await access(filePath);
          await onChange("change", filePath);
        } catch {
          await onChange("rename", filePath);
        }
      }, THROTTLE_DELAY)
    );
    for (const key in output) watchers.set(key, output[key]);
  }

  if (onListening.bind) onListening();
  return watchers;
};

export default watchDirectories;
