# ytscr

A multi-modular tool for scraping various YouTube data. No API key required. Scrapes directly from requests made with axios.

## Usage

This tool is meant for both ML researchers/data collectors and more casual users. If you're looking to get every bit of data you want, simply call a module and enter the designated input. Otherwise, you can make use of a module's "submodules" - and either `--focus` or `--exclude` certain ones.

See the "Springboard" section below for more starting off points.

## Contents

Currently, the tool contains four implemented modules: `video`, `search`, `playlist`, and `channel`. Listed below are it and other modules, alongside their inner submodules.

```bash
ytscr
├─ video           # Retrieves information from a video link
│  ├─ meta              # Gets video metadata
│  ├─ comments          # Gets video comments
│  ├─ chat              # Gets video chat messages
│  └─ recommended       # Gets recommendations
│     ├─ videos             # Deals with video-type recommendations
│     ├─ playlists          # Deals with playlist recommendations
│     └─ mixes              # Deals with YouTube Mix recommendations
├─ search           # Retrieves information from a YouTube search
│  ├─ meta              # Gets search metadata
│  ├─ videos            # Deals with video-type results
│  ├─ shorts            # Deals with YouTube shorts
│  ├─ channels          # Deals with channel results
│  ├─ playlists         # Deals with playlist results
│  ├─ mixes             # Deals with YouTube Mixes
│  └─ movies            # Deals with movie results
├─ playlist         # Retrieves information from a playlist link
│  ├─ meta              # Gets the playlist's metadata
│  └─ videos            # Gets the playlist's videos
└─ channel          # Retrieves information from a channel link
   ├─ meta              # Gets channel metadata
   ├─ home              # Gets homepage results
   │  ├─ videos             # Deals with video-type results
   │  ├─ shorts             # Deals with YouTube shorts
   │  ├─ playlists          # Deals with playlist results
   │  └─ channels           # Deals with channel results
   ├─ videos            # Gets "videos" tab results
   ├─ shorts            # Gets "shorts" tab results
   ├─ live              # Gets "live" tab results
   ├─ playlists         # Gets "playlists" tab results
   ├─ community         # Gets "community" tab results
   │  ├─ video              # Deals with video-type post attachments
   │  ├─ poll               # Deals with poll post attachments
   │  └─ image              # Deals with image post attachments
   ├─ store             # Gets "store" tab results
   └─ about             # Gets "about" tab information
```

## Installation

To clone the project, run `git clone https://github.com/adldtd/ytscr`

Make sure you have NodeJS and npm installed on your computer (recommended: Node 16.16.0, npm 8.1.0). Then, using your terminal, navigate to the cloned folder, then to `./project` and run `npm install` inside. This should install all required dependencies in a folder called node_modules, and (for Windows users) it should link the CLI to the terminal. From there, run `ytscr` to get started.

NOTE: If the CLI command fails to link, or if you are on Linux, simply navigate to `./project/entry` and run `./ytscr` (for Windows users, `node ytscr`).

## Springboard

Here are some examples of input for getting started.

### Navigation

```console
ytscr --help
```
- Prints a help screen. Under the `MODULES` tab are valid modules, and under `COMMANDS/FLAGS` are valid commands. For the following examples, we'll be focusing solely on the video module.

```console
ytscr video --help
```
- Each module has its own help screen.
- Each module also has its own set of modules - known as "submodules". These are grouped into the specific *areas* the scraper will collect. (For example, the comments submodule focuses on comment collection).

```console
ytscr video comments --help
```
- Each submodule also has a help screen.
- The `Scraped Attributes` tab lists the specific info that will be collected during scraping.

### Scraping

```console
ytscr video --input <YOUTUBE LINK>
```
- Scrapes all modules from \<YOUTUBE LINK\>. May take long if comments and/or other sections are large.

```console
ytscr video comments --lim <VALUE> # --input <YOUTUBE LINK>
```
- A remedy for the problem above; the argument `--lim` takes in a positive integer \<VALUE\>, denoting the max number of comments to scrape.
- Notice the `#` in the middle. This is a special meta character, which can exit the "scope" of a called submodule. Here, it is used to exit `comments`.

```console
ytscr video --input <YOUTUBE LINK> --focus meta --focus recommended
```
- The `--focus` command tells the program to only scrape a certain submodule (by default, all submodules are scraped).
- Here, only the meta and recommended sections will be scraped.
```console
ytscr video --input <YOUTUBE LINK> --exclude comments
```
- The `--exclude` command does the opposite; it excludes a certain submodule from being scraped.
- Here, every submodule, except for comments, will be scraped.
```console
ytscr video comments --filter { --check <ATTRIBUTE> --match <VALUE> --compare <COMPARISON> }
--savefilter # --input <YOUTUBE LINK>
```
- This one is a little more complex; let's run through it step by step.
- **ytscr** provides a simple filtering system, where certain submodules support filtering of scraped attributes.
- First, we enter into the comments submodule, and specify the command `--filter`, which takes in an opening bracket as an argument.
- The filter is made up of three components: `--check`, `--match`, and `--compare`: the first specifies which attribute to check, the second the "value" to compare to the attribute, and the third the type of comparison to make.
- The closing bracket is required to exit the "filter scope". The flag `--savefilter` tells the scraper to only save comments which match the given filter(s).
- For more information about filtering, use `--help` on any of the commands/flags listed here.

(PS: If you enter more filters alongside `--savefilter`, the program will only save comments which match *all* of the filters entered.)