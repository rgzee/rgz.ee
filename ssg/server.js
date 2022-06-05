import http from "http";
import path from "path";
import { readFile } from "fs/promises";
import os from "os";
import { WebSocketServer } from "ws";
import watchDirectories from "./watchDirectories.js";
import logger from "./logger.js";
import * as marked from "marked";
import { parseDocument } from "htmlparser2";
import { getElementsByTagName, textContent } from "domutils";

const ROOT = path.resolve(process.env.SSG_ROOT || "./");
const PORT = parseInt(process.env.SSG_PORT || "8888", 10);
const WS_PORT = PORT - 1;
const LIVE_RELOAD_NODE_ID = "_liveReload";
const TITLE = process.env.SSG_TITLE || path.basename(ROOT);
const DESCRIPTION = process.env.SSG_DESCRIPTION || "";
const FAVICON = process.env.SSG_FAVICON || "/favicon.png";
const log = logger(TITLE);

const relativeFilePath = (filePath, root = ROOT) =>
  path.relative(ROOT, filePath);

const getExt = (filePath) => path.extname(filePath);

const injectIntoCSV = (file, filePath) => {
  const body = file.toString();
  const html = `<h1>${path.basename(filePath)}</h1><table><tr>${body
    .split(/\n/)
    .map((line) =>
      line === "" ? "" : `<td>${line.split(";").join("</td><td>")}</td>`
    )
    .join("</tr><tr>")}</tr></table>`;
  return injectIntoHtml(html, filePath);
};

const firstTagTextContent = (tag, defaultText, body) => {
  const [first] = getElementsByTagName(tag, parseDocument(body));
  return first ? textContent(first) : defaultText;
};

const withImage = (body) =>
  body.replaceAll(/{{image}}/g, firstTagTextContent("img", FAVICON, body));

const withDescription = (body) =>
  body.replaceAll(
    /{{description}}/g,
    firstTagTextContent("p", DESCRIPTION, body)
  );

const withTitle = (body) =>
  body.replaceAll(
    /{{title}}/g,
    [firstTagTextContent("h1", null, body), TITLE]
      .filter((x) => !!x)
      .join(" &mdash; ")
  );

const injectIntoMd = (file, filePath) => {
  const body = file.toString();
  return injectIntoHtml(marked.parse(body, { gfm: true }), filePath);
};

const injectIntoHtml = async (file, filePath) => {
  const body = file.toString();
  const liveReloadCode = `
<style>
#${LIVE_RELOAD_NODE_ID} {padding:10px;margin-bottom:10px;position:absolute;right:0;top:0px;display:none;}
.${LIVE_RELOAD_NODE_ID}-warn {background-color:#fc8;color:#440;}
.${LIVE_RELOAD_NODE_ID}-error {background-color:#fba;color:#400;}
</style><div id="${LIVE_RELOAD_NODE_ID}"></div>
<script>
// <![CDATA[
(({ url, retries, nodeId }) => {
  const cssReload = () =>
    [...document.getElementsByTagName("link")]
      .filter(
        (el) => el.href && typeof el.rel === "string" && el.rel === "stylesheet"
      )
      .map((el) => {
        const href = el.href.replace(/(&|\\?)_liveReload=\\d+/, "");
        const param = "_liveReload=" + new Date().getTime();
        const delimiter = href.includes("?") ? "&" : "?";
        el.href = href + delimiter + param;
      });
  const showMessage = (div, kind, text) => {
    div.className = nodeId + "-" + kind;
    div.textContent = text;
    div.style.display = "block";
  };
  const div = document.getElementById(nodeId);
  const handleMessageEvent = ({ data }) => {
    const message = JSON.parse(data);
    if (message.documentReload && message.href) {
      console.log("document reload and redirect: " + message.filePath);
      return (location.href = message.href);
    }
    if (message.documentReload) {
      console.log("document reload: " + message.filePath);
      return location.reload();
    }
    if (message.cssReload) {
      console.log("css reload: " + message.filePath);
      return cssReload();
    }
  };
  const liveReload = (t) => () => {
    if (t > retries) {
      const message = "disconnected";
      console.error(message);
      showMessage(div, "error", message);
      return;
    }
    const socket = new WebSocket(url);
    socket.addEventListener("error", () => {
      const message = "reconnecting... " + t + "/" + retries;
      console.log(message);
      showMessage(div, "warn", message);
      setTimeout(liveReload(t + 1), 1000);
    });
    socket.addEventListener("open", () => location.reload());
    socket.addEventListener("message", handleMessageEvent);
  };
  const socketInit = new WebSocket(url);
  socketInit.addEventListener("close", liveReload(1));
  socketInit.addEventListener("message", handleMessageEvent);
})({ retries: 60, nodeId: "${LIVE_RELOAD_NODE_ID}", url: "ws://" + location.hostname + ":" + ${WS_PORT}  });
// ]]>
</script>`;
  const mermaid =
    body.match(/class="mermaid"/is) !== null
      ? `<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/9.1.1/mermaid.js"></script>`
      : "";
  if (body.match(/<html.*>/is) !== null)
    return Buffer.from(`${mermaid}${body}${liveReloadCode}`);
  if (httpServer.template)
    return Buffer.from(
      withImage(
        withDescription(
          withTitle(
            `${mermaid}${httpServer.template.replace(
              /{{content}}/,
              body
            )}${liveReloadCode}`
          )
        )
      )
    );
  return Buffer.from(`${mermaid}${body}${liveReloadCode}`);
};

