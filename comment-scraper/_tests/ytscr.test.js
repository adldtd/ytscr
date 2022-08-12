const path = require("path");
const entry_cli = require(path.join(__dirname, "..", "_entry", "cli")).cli;
const entry_cmd = require(path.join(__dirname, "..", "_entry", "commands")).cmd;


  /*****************************************************************/
 /* Testing for the entrance ytscr function; mostly help commands */
/*****************************************************************/


test("No arguments", () => {
  expect(entry_cli(["", ""])).toBe(-1);
});

test("Bad argument", () => {
  expect(entry_cli(["", "", "alalalala"])).toBe(-1);
});

test("Help", () => {
  expect(entry_cli(["", "", "help"])).toBe(1);
});

test("Help arguments", () => {
  for (command in entry_cmd) {
    if ("redirect" in entry_cmd[command])
      expect(entry_cli(["", "", "help", command])).toBe(1);
    else if ("description" in entry_cmd[command])
      expect(entry_cli(["", "", "help", command])).toBe(1);
    else
      expect(entry_cli(["", "", "help", command])).toBe(-1); //Commands/arguments without descriptions should not be help printed
  }
});

test("Extraneous help", () => {
  expect(entry_cli(["", "", "help", "help", "help"])).toBe(-1);
});