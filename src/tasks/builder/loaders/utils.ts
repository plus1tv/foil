import { database } from '../../../db';
import { statSync, existsSync } from 'fs';

/**
 * Checks the database to see if the file exists or has been updated.
 * If it doesn't exist, or its been updated, return true.
 * @param path The absolute path to the file.
 */
export async function checkUpdated(path: string) {
    if (!existsSync(path)) {
        return true;
    }
    return await database.then(async client => {
        let db = client.db('db');

        type RedirectItem = {
            path: string;
            dateModified: string;
        };

        // Check portfolio collection to see if file at path exists.
        type PortfolioItem = {
            meta: {
                files: {
                    path: string;
                    modified: string;
                }[];
            };
        };
        let portfolioCol = db.collection<PortfolioItem>('portfolio');
        let portfolioItems = await portfolioCol
            .find({
                'meta.files.path': path
            })
            .project({
                'meta.files': 1
            })

            .limit(1)
            .toArray();

        if (typeof portfolioItems === 'object' && portfolioItems.length >= 1) {
            // Compare dates
            var { mtime } = statSync(path);
            for (let file of portfolioItems[0].meta.files) {
                if (file.path === path) {
                    return (
                        mtime.getDate() === new Date(file.modified).getDate()
                    );
                }
            }
        }

        // Check redirect collection.
        let redirectCol = db.collection<RedirectItem>('redirect');
        let redirectItems = await redirectCol
            .find({
                to: path
            })
            .limit(1)
            .toArray();

        if (typeof redirectItems === 'object' && redirectItems.length >= 1) {
            // Compare dates
            var { mtime } = statSync(path);
            let hasModified =
                mtime.getDate() ===
                new Date(redirectItems[0].dateModified).getDate();
            return hasModified;
        }
        return true;
    });
}