const injectIntoSvg = (file) => {
  const body = file.toString();
  return Buffer.from(
    body.replace(
      `</svg>`,
      `<script>
// <![CDATA[
(({ retries, url }) => {
  const handleMessageEvent = ({ data }) => {
    const message = JSON.parse(data);
    if (message && message.documentReload) {
      log("document reload: " + message.filePath);
      return location.reload();
    }
  };
  const liveReload = (t) => () => {
    if (t > retries) {
      console.error("disconnected");
      return;
    }
    const socket = new WebSocket(url);
    socket.addEventListener("error", () => {
      log("reconnecting... " + t + "/" + retries);
      setTimeout(liveReload(t + 1), 1000);
    });
    socket.addEventListener("open", () => location.reload());
    socket.addEventListener("message", handleMessageEvent);
  };
  const socketInit = new WebSocket(url);
  socketInit.addEventListener("close", liveReload(1));
  socketInit.addEventListener("message", handleMessageEvent);
})({ retries: 60, url: "ws://" + location.hostname + ":" + ${WS_PORT}});
// ]]>
</script>
</svg>`
    )
  );
};

const handleRequest = async (request, response) => {
  if (httpServer.passwd) {
    const passwd = httpServer.passwd;
    const authorization = request.headers.authorization;
    if (!authorization) {
      const err = new Error("not authenticated");
      response.message = "not authenticated";
      const body = await injectIntoHtml(`<h1>not authenticated</h1>`);
      response.writeHead(401, {
        "www-authenticate": "basic",
        "content-type": "text/html",
        "content-length": Buffer.byteLength(body),
      });
      return response.end(body);
    }

    const [username, password] = new Buffer.from(
      authorization.split(" ")[1],
      "base64"
    )
      .toString()
      .split(":");

    if (
      passwd &&
      passwd.filter((x) => x.username === username && x.password === password)
        .length === 0
    ) {
      const err = new Error("not authenticated");
      response.message = "not authenticated";
      const body = await injectIntoHtml(`<h1>not authenticated</h1>`);
      response.writeHead(401, {
        "www-authenticate": "basic",
        "content-type": "text/html",
        "content-length": Buffer.byteLength(body),
      });
      return response.end(body);
    }
  }

  const logRequest = (
    { socket: { remoteAddress }, method, url },
    { statusCode, message = "" }
  ) => log(method, statusCode, url, message);

  response.on("finish", () => logRequest(request, response));
  if (request.method !== "GET") return;
  const pathname = decodeURI(
    new URL(request.url, `http://${request.headers.host}`).pathname
  );

  const filePath = path.join(
    ROOT,
    pathname.endsWith("/") ? path.join(pathname, "index.html") : pathname
  );

  if (getExt(filePath) === "") {
    log("no ext");
  }

  const getWrapper = (ext) => {
    switch (ext) {
      case "":
        return injectIntoHtml;
      case ".csv":
        return injectIntoCSV;
      case ".md":
        return injectIntoMd;
      case ".html":
        return injectIntoHtml;
      case ".svg":
        return injectIntoSvg;
      default:
        return (x) => x;
    }
  };

  const getMime = (filePath) => {
    const ext = path.extname(filePath).replace(".", "");
    const mimeTypes = {
      css: "text/css",
      html: "text/html",
      jpg: "image/jpeg",
      js: "application/javascript",
      json: "application/json",
      md: "text/markdown",
      png: "image/png",
      svg: "image/svg+xml",
      txt: "text/plain",
    };
    if (!mimeTypes[ext]) return "text/html";
    return mimeTypes[ext];
  };

  if ([".ssg.json", ".ssg.html"].includes(relativeFilePath(filePath))) {
    response.message = "no access";
    const body = await injectIntoHtml(`<h1>no access</h1><p>${pathname}</p>`);
    response.writeHead(403, {
      "content-type": "text/html",
      "content-length": Buffer.byteLength(body),
    });
    return response.end(body);
  }

  try {
    const file = await readFile(filePath);
    const body = await getWrapper(getExt(filePath))(
      file,
      relativeFilePath(filePath)
    );
    response.writeHead(200, {
      "content-type": getMime(filePath),
      "content-length": Buffer.byteLength(body),
    });
    return response.end(body);
  } catch (err) {
    try {
      const filePathMd =
        getExt(filePath) === ""
          ? `${filePath}.md`
          : filePath.replace(".html", ".md");
      const file = await readFile(filePathMd);
      const body = await getWrapper(getExt(filePathMd))(
        file,
        relativeFilePath(filePathMd)
      );
      response.message = `generated from ${relativeFilePath(filePathMd)}`;
      response.writeHead(200, {
        "content-type": getMime(filePath),
        "content-length": Buffer.byteLength(body),
      });
      return response.end(body);
    } catch (err) {
      response.message = "not found";
      const body = await injectIntoHtml(`<h1>not found</h1><p>${pathname}</p>`);
      response.writeHead(404, {
        "content-type": "text/html",
        "content-length": Buffer.byteLength(body),
      });
      return response.end(body);
    }
  }
};

