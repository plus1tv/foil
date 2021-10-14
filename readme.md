<div align="center">

# <a href="https://alain.xyz/blog"><img alt="Foil" src="docs/foil-logo.svg" /></a>

> ✨ Build powerful and flexible portfolios and blogs. ✨

[![License][license-img]][license-url]
[![Unit Tests][travis-img]][travis-url]
[![Coverage Tests][codecov-img]][codecov-url]
[![Dependency Status][david-img]][david-url]
[![devDependency Status][david-dev-img]][david-dev-url]

</div>

Whether you're a *writer, artist, musician, engineer, or all of the above*, this tool makes it easy and fast to showcase a variety of content.

## Features

- 🐙 **Git Powered** with a *daemon tool* to handle continuous deployment from your git repo, let git be your CMS and simplify your blog workflow.

- 🕹️ **Everything is a JavaScript module**, from blog posts to books, music albums, or even custom mini-applications like games, demos, or tools. Use *JavaScript Modules* for it all, and have it all automatically combine and transpile together for your post.

- 🏙️ **A simple and extendable API** for building truly custom portfolios. Define your own data schemas or use our recommended setups for different portfolio types.

Read about some of the *opinions* that guided its design over [here](docs/opinions.md).

## Ecosystem

- 💻 `foil-cli` - A command line interface to help perform tasks to index a foil portfolio, from compiling packages with Webpack to cleaning the database.

## How it Works

The Foil CLI is a tool to populate your backend database with data to be read by your frontend.

By default the CLI targets the current directory it's called from, and attempts to create portfolio items from any [`package.json` files](https://docs.npmjs.com/files/package.json) it finds within that directory that feature a `"foil"` key. This design is similar to authoring an extension to a text editor like [VS Code](https://code.visualstudio.com/api/references/extension-manifest).

The schema for the "foil" object can be found in [`./foil.schema.json`](foil.schema.json).

> You may want to map this schema to your portfolio folder for better auto-complete, [here's a guide to do this in VS Code](https://vscode.readthedocs.io/en/latest/languages/json/#mapping-to-a-schema-in-the-workspace).

```json
{
    "description": "A WebGPU real time renderer of GLTF files.",
    "files": [
        "main.tsx"
    ],
    "main": "main.tsx",
    "keywords": [
        "demo",
        "webgpu",
        "gltf",
    ],
    "foil": {
        "title": "WebGPU GLTF",
        "permalink": "demos/webgpu-gltf",
        "datePublished": "09/02/2021 09:50 PM EST"
    },
    "devDependencies": {
        "@webgpu/types": "^0.1.6"
    },
    "dependencies": {
        "@loaders.gl/core": "^3.0.9",
        "@loaders.gl/gltf": "^3.0.9",
        "gl-matrix": "^3.3.0"
    }
}
```

### File Transformers

Your Foil post's `package.json` points to an entry file, be it JavaScript, TypeScript, Markdown, or a custom file format you want to support.

**Transformers** use a **`test`** object to compare with the current post, and if there's a match, executes a **`transform`** which returns a modified version of a Foil post. For example, here's a transformer for [academically flavored markdown](https://github.com/hyperfuse/markademic):

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

## Licencing

All source code is available with an MIT license, feel free to take bits and pieces and use them in your own projects. I would love to hear how you found things useful, feel free to contact me on Twitter <a href="https://twitter.com/Alainxyz">@alainxyz</a> and let me know.

[cover-img]: docs/assets/logo.png
[cover-url]: https://alain.xyz/libraries/foil
[license-img]: http://img.shields.io/:license-mit-blue.svg?style=flat-square
[license-url]: https://opensource.org/licenses/MIT
[david-url]: https://david-dm.org/plus1tv/foil?path=packages/foil
[david-img]: https://david-dm.org/plus1tv/foil.svg?style=flat-square
[david-dev-url]: https://david-dm.org/plus1tv/foil?path=packages/foil#info=devDependencies
[david-dev-img]: https://david-dm.org/plus1tv/foil/dev-status.svg?style=flat-square
[travis-img]: https://img.shields.io/travis/plus1tv/foil.svg?style=flat-square
[travis-url]:https://travis-ci.org/plus1tv/foil
[codecov-img]:https://img.shields.io/codecov/c/github/plus1tv/foil.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/plus1tv/foil
[npm-img]: https://img.shields.io/npm/v/foil.svg?style=flat-square
[npm-url]: http://npm.im/foil
[npm-download-img]: https://img.shields.io/npm/dm/foil.svg?style=flat-square
