import markademic from 'markademic';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { Loader } from '../../../types';

export let book: Loader = {
    test: { permalink: /^\/books\/|docs/ },
    transform: async (foil) => {
        console.log('📚 Book Transformer\n');

        type NavStructure = { text: string; link: string; children: NavStructure[] };
        let navStructure: NavStructure[] = [];
        let chapters = [];

        // Get Table of Contents (summary/toc/table-of-contents.md)
        let toc = null;
        for (let file of foil.files) {
            if (/(summary)|(toc)|(table-of-contents)/i.exec(file.path) != null) {
                toc = file;
                break;
            }
        }
        if (!toc) {
            throw new Error(
                'Foilfolio book is missing a Table of Contents! Create a file called `toc.md` in the root directory of this entry.'
            );
        }

        // Traverse Table of Contents to build navigation map
        let tocString = readFileSync(toc.path).toString();
        let tocUnorderedLists = /(\n\s*(\-|\+|\*)\s.*)+/g.exec(tocString);

        if (!tocUnorderedLists) {
            throw new Error(
                'Table of contents is missing an unordered list of links. This is needed to build navigation data structures and traverse the book.'
            );
        }

        tocString = tocString.substr(tocUnorderedLists.index, tocString.length);

        let prevParent = navStructure;
        let curParent = navStructure;
        let curTabCount = 0.0;

        let linkRegex = /\[([^\[]+)\]\(([^\)]+)\)/g;
        let match: RegExpExecArray = linkRegex.exec(tocString);
        while (match != null) {
            //determine depth by backchecking
            /*
                let curIndex = match.index;
                let curChar = tocUnorderedList.charAt(curIndex);
                let beginDepthTest = false;
                let tabCount = 0;
                while (curIndex > 0 && curChar != '\n') {
                    if (beginDepthTest) {
                        if (curChar == '\t') {
                            tabCount += 1.0;
                        }
                        if (curChar == ' ') {
                            tabCount += 0.5;
                        }
                    }
                    if (curChar == '*' || curChar == '-') {
                        beginDepthTest = true;
                    }
                    curIndex--;
                    curChar = tocUnorderedList.charAt(curIndex);
                }
                */

            // Get Name and Link
            let curNavStruct = {
                text: match[1],
                link: match[2],
                children: []
            };
            /*
                if (tabCount < 1.0) {
                    curParent = navStructure;
                    curTabCount = 0.0;
                }

                // going down a level
                if (curTabCount > tabCount) {
                    curParent = prevParent;
                    curTabCount -= 1.0;
                    //going up a level
                } else if (curTabCount < tabCount) {
                    curTabCount += 1.0;
                    curParent = navStructure.length > 0 ? navStructure[navStructure.length - 1].children : navStructure;
                }
                */
            curParent.push(curNavStruct);
            match = linkRegex.exec(tocString);
        }

        // traverse navigation structure, determine if files exist
        for (let child of navStructure) {
            let isFile = /\.[^/.]+$/.exec(child.link);
            let isPath = /(\/|\\)$/.exec(child.link);
            let filePath = join(foil.rootPath, child.link);
            if (isFile) {
                // raw-vulkan/ch1-introduction.md
                child.link = child.link.replace(/\.[^/.]+$/, '');
            }
            if (isPath) {
                // raw-vulkan/ch1-introduction/
                child.link = child.link.substr(0, child.link.length - 1);
                filePath += 'index.md';
            }
            
            child.link = join('/', foil.rootPermalink, child.link).replace(/\\/gi, '/');
            console.log(child.link);
            console.log(filePath);

            if (!isFile && !isPath) {
                // raw-vulkan/ch1-introduction
                filePath += '.md';
            }
            let citations = null;
            let bibPath = join(foil.rootPath, 'bib.json');
            let localBibPath = join(filePath, isFile ? '..' : '', 'bib.json');
            if (existsSync(bibPath)) {
                citations = require(bibPath);
            }
            if (existsSync(localBibPath)) {
                let curCitations = require(localBibPath);
                citations = citations ? { ...citations, ...curCitations } : curCitations;
            }

            if (existsSync(filePath)) {
                var config = {
                    input: readFileSync(filePath).toString(),
                    rerouteLinks: (link) => join(foil.rootPermalink, link)
                };

                if (citations) {
                    config['citations'] = citations;
                }

                var contents = markademic(config);

                // chapters corresponds to a flattened version of the navStructure
                chapters.push(contents);
            }
        }

        return {
            ...foil,
            data: {
                toc: navStructure,
                chapters
            }
        };
    }
};
