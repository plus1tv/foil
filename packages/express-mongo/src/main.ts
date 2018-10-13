import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import compression from 'compression';
import helmet from 'helmet';

import api from './api';
import { database } from './db';
import { renderPage } from './render';

const app = express();

// Configure Express
app.use(compression({ level: 9 }));
app.use(helmet({
  hidePoweredBy: false
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((err, req, res, next) =>
  res.status(500).send(JSON.stringify({ err: 'Bad request!' }))
);

// Route Frontend assets
const root = path.join(__dirname, '..', '..', 'frontend');
app.use('/assets', express.static(path.join(root, 'assets')));

api(app);

// Route Static Portfolio Files
database.then(client => {
  let db = client.db('db');
  let redirectCol = db.collection('redirect');

  // File Routing
  // Sends files indexed by database.
  app.get('*.*', async (req, res) => {

    let query = {
      from: req.originalUrl
    };

    redirectCol.find(query)
      .limit(1)
      .toArray((errCol, data) => {
        if (errCol || data.length < 1)
          res.redirect(301, '/404');
        else
          res.sendFile(data[0].to);
      });

  });

  // All other routes are handled on the frontend.
  app.get('*', renderPage);
});

// Server Start
app.listen(3000, () => {
  console.log('🔳 Alain.xyz Running @ port 3000');
});

// Expose Module
export { app, database };