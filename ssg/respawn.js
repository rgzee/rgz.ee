import { parse, resolve } from "path";
import { spawn } from "child_process";
import watchDirectories from "./watchDirectories.js";
import logger from "./logger.js";

(async () => {
  const [_node, _respawn, program, ...directories] = process.argv;

  const log = logger("respawn");
  let nodeServer = null;
  let counter = 0;

  const reload = () => {
    log(counter++);
    if (nodeServer) nodeServer.kill("SIGTERM");
    const ext = parse(program).ext;
    const tsm = ext === ".ts" ? ["-r", "tsm", program] : [];
    nodeServer = spawn("node", [...tsm, program], {
      stdio: [process.stdin, process.stdout, process.stderr],
    });
  };

  await watchDirectories({
    directories,
    onChange: reload,
    onListening: () =>
      log(
        `watching ${directories.map((x) =>
          resolve(x)
        )} and respawning ${program}`
      ),
  });
  reload();
})();