const httpServer = http.createServer(handleRequest);
httpServer.listen(PORT, async () => {
  log(`serving http://localhost:${PORT}`);
  try {
    httpServer.passwd = JSON.parse(
      (await readFile(path.join(ROOT, ".ssg.json"))).toString()
    ).passwd;
    log("read .ssg.json");
  } catch (err) {
    log(".ssg.json not found");
  }
  await readSsgHtml();
});

const readSsgHtml = async () => {
  try {
    httpServer.template = (
      await readFile(path.join(ROOT, ".ssg.html"))
    ).toString();
    log("read .ssg.html");
  } catch (err) {
    log(".ssg.html not found");
  }
};

const wss = new WebSocketServer({ port: WS_PORT });
wss.on("listening", () => log(`serving ws://localhost:${WS_PORT}`));

const handleEvent =
  ({ documentReload, cssReload }) =>
  ({ type, filePath }) =>
    wss.clients.forEach((client) =>
      client.send(
        JSON.stringify({
          cssReload,
          documentReload,
          type,
          filePath: relativeFilePath(filePath),
          ...(type === "change" &&
            [".csv", ".md", ".html"].includes(getExt(filePath)) &&
            ![".ssg.html"].includes(relativeFilePath(filePath)) && {
              href: "/" + relativeFilePath(filePath).replace(".md", ""),
            }),
        })
      )
    );
wss.on("documentReload", handleEvent({ documentReload: true }));
wss.on("cssReload", handleEvent({ cssReload: true }));

(async () => {
  const handleFileChange = async (type, filePath) => {
    if (filePath.endsWith(".ssg.html")) {
      await readSsgHtml();
    }
    log(type, relativeFilePath(filePath));
    return getExt(filePath) === ".css"
      ? wss.emit("cssReload", { filePath, type })
      : wss.emit("documentReload", { filePath, type });
  };
  await watchDirectories({
    directories: [ROOT],
    onChange: handleFileChange,
    onListening: () => log(`watching ${[ROOT]}`),
  });
})();
