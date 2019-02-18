import * as RSS from 'rss';
import { database } from '../db';
import { writeFileSync, statSync } from 'fs';
import { join } from 'path';

export async function rssFeed() {
  console.log('📻 Foilfolio RSS Feeds \n');

  let config = {
    title: 'Alain.xyz',

    description: 'The portfolio of Alain Galván, Engineer @ Marmoset.',

    feed_url: 'https://alain.xyz/assets/rss.xml',

    site_url: 'https://alain.xyz/',

    image_url: 'https://alain.xyz/assets/brand/alaingalvan.jpg',

    managingEditor: 'Alain Galvan',

    webMaster: 'Alain Galvan',

    copyright: 'Copyright Alain Galvan All Rights Reserved.',

    language: 'English',

    categories: [
      'vulkan',
      'c++',
      'programming',
      'graphics',
      'opengl',
      'metal',
      'directx',
      'research',
      'algorithms'
    ],

    pubDate: new Date(),

    ttl: 1200
  };

  let rss = new RSS(config);

  // Populate RSS Feed
  let foilfolioData = await new Promise<any[]>((res, _) => database
    .then(client => {
      let db = client.db('db');
      var col = db.collection('portfolio');

      col.find({
        datePublished: { $lte: new Date() },
        permalink: new RegExp('/blog/\w*')
      })
        .limit(30)
        .sort({
          datePublished: -1
        })
        .toArray((err, data) => {
          if (err || data.length === 0)
            return res([]);
          res(data);
        });
    }));

  for (var item of foilfolioData) {
    let fileData = await new Promise<any[]>((res, _) => database
      .then(client => {
        let db = client.db('db');
        var col = db.collection('redirect');
        col.find({
          from: item.cover
        })
          .limit(1)
          .toArray((err, data) => {
            if (err || data.length === 0)
              return res(null);
            res(data);
          });
      }));

    var filesize = 0;

    if (fileData) {
      filesize = statSync(fileData[0].to).size;
    }

    rss.item({
      title: item.title,
      description: item.description,
      url: 'https://alain.xyz' + item.permalink,
      date: item.datePublished,
      enclosure: {
        url: 'https://alain.xyz' + item.cover,
        size: filesize
      }
    });
  }

  // Generate file
  let xml = rss.xml();

  // Place in `frontend/assets/rss.xml`
  let p = join('..', 'frontend', 'assets', 'rss.xml')
  try {
    writeFileSync(p, xml);
    console.log('RSS feed successfully generated. \n Written to ' + p + '\n');
  }
  catch (e) {
    console.error('Could not generate RSS Feeds! \n');
  }
}