# [Alain.xyz](https://alain.xyz) Backend

![Release][release-img]
[![License][license-img]][license-url]
[![Dependency Status][david-img]][david-url]
[![devDependency Status][david-dev-img]][david-dev-url]

My personal website backend, designed as a thin API and wrapper to the frontend.

Powered by:

- [TypeScript](http://www.typescriptlang.org/)
- [Node](https://nodejs.org/en/)
- [Express](http://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)

## API

- `/api/v1/portfolio` - **Get a list of portfolio posts.**

Depending on the response, the SPA has the option of rendering a given string of HTML, loading a mp3 file or even loading a javascript file (to say fetch a React Component from the backend).

## Setup

Make sure to have Node, then:

```bash
# Starting Off Development
npm install         # Install server dependencies
npm run develop     # Start developing if you need to
npm run production  # Start the app perpetually in production mode.
```

[website-url]: https://alain.xyz
[release-img]: https://img.shields.io/badge/release-0.4.0-4dbfcc.svg?style=flat-square
[license-img]: http://img.shields.io/:license-mit-blue.svg?style=flat-square
[license-url]: https://opensource.org/licenses/MIT
[david-url]: https://david-dm.org/alaingalvan/alain.xyz?path=packages/backend
[david-img]: https://david-dm.org/alaingalvan/alain.xyz.svg?path=packages/backend&style=flat-square
[david-dev-url]: https://david-dm.org/alaingalvan/alain.xyz?path=packages/backend#info=devDependencies
[david-dev-img]: https://david-dm.org/alaingalvan/alain.xyz/dev-status.svg?path=packages/backend&style=flat-square
