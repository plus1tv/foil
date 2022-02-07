import { markademic } from 'markademic';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { Loader } from '../../../types';

export let book: Loader = {
    test: { permalink: /^\/books\/|docs/ },
    transform: async foil => {
        // 📄 Get Table of Contents file
        let toc = null;
        for (let file of foil.meta.files) {
            if (
                /(summary)|(toc)|(table-of-contents)/i.exec(file.path) != null
            ) {
                toc = file;
                break;
            }
        }
        if (!toc) {
            throw new Error(
                'Foil book is missing a Table of Contents! Create a file called `toc.md` in the root directory of this entry.'
            );
        }

        console.log('📚 Book Transformer: \n');

        // 🌲 Convert table of contents to navigation tree.
        type NavStructure = {
            text: string;
            link: string;
            children: NavStructure[];
        };
        let navStructure: NavStructure = {
            text: '',
            link: '',
            children: []
        };
        let chapters = [];

        // Traverse Table of Contents to build navigation map
        let tocString = readFileSync(toc.path).toString();
        let contentsRegex = /(?![\t ]*[\-,\*][\t ]*\[)[\w\t ]*(?=\])/;
        let tocUnorderedLists = /(\n\s*(\-|\+|\*)\s.*)+/g.exec(tocString);
        if (!tocUnorderedLists) {
            throw new Error(
                'Table of contents is missing an unordered list of links. This is needed to build navigation data structures and traverse the book.'
            );
        }

        /**
         * 📖 Basic Top-down Parser built with Regex:
         * Tabs, >1 space represent subtrees.
         * Example:
         * # Table of Contents
         * -   [Introduction](index.md)
         *     -   [Initialize the API](ch1-initialize-api.md)
         * -   [Raster Graphics Pipeline](ch2-raster.md)
         * -   [Compute Pipeline](ch3-compute.md)
         * -   [Ray Tracing Pipeline](ch4-ray-tracing-pipeline.md)
         */
        let parentStack = [navStructure];
        let prevStructure = navStructure;
        let result;
        let prevSpaces = 0;
        let minSpaces = -1;

        while ((result = contentsRegex.exec(tocString)) !== null) {
            let title = result[0];
            let matchIndex = result.index;
            let spaces = 0;

            // Count how much space there is before `-`
            while (
                matchIndex > 0 &&
                tocString[matchIndex].match(/\*|\-/) === null
            ) {
                matchIndex--;
            }
            matchIndex--;
            while (
                matchIndex > 0 &&
                tocString[matchIndex].match(/\r|\n/) === null
            ) {
                matchIndex--;
                spaces++;
            }

            // Get link
            let tocSlice = tocString.slice(result.index + title.length);
            let linkMatches = /(?!\()[\w\t \.\-]*(?=\))/.exec(tocSlice);
            if (linkMatches === null) {
                continue;
            }
            let link = linkMatches[0];

            // Use space count to build navigation structure
            let curNavStruct = {
                text: title,
                link: link,
                children: []
            };

            // Build parent stack
            if (minSpaces < 0) {
                minSpaces = spaces;
            }
            if (spaces == 0) {
                parentStack = [navStructure];
            } else if (spaces > prevSpaces) {
                // go in
                if (prevStructure != navStructure) {
                    parentStack.push(prevStructure);
                }
            } else if (spaces < prevSpaces) {
                parentStack.pop();
                if (parentStack.length <= 0) {
                    parentStack = [navStructure];
                }
            }

            // save prefix traversal state
            tocString = tocString.slice(
                result.index +
                    title.length +
                    linkMatches.index +
                    link.length +
                    1
            );
            prevSpaces = spaces;
            prevStructure = curNavStruct;

            // Add current nav structure to parent
            parentStack[parentStack.length - 1].children.push(curNavStruct);
        }

        // traverse navigation structure, determine if files exist
        let recursiveTraversal = curStructure => {
            for (let child of curStructure.children) {
                let isFile = /\.[^/.]+$/.exec(child.link);
                let isPath = /(\/|\\)$/.exec(child.link);
                let filePath = join(foil.meta.rootPath, child.link);
                if (isFile) {
                    // raw-vulkan/ch1-introduction.md
                    child.link = child.link.replace(/\.[^/.]+$/, '');
                }
                if (isPath) {
                    // raw-vulkan/ch1-introduction/
                    child.link = child.link.substr(0, child.link.length - 1);
                    filePath += 'index.md';
                }
                if (/index$/.exec(child.link)) {
                    child.link = join(child.link, '..', '/');
                }
                child.link = join('/', foil.rootPermalink, child.link).replace(
                    /\\/gi,
                    '/'
                );

                if (!isFile && !isPath) {
                    // raw-vulkan/ch1-introduction
                    filePath += '.md';
                }
                let citations = null;
                let bibPath = join(foil.meta.rootPath, 'bib.json');
                let localBibPath = join(
                    filePath,
                    isFile ? '..' : '',
                    'bib.json'
                );
                if (existsSync(bibPath)) {
                    citations = require(bibPath);
                }
                if (existsSync(localBibPath)) {
                    let curCitations = require(localBibPath);
                    citations = citations
                        ? { ...citations, ...curCitations }
                        : curCitations;
                }

                if (existsSync(filePath)) {
                    var config = {
                        input: readFileSync(filePath).toString(),
                        rerouteLinks: link =>
                            join(foil.rootPermalink, link).replace(/\\/gi, '/')
                    };

                    if (citations) {
                        config['citations'] = citations;
                    }

                    var contents = markademic(config);

                    // chapters corresponds to a flattened version of the navStructure
                    chapters.push(contents);

                    recursiveTraversal(child);
                } else {
                    console.error(
                        'Failed to find corresponding table of contents entry for ' +
                            filePath +
                            ', aborting.'
                    );
                    return foil;
                }
            }
        };

        recursiveTraversal(navStructure);

        if (/\*$/.exec(foil.permalink) === null) {
            foil.permalink = join(foil.permalink, '*');
        }

        return {
            ...foil,
            data: {
                toc: [...navStructure.children],
                chapters
            }
        };
    }
};
