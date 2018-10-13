# <a href="https://alain.xyz/blog"><img alt="Foilfolio" src="docs/logo.svg" width="240" /></a>

[![License][license-img]][license-url]
[![Unit Tests][travis-img]][travis-url]
[![Coverage Tests][codecov-img]][codecov-url]
[![Dependency Status][david-img]][david-url]
[![devDependency Status][david-dev-img]][david-dev-url]

> 🚧 This is the rendering engine for my website [Alain.xyz](https://alain.xyz), I'm currently in the process of making this all significantly easier to use, so bear with me for now! ~ Alain Galvan

✨ Build powerful and flexible portfolios and blogs. ✨

Whether you're a writer, artist, musician, engineer, or all of the above, there's finally a tool that offers flexibility like no other:

- 🕹️ **Everything is a JavaScript module**, from blog posts to books, music albums, or even custom mini-applications like games or tools. Use 

- 🌌 **Universal (Serverside and Clientside) rendering** by default, your Foilfolio will work regardless of your user's browser setup.

- 🏙️ **A simple and extendable API** for building truly custom portfolios. Define your own data schemas or use our recommended setups for different portfolio types.

- ⚔️ **State of the Art technologies**, [TypeScript](https://www.typescriptlang.org/), [React](https://reactjs.org/), [Webpack](https://webpack.js.org/), [PostCSS](https://postcss.org/), and more. Write views in React, use 3D renderers like Marmoset Viewer, even render academic files written in Markdown + LaTeX, you'll find it all supported here.

- 🐙 **Git Powered** with a daemon tool to handle continuous deployment from your git repo, let git be your CMS!

Read about some of the *opinions* that guided its design over [here](docs/opinions.md).

## Ecosystem

- 💻 `foilfolio-cli` - A command line interface to help perform tasks to index a foilfolio portfolio, from compiling packages with Webpack to cleaning the database.

- 🏃 `foilfolio-express-mongo` - A backend application for rendering foilfolio applications with Express and querying for data with MongoDB.

- 😈 `foilfolio-github-daemon` - Responsible for keeping the server in sync with your portfolio's Github repo (so **Continuous Integration**), and uses [Github's Repository Webhooks](https://developer.github.com/v3/repos/hooks/) to do so. Alternatives such as using a git remote are also possible, but this has the added benefit of supporting the entire Github ecosystem (pull requests, tests, bots, and more).

## How it Works

### Foil Packages

Every Foilfolio post starts with a [`package.json` file](https://docs.npmjs.com/files/package.json), just like any other Node module, but with the addition of the `foil` object that stores data not defined by [`package.json` specification](https://docs.npmjs.com/files/package.json):

```json
{
  "description": "A cross platform system abstraction library written in C++ for managing windows and performing OS tasks.",
  "main": "main.tsx",
  "keywords": [
    "library",
    "libraries",
    "github",
    "cpp"
  ],
  "foil": {
    "title": "CrossWindow",
    "permalink": "libraries/crosswindow",
    "datePublished": "2018-09-16"
  }
}
```



### File Transformers

Your Foilfolio post's `package.json` points to an entry file, be it JavaScript, TypeScript, Markdown, or a custom file format you want to support.

**Transformers** use a **`test`** object to compare with the current post, and if there's a match, executes a **`transform`** which returns a modified version of a Foilfolio post. For example, here's a transformer for [academically flavored markdown](https://github.com/hyperfuse/markademic):

```ts
import markademic from 'markademic';
import { join } from 'path';
import { readFileSync } from 'fs';

export let md = {
  // 💉 a test object that's used to compare with the `package.json` file.
  test: { file: /\.md$/ },

  // 🚒 the function that takes in the package data and lets you modify it.
  transform: async post => {
    let config = {
      input: readFileSync(post.file).toString(),
      rerouteLinks: (link) => join(post.permalink, link)
    };

    let data = "";

    try {
      data = markademic(config);
    }
    catch (e) {
      console.error('Markademic', e.message);
    }

    return {
      ...post,
      data
    }
  }
}
```

### Backend

The backend serves as a thin client to service the API as well as prerender React components, and could be swapped with other backends in the future, for instance there's plans to make a Rocket.rs based Rust backend.

## Licencing

All source code is available with an MIT license, feel free to take bits and pieces and use them in your own projects. I would love to hear how you found things useful, feel free to contact me on Twitter <a href="https://twitter.com/Alainxyz">@alainxyz</a> and let me know.

[cover-img]: docs/assets/logo.png
[cover-url]: https://alain.xyz/libraries/foilfolio
[license-img]: http://img.shields.io/:license-mit-blue.svg?style=flat-square
[license-url]: https://opensource.org/licenses/MIT
[david-url]: https://david-dm.org/alaingalvan/foilfolio?path=packages/foilfolio
[david-img]: https://david-dm.org/alaingalvan/foilfolio.svg?style=flat-square
[david-dev-url]: https://david-dm.org/alaingalvan/foilfolio?path=packages/foilfolio#info=devDependencies
[david-dev-img]: https://david-dm.org/alaingalvan/foilfolio/dev-status.svg?style=flat-square
[travis-img]: https://img.shields.io/travis/alaingalvan/foilfolio.svg?style=flat-square
[travis-url]:https://travis-ci.org/alaingalvan/foilfolio
[codecov-img]:https://img.shields.io/codecov/c/github/alaingalvan/foilfolio.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/alaingalvan/foilfolio
[npm-img]: https://img.shields.io/npm/v/foilfolio.svg?style=flat-square
[npm-url]: http://npm.im/foilfolio
[npm-download-img]: https://img.shields.io/npm/dm/foilfolio.svg?style=flat-square
