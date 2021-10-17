import * as RSS from 'rss';
import { database } from '../db';
import { writeFileSync, statSync } from 'fs';
import { join } from 'path';
import { config as Config } from '../config';
import { Post } from '../types';

export async function rssFeed(_foils: Post[]) {
    console.log('📻 Foil RSS Feeds \n');

    let config = {
        title: 'Alain.xyz',

        description: Config.description,

        feed_url: Config.author.url + '/rss',

        site_url: Config.author.url,

        image_url: Config.cover,

        managingEditor: Config.author.name,

        webMaster: Config.author.name,

        copyright: 'Copyright ' + Config.author.name + ' All Rights Reserved.',

        language: 'English',

        categories: Config.tags,

        pubDate: new Date(),

        ttl: 1200
    };

    let rss = new RSS(config);

    // Populate RSS Feed
    let foilfolioData = await new Promise<any[]>((res, _) =>
        database.then(client => {
            let db = client.db('db');
            var col = db.collection('portfolio');

            col.find({
                datePublished: { $lte: new Date() },
                permalink: new RegExp('/blog/w*')
            })
                .limit(30)
                .sort({
                    datePublished: -1
                })
                .toArray((err, data) => {
                    if (err || data.length === 0) return res([]);
                    res(data);
                });
        })
    );

    for (var item of foilfolioData) {
        let fileData = await new Promise<any[]>((res, _) =>
            database.then(client => {
                let db = client.db('db');
                var col = db.collection('redirect');
                col.find({
                    from: item.cover
                })
                    .limit(1)
                    .toArray((err, data) => {
                        if (err || data.length === 0) return res(null);
                        res(data);
                    });
            })
        );

        var filesize = 0;

        if (fileData) {
            filesize = statSync(fileData[0].to).size;
        }

        rss.item({
            title: item.title,
            description: item.description,
            url: Config.author.url + item.permalink,
            date: item.datePublished,
            enclosure: {
                url: Config.author.url + item.cover,
                size: filesize
            }
        });
    }

    // Generate file
    let xml = rss.xml();

    // Place in `<build_dir>/rss.xml`
    let p = join(Config.currentDir, 'rss.xml');
    try {
        writeFileSync(p, xml);
        console.log(
            'RSS feed successfully generated. \n Written to ' + p + '\n'
        );
    } catch (e) {
        console.error('Could not generate RSS Feeds! \n');
    }
}
