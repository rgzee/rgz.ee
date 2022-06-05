const { readdir, lstat } = require("node:fs/promises");
const { join, resolve, extname } = require("path");

const joinPath = (dir) => (file) => join(dir, file);

const isDirectory = async (filepath) => (await lstat(filepath)).isDirectory();

const walkFile = (ignores) => async (filepath) =>
  (await isDirectory(filepath))
    ? await walkDirectory(ignores)(filepath)
    : [filepath];

const walkDirectory = (ignores) => async (dir) => {
  if (ignores.some((x) => x.test(dir))) return Promise.all([]);
  return Promise.all(
    (await readdir(dir)).map(joinPath(dir)).map(walkFile(ignores))
  );
};
const flattenDeep = (xs) =>
  flatten(xs.map((x) => (Array.isArray(x) ? flattenDeep(x) : [x])));
const flatten = (xs) => [].concat(...xs);

const listFiles = async (dirs, ignore) => {
  const ignores = ["node_modules"]
    .concat(ignore || [])
    .map((x) => new RegExp(x, "i"));
  return flattenDeep(
    await Promise.all(dirs.map((dir) => walkDirectory(ignores)(dir)))
  );
};

(async (ROOT) => {
  const toGroups = (groups, file) => {
    if (extname(file) === ".html")
      return { ...groups, html: [...groups.html, file] };
    if (extname(file) === ".md") return { ...groups, md: [...groups.md, file] };
    return { ...groups, rest: [...groups.rest, file] };
  };

  const typeFiles = (x) => ({ filePath: x, type: extname(x) });

  const files = await listFiles([ROOT], [".git"]);
  const filesTyped = files.reduce(toGroups, { html: [], md: [], rest: [] });
  console.log("+", filesTyped.html.length);
  console.log("+", filesTyped.md.length);
  console.log("+", filesTyped.rest.length);
  console.log(
    "=",
    filesTyped.html.length + filesTyped.md.length + filesTyped.rest.length
  );
  console.log("=", files.length);
})(resolve(process.argv[2]));
