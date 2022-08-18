const path = require("path");
const entry_cli = require(path.join(__dirname, "..", "_entry", "cli")).cli;


  /****************************/
 /* Testing for the chat CLI */
/****************************/


test("No input", () => {
  expect(entry_cli(["", "", "chat"])[1]).toBe(-1);
});

test("Input 1", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp"])[1]).toBeInstanceOf(Object);
});

test("Input 2", () => {
  expect(entry_cli(["", "", "chat", "input=https://www.youtube.com/watch?v=fakeytlinkp"])[1]).toBeInstanceOf(Object);
});

test("Bad input 1", () => {
  expect(entry_cli(["", "", "chat", "i="])[1]).toBe(-1);
});

test("Bad input 2", () => {
  expect(entry_cli(["", "", "chat", "i=alalalalalalalalala"])[1]).toBe(-1);
});

test("Bad input 3", () => {
  expect(entry_cli(["", "", "chat", "i=https://facebook.com/wi1290snIWk"])[1]).toBe(-1);
});



test("Sample arguments 1", () => {
  expect(entry_cli(["", "", "chat", "input=youtube.com/watch?v=fakeytlinkp", "lim=100"])[1]).toBeInstanceOf(Object);
});

test("Sample arguments 2", () => {
  expect(entry_cli(["", "", "chat", "-top", "input=fakeytlinkp", "lim=100", "-sf", "-np"])[1]).toBeInstanceOf(Object);
});

test("Sample arguments 3", () => {
  expect(entry_cli(["", "", "chat", "limfilter=7", "input=youtu.be/fakeytlinkp", "-NS", "-savefilter", "-pf", "-np"])[1]).toBeInstanceOf(Object);
});

test("Sample arguments 4", () => {
  expect(entry_cli(["", "", "chat", "lf=1", "filter={", "-cs", "check=text", "match=WOW", "}", "lim=32", "input=https://youtu.be/fakeytlinkp", "-nosave", "-savefilter", ("dest=" + __dirname), "-printfilter", "-nopretty"])[1]).toBeInstanceOf(Object);
});

test("Sample arguments 5", () => {
  expect(entry_cli(["", "", "chat", "ignore=text", "ignore=author", "lf=300000", "f={", "compare=lesseq", "check=timestamp", "match=218029", "}", "lim=3212", "i=fakeytlinkp", "-NS", "-savefilter", "-nopretty", "-pf", ("d=" + __dirname)])[1]).toBeInstanceOf(Object);
});



test("Garbage 1", () => {
  expect(entry_cli(["", "", "chat", "inpu=fakeytlinkp"])[1]).toBe(-1);
});

test("Garbage 2", () => {
  expect(entry_cli(["", "", "chat", "}"])[1]).toBe(-1);
});

test("Multi input", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "i=anotherfake"])[1]).toBe(-1);
});

test("Unumerical 1", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "lim=wow"])[1]).toBe(-1);
});

test("Unumerical 2", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "lf=yay"])[1]).toBe(-1);
});

test("Invalid ignore", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "ignore=test"])[1]).toBe(-1);
});

test("Invalid destination", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "dest=wiqou9182hneduinwxouqw"])[1]).toBe(-1);
});



test("Filter arg outside filter", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "-casesensitive"])[1]).toBe(-1);
});

test("Invalid filter", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "filter=alalalalala"])[1]).toBe(-1);
});

test("Unclosed filter", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "filter={", "check=text"])[1]).toBe(-1);
});

test("Not enough filter args", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "filter={", "check=text", "}"])[1]).toBe(-1);
});

test("Invalid check", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "filter={", "check=string", "match=big", "}"])[1]).toBe(-1);
});

test("Compare should be defined", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "filter={", "check=timestamp", "match=-829", "}"])[1]).toBe(-1);
});

test("Unumerical match value", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "filter={", "check=timestamp", "match=big", "compare=eq", "}"])[1]).toBe(-1);
});

test("Invalid compare", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "filter={", "check=timestamp", "match=0", "compare=in", "}"])[1]).toBe(-1);
});

test("Non-filter arg inside filter", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "filter={", "check=timestamp", "match=0", "compare=lesseq", "lim=100", "}"])[1]).toBe(-1);
});

test("Filter value ignored 1", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "ignore=timestamp", "filter={", "check=timestamp", "match=0", "compare=lesseq", "}"])[1]).toBe(-1);
});

test("Filter value ignored 2", () => {
  expect(entry_cli(["", "", "chat", "input=fakeytlinkp", "filter={", "check=timestamp", "match=0", "compare=lesseq", "}", "ignore=timestamp"])[1]).toBe(-1);
});