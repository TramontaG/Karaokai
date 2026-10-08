// Only operates on the temporary root supplied by the integration test.
require("./time-signatures-preload.cjs");
const path = require("node:path");
const projects = require("../../projects.cjs");
const root = process.argv
  .find((arg) => arg.startsWith("--delete-test-root="))
  .split("=")[1];
const context = { dataRoot: () => root };
const base = window.karaokaiDesktop.invoke;
window.deleteProbe = { attempts: 0, fail: true, release: null };
window.confirm = () => {
  throw new Error("Native confirm must not be called");
};
window.karaokaiDesktop.invoke = async (command, args) => {
  if (command === "list_projects" || command === "load_project")
    return projects.run(command, args, context);
  if (command === "delete_project") {
    window.deleteProbe.attempts++;
    await new Promise((resolve) => {
      window.deleteProbe.release = resolve;
    });
    if (window.deleteProbe.fail)
      throw new Error("Simulated permission failure");
    return projects.run(command, args, context);
  }
  return base(command, args);
};
const prefs = JSON.parse(localStorage.getItem("karaokai.user-preferences"));
prefs.language = "en-US";
prefs.favoriteProjectIds = ["project-delete-fixture"];
localStorage.setItem("karaokai.user-preferences", JSON.stringify(prefs));
