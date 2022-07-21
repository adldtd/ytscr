#!/usr/bin/env node

const CLI = require("./cli");
const comment_scraper = require("./commentsAxios");
CLI.cli(process.argv);