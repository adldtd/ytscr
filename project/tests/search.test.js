const getData = require("./test-helpers").getData;
const mapVal = require("./test-helpers").mapVal;
const testSearch = require("./test-helpers").testSearch;

const gl = require("../common/globals");


const NONE1 = "...";
const NONE2 = '../../..';
const NONE3 = "꧁꧂";
const SOME1 = "gaming";
const SOME2 = "undertale_ost";
const SOME3 = ".";
const SOME4 = "𒐪";
const SOME5 = "Terminator";

jest.useRealTimers();
jest.setTimeout(100000);


test("Basic scrape 1", async () => {
  let shellArgs = `search -i ${NONE1}`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("search", settings, false);
  let focus = mapVal("search", settings, true);
  let limits = mapVal("search", settings, Number.POSITIVE_INFINITY);
  let overallLimit = Number.POSITIVE_INFINITY;
  let seperate = false;

  testSearch(savedData, focus, ignore, limits, overallLimit, seperate);
  expect(savedData).toBeInstanceOf(Object);
});

test("Basic scrape 2", async () => {
  let shellArgs = `search -i ${NONE2} -sep`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("search", settings, false);
  let focus = mapVal("search", settings, true);
  let limits = mapVal("search", settings, Number.POSITIVE_INFINITY);
  let overallLimit = Number.POSITIVE_INFINITY;
  let seperate = true;

  testSearch(savedData, focus, ignore, limits, overallLimit, seperate);
  expect(savedData).toBeInstanceOf(Object);
});

test("Basic scrape 3", async () => {
  let shellArgs = `search -i ${SOME1} --lim 100`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("search", settings, false);
  let focus = mapVal("search", settings, true);
  let limits = mapVal("search", settings, Number.POSITIVE_INFINITY);
  let overallLimit = 100;
  let seperate = false;

  testSearch(savedData, focus, ignore, limits, overallLimit, seperate);
  expect(savedData).toBeInstanceOf(Object);
});


test("Invalid filters 1", async () => {
  let shellArgs = `search -i ${NONE3} --lim 100 -ft 360 -ft Live`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  expect(savedData).toBe(-1);
});

test("Invalid filters 2", async () => {
  let shellArgs = `search -i ${SOME4} --lim 100 --features HD --type Channel`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  expect(savedData).toBe(-1);
});

test("Valid filters", async () => {
  let shellArgs = `search -i ${SOME5} --lim 100 --features 360 --type Video --sort Rating`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("search", settings, false);
  let focus = mapVal("search", settings, true);
  let limits = mapVal("search", settings, Number.POSITIVE_INFINITY);
  let overallLimit = 100;
  let seperate = false;

  testSearch(savedData, focus, ignore, limits, overallLimit, seperate);
  expect(savedData).toBeInstanceOf(Object);
});


test("Focus 1", async () => {
  let shellArgs = `search -i ${SOME3} --lim 50 --focus meta --seperate`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("search", settings, false);
  let focus = mapVal("search", settings, false);
  let limits = mapVal("search", settings, Number.POSITIVE_INFINITY);
  let overallLimit = 50;
  let seperate = true;

  focus.meta[0] = true;

  testSearch(savedData, focus, ignore, limits, overallLimit, seperate);
  expect(savedData).toBeInstanceOf(Object);
});

test("Focus 2", async () => {
  let shellArgs = `search -i ${SOME3} --lim 150 --focus videos --focus playlists`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("search", settings, false);
  let focus = mapVal("search", settings, false);
  let limits = mapVal("search", settings, Number.POSITIVE_INFINITY);
  let overallLimit = 150;
  let seperate = false;

  focus.videos[0] = true;
  focus.playlists[0] = true;

  testSearch(savedData, focus, ignore, limits, overallLimit, seperate);
  expect(savedData).toBeInstanceOf(Object);
});


test("Ignore 1", async () => {
  let shellArgs = `search -i ${SOME2} --lim 77 videos --ignore shortDescription --ignore id # playlists --lim 20 #`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("search", settings, false);
  let focus = mapVal("search", settings, true);
  let limits = mapVal("search", settings, Number.POSITIVE_INFINITY);
  let overallLimit = 77;
  let seperate = false;

  ignore.videos[1].shortDescription[0] = true;
  ignore.videos[1].id[0] = true;
  limits.playlists[0] = 20;

  testSearch(savedData, focus, ignore, limits, overallLimit, seperate);
  expect(savedData).toBeInstanceOf(Object);
});

test("Ignore 2", async () => {
  let shellArgs = `search -i ${SOME5} --lim 88 videos --ignore title # playlists --ignore title # shorts --lim 5 --ignore title # movies --ignore title`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("search", settings, false);
  let focus = mapVal("search", settings, true);
  let limits = mapVal("search", settings, Number.POSITIVE_INFINITY);
  let overallLimit = 88;
  let seperate = false;

  ignore.videos[1].title[0] = true;
  ignore.playlists[1].title[0] = true;
  ignore.shorts[1].title[0] = true;
  ignore.movies[1].title[0] = true;
  limits.shorts[0] = 5;

  testSearch(savedData, focus, ignore, limits, overallLimit, seperate);
  expect(savedData).toBeInstanceOf(Object);
});


test("Behemoth", async () => {
  let shellArgs = `search -i ${SOME5} movies --lim 1 --ignore contentHeaders # --lim 115 videos --ignore title --ignore id # playlists --ignore title # -ft 4K shorts --lim 10 --ignore id # movies --ignore title # --exclude mixes`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("search", settings, false);
  let focus = mapVal("search", settings, true);
  let limits = mapVal("search", settings, Number.POSITIVE_INFINITY);
  let overallLimit = 115;
  let seperate = false;

  ignore.videos[1].title[0] = true;
  ignore.videos[1].id[0] = true;
  ignore.playlists[1].title[0] = true;
  ignore.shorts[1].id[0] = true;
  ignore.movies[1].title[0] = true;
  ignore.movies[1].contentHeaders[0] = true;
  focus.mixes[0] = false;
  limits.shorts[0] = 10;
  limits.movies[0] = 1;

  testSearch(savedData, focus, ignore, limits, overallLimit, seperate);
  expect(savedData).toBeInstanceOf(Object);
});