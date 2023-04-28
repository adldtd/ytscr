const getData = require("./test-helpers").getData;
const mapVal = require("./test-helpers").mapVal;
const testPlaylist = require("./test-helpers").testPlaylist;

const gl = require("../common/globals");


global.TESTING = true;

const INVALID1 = "PLFsQlewWXsj_4yDedbiIADdH5FMayBiJp";
const INVALID2 = "PLUg5WJL2pGHcM9ZReMONn_XVIpDXZb0vU";
const VALID1 = "PLZ4DbyIWUwCq4V8bIEa8jm2ozHZVuREJP";
const VALID2 = "PLtKVsbX6mq9RvO__n08wujegVI0NsuNiu";
const VALID3 = "PLpR68gbIfkKmrNp3yeVmZRyNR_Lb6XM5Q"; //Long!
const VALID4 = "PLoSWVnSA9vG9QbL9nV1pisgWCemD0UFnZ";

jest.useRealTimers();
jest.setTimeout(100000);


test("Bad link 1", async () => {
  let shellArgs = `playlist -i ${INVALID1}`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  expect(savedData).toBe(-1);
});

test("Bad link 2", async () => {
  let shellArgs = `playlist -i ${INVALID2}`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  expect(savedData).toBe(-1);
});

test("Basic scrape 1", async () => {
  let shellArgs = `playlist -i ${VALID2}`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("playlist", settings, false);
  let focus = mapVal("playlist", settings, true);
  let limits = mapVal("playlist", settings, Number.POSITIVE_INFINITY);

  testPlaylist(savedData, focus, ignore, limits);
  expect(savedData).toBeInstanceOf(Object);
});

test("Basic scrape 2", async () => {
  let shellArgs = `playlist -i ${VALID1} videos --lim 150`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("playlist", settings, false);
  let focus = mapVal("playlist", settings, true);
  let limits = mapVal("playlist", settings, Number.POSITIVE_INFINITY);
  limits.videos[0] = 150;

  testPlaylist(savedData, focus, ignore, limits);
  expect(savedData).toBeInstanceOf(Object);
});


test("Focus 1", async () => {
  let shellArgs = `playlist -i ${VALID4} -fc videos`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("playlist", settings, false);
  let focus = mapVal("playlist", settings, false);
  let limits = mapVal("playlist", settings, Number.POSITIVE_INFINITY);
  focus.videos[0] = true;

  testPlaylist(savedData, focus, ignore, limits);
  expect(savedData).toBeInstanceOf(Object);
});

test("Focus 2", async () => {
  let shellArgs = `playlist -i ${VALID3} --exclude videos`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("playlist", settings, false);
  let focus = mapVal("playlist", settings, true);
  let limits = mapVal("playlist", settings, Number.POSITIVE_INFINITY);
  focus.videos[0] = false;

  testPlaylist(savedData, focus, ignore, limits);
  expect(savedData).toBeInstanceOf(Object);
});


test("Ignore 1", async () => {
  let shellArgs = `playlist -i ${VALID2} videos --ignore views --ignore duration # meta --ignore description #`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("playlist", settings, false);
  let focus = mapVal("playlist", settings, true);
  let limits = mapVal("playlist", settings, Number.POSITIVE_INFINITY);
  ignore.videos[1].views[0] = true;
  ignore.videos[1].duration[0] = true;
  ignore.meta[1].description[0] = true;

  testPlaylist(savedData, focus, ignore, limits);
  expect(savedData).toBeInstanceOf(Object);
});

test("Ignore 2", async () => {
  let shellArgs = `playlist -i ${VALID1} videos --lim 100 --ignore title --ignore thumbnail # meta --ignore channelId # videos --ignore channelId`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("playlist", settings, false);
  let focus = mapVal("playlist", settings, true);
  let limits = mapVal("playlist", settings, Number.POSITIVE_INFINITY);
  ignore.videos[1].title[0] = true;
  ignore.videos[1].thumbnail[0] = true;
  ignore.videos[1].channelId[0] = true;
  ignore.meta[1].channelId[0] = true;
  limits.videos[0] = 100;

  testPlaylist(savedData, focus, ignore, limits);
  expect(savedData).toBeInstanceOf(Object);
});


test("Behemoth", async () => {
  let shellArgs = `playlist meta --ignore id --ignore size --ignore handle # videos --lim 350 --ignore title --ignore thumbnail # --input ${VALID3} meta --ignore handle # videos --ignore uploader # meta --ignore description # meta # meta`;
  let pack = await getData(shellArgs);

  let savedData = pack[0];
  let settings = pack[1];

  let ignore = mapVal("playlist", settings, false);
  let focus = mapVal("playlist", settings, true);
  let limits = mapVal("playlist", settings, Number.POSITIVE_INFINITY);
  ignore.videos[1].title[0] = true;
  ignore.videos[1].thumbnail[0] = true;
  ignore.videos[1].uploader[0] = true;
  ignore.meta[1].id[0] = true;
  ignore.meta[1].size[0] = true;
  ignore.meta[1].handle[0] = true;
  ignore.meta[1].description[0] = true;
  limits.videos[0] = 350;

  testPlaylist(savedData, focus, ignore, limits);
  expect(savedData).toBeInstanceOf(Object);
});