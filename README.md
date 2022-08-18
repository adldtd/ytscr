# ytscr

A tool for extracting and searching YouTube data. Wrapped in a custom built CLI to help automate and tidy up the process. Comes with numerous arguments to specify scraping, including a simple filtering system. This project is meant to assist with data collection, as well as more mundane tasks (for that one time you scrolled for 7 minutes to find one comment/video).

Currently, the tool contains 3 modules:
`comments`: Comment scraper
`chat`: A live chat replay scraper
`videos`: A video searcher + scraper

A (working) list of modules to be added in the future:
`uploads`: Extracts YouTube user uploads
`recommended`: Extracts recommended videos
`channels`: A channel searcher + scraper
`playlists`: A playlist searcher + scraper

## Installation

To clone the project, run `git clone https://github.com/adldtd/ytscr`

Make sure you have NodeJS and npm installed on your computer (recommended: Node 16.16.0, npm 8.1.0). Then, using your terminal, navigate to the comment-scraper folder and run `npm init` inside. This should install all required dependencies in a folder called node_modules, and it should link the CLI to the terminal. From there, run `ytscr help` to get started.