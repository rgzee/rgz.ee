const logger = (origin) => (...args) =>
  console.log(`[${new Date().toJSON().split("T")[1].split(".")[0]}] - ${origin} -`, ...args);

export default logger;
