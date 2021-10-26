import { Feed } from 'feed';
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

        pubDate: new Date()
    };

    const feed = new Feed({
        title: Config.title,
        description: Config.description,
        id: Config.author.url,
        link: Config.author.url,
        language: 'en', // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
        image: Config.cover,
        favicon: Config.author.url + '/assets/brand/favicon/favicon.ico',
        copyright: 'Copyright ' + Config.author.name + ' All Rights Reserved.',
        updated: new Date(),
        generator: 'Feed in Foil',
        feedLinks: {
            rss: Config.author.url + '/rss',
            json: Config.author.url + '/feedJson',
            atom: Config.author.url + '/feedAtom'
        },
        author: {
            name: Config.author.name,
            email: Config.author.email,
            link: Config.author.url
        },
        ttl: 1200
    });
    for (let tag of Config.tags) {
        feed.addCategory(tag);
    }

    // Populate RSS Feed
    let foilData = await new Promise<any[]>((res, _) =>
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

    for (var item of foilData) {
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

        feed.addItem({
            title: item.title,
            id: Config.author.url + item.permalink,
            link: Config.author.url + item.permalink,
            description: item.description,
            author: [
                {
                    name: Config.author.name, 
                    email: Config.author.email,
                    link: Config.author.url 
                },
            ],
            date: item.datePublished,
            image: {
                url: Config.author.url + item.cover,
                length: filesize
            }
        });
    }

    // Generate file
    let xml = feed.rss2();

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
