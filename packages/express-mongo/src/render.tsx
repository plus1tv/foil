import { Request, Response } from 'express';

import React from 'react';
import { StaticRouter } from 'react-router';
import { renderToNodeStream } from 'react-dom/server';
import { renderStatic as cssRender } from 'glamor-server';

import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import serialize from 'serialize-javascript';

import App from '../../frontend/src/app';
import reducers from '../../frontend/src/store/reducers';

import { database } from './db';
import { Redirect, PortfolioItem } from './schema';
import { makeRegexPath } from './api/utils';

/**
 * Queries Database for portfolio items
 * Sends portfolio items to renderer to use as meta tags/state
 */
export function renderPage(req: Request, res: Response) {
  let { originalUrl } = req;

  database.then(async (client) => {
    let db = client.db('db');
    let portfolioCol = db.collection('portfolio');

    let portfolio = await portfolioCol
      .find(
        {
          permalink: originalUrl,
          datePublished: {
            $lte: new Date()
          }
        },
        {
          projection: { file: false }
        }
      )
      .limit(1)
      .toArray()
      .catch((err) => console.error(err));

    page(req, res, portfolio || []);
  });
}

/**
 * Render Page with Rapscallion
 */
function page(req: Request, res: Response, data: PortfolioItem[]) {
  let meta = META;

  if (data) {
    if (data.length === 1)
      meta = {
        ...META,
        ...data[0]
      };
  }
  const state: any = {
    portfolio: data
  };

  const store = createStore(reducers, state, compose(applyMiddleware(thunk)));

  // React Router
  const context: any = {};

  const app = (
    <Provider store={store}>
      <StaticRouter location={req.url} context={context}>
        {App}
      </StaticRouter>
    </Provider>
  );

  // context.url will contain the URL to redirect to if a <Redirect> was used
  if (context.url) {
    res.writeHead(302, {
      Location: context.url
    });

    return res.end();
  } else {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.write(`<!--
            ..\`
          ......\`
        ..........\`
      ......  \`.....\`
    ......      \`.....\`
  ......          \`.....\`
 .....              \`.....\`
                      \`.....\`
                        \`.....\`
                          \`.....\`
 ✔️ Alain.xyz
 Made with the ✨ Foilfolio Web Engine 
 And a lot of 💗 in 🌴 Miami & 🍎 New York City
 Check out the source @ https://github.com/alaingalvan/alain.xyz
-->
<!doctype html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <!--Main-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <title>${meta.title}</title>
  <!--Search Engines-->
  <meta name="author" content="${meta.authors[0]}"/>
  <meta name="description" content="${meta.description}"/>
  <meta name="keywords" content="${meta.keywords.reduce((prev, cur, i) => prev + (i !== 0 ? ', ' : '') + cur, '')}"/>
  <link rel="canonical" itemprop="url" href="https://alain.xyz${meta.permalink}"/>
  <link rel="alternate" type="application/rss+xml" title="${meta.title}" href="https://alain.xyz/rss"/>
  <meta itemprop="image" content="${meta.image}">
  <!--Twitter-->
  <meta name="twitter:card" content="summary"/>
  <meta name="twitter:site" content="@Alainxyz"/>
  <meta name="twitter:title" content="${meta.title}"/>
  <meta name="twitter:description" content="${meta.description}"/>
  <meta name="twitter:image" content="https://alain.xyz${meta.image}"/>
  <!--Facebook-->
  <meta property="og:title" content="${meta.title}"/>
  <meta property="og:description" content="${meta.description}"/>
  <meta property="og:url" content="https://alain.xyz${meta.permalink}"/>
  <meta property="og:site_name" content="Alain.xyz"/>
  <meta property="og:image" content="https://alain.xyz${meta.image}"/>
  <meta property="fb:app_id" content="1404536383143308"/>
  <!--Icons/Mobile-->
  <link rel="shortcut icon" href="/assets/brand/icon.ico"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <!--Chrome-->
  <meta name="theme-color" content="#171a1e">
  <link rel="manifest" href="/assets/manifest.webmanifest">
  <!--Safari-->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Alain.xyz">
  <link rel="apple-touch-icon-precomposed" href="assets/brand/icon/512.png">
  <link rel="apple-touch-icon" sizes="180x180" href="assets/brand/icon/180.png">
  <link rel="apple-touch-icon" sizes="167x167" href="assets/brand/icon/167.png">
  <link rel="apple-touch-icon" sizes="152x152" href="assets/brand/icon/152.png">
  <link rel="apple-touch-icon" sizes="120x120" href="assets/brand/icon/120.png">
  <link rel="apple-touch-icon" sizes="80x80" href="assets/brand/icon/80.png">
  <!--Windows-->
  <meta name="application-name" content="Alain.xyz">
  <meta name="msapplication-square70x70logo" content="assets/brand/icon/70.png" />
  <meta name="msapplication-square150x150logo" content="assets/brand/icon/150.png" />
  <meta name="msapplication-wide310x150logo" content="assets/brand/icon/310x150.png">
  <meta name="msapplication-square310x310logo" content="assets/brand/icon/310.png">
  <meta name="msapplication-TileImage" content="assets/brand/icon/512.png">
  <meta name="msapplication-TileColor" content="#21252b">
  <meta name="msapplication-tap-highlight" content="no"/>
  <!--Styles-->
  <link rel="stylesheet" href="/assets/build/main.min.css"/>
</head>

<body>
  <div id="app">
    <div class="ag-loading-screen">
      <svg viewBox="0 0 160 112" class="ag-loading">
        <path d="M8,72l50.3-50.3c3.1-3.1,8.2-3.1,11.3,0L152,104" />
      </svg>
      <noscript style="padding:1em;opacity:.75;">Not Loading? <a style="text-decoration:underline;" href="https://enable-javascript.com/">Try enabling JavaScript</a>.</noscript>
    </div>
  </div>
  <!--Load App-->
  <script>
    // Redux
    window._initialState=${serialize(state)};
  </script>
  <!--Vendor-->
  <script type="text/javascript" src="/assets/build/system.min.js"></script>
  <script type="text/javascript" src="/assets/build/vendor.min.js"></script>
  <!--Main-->
  <script type="text/javascript" src="/assets/build/main.min.js"></script>
</body>

</html>
`);
    res.end();
  }
}

const META = {
  permalink: '/',
  title: 'Alain Galván | Engineer @ Marmoset',
  description:
    "Alain Galván is an Engineer @ Marmoset.co, here's his personal portfolio focused on 🛆 Computer Graphics, 🎨 Art & 🎹🎸 Audio Design/Engineering.",
  image: '/assets/brand/website-screenshot.jpg',
  keywords: [
    'alain',
    'galvan',
    'miami',
    'florida',
    'new york city',
    'marmoset',
    'vulkan',
    'opengl',
    'directx',
    'metal',
    'graphics',
    'programmer',
    'artist',
    'indie',
    'tutorial',
    'mathematics',
    'rendering',
    'demo',
    '3D',
    'realtime',
    'shader',
    'raytracing',
    'webgl',
    'glsl'
  ],
  authors: [ 'Alain Galvan' ]
};
