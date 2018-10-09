import * as path from 'path';
import * as fs from 'fs';
import * as find from 'find';
import { yellow } from 'chalk';

import { getAsset, makePermalink, checkIfModified, writeToDb } from './utils';
export type Loader = any;

// Root of portfolio module
const ROOT = path.join(__dirname, '..', '..', '..');

/**
 * Executes Foilfolio Package building system.
 * @param loaders An array of Loaders.
 */
export default async function builder(loaders: Loader[]) {

  console.log('🌟 ' + yellow('Alain.xyz Package Builder\n'));

  // Find all package.json files
  let packages = find.fileSync(/\package.json$/, ROOT);
  packages = packages.filter(cur => !cur.match(/node_modules/))

  for (var pack of packages) {

    // Import package.json and set some defaults
    let {
      main: file,
      description,
      author,
      keywords,
      foil
    } = require(pack);

    // If it's a foil module, compile it with loaders
    if (foil) {

      console.log('⚪ Processing ' + pack + '\n');

      let filename = path.basename(pack);

      //resolve parent data
      let parent: string = filename.toLowerCase() != 'package.json' ?
        foil.parent != undefined ? 'package.json'
          : foil.parent
        : '';

      if (parent.length != 0) {
        let parPath = path.join(pack, '..', parent);
        if (!fs.existsSync(parPath)) {
          console.warn("Foil couldn't find parent module, are you sure it exists?");
        }
        else {
          let {
            main: pfile,
            description: pdescription,
            author: pauthor,
            keywords: pkeywords,
            foil: pfoil
          } = require(parPath);

          // Destructured join all parent data:
          file = file != undefined ? file : pfile;
          description = description != undefined ? description : pdescription;
          author = author != undefined ? author : pauthor,
          keywords = keywords != undefined ? keywords : pkeywords;

          foil = {
            ...pfoil,
            ...foil,
          };
        }
      }

      file = file ? file : 'index.md';
      description = description ? description : '';
      author = author ? author : 'Alain Galvan';
      keywords = keywords ? keywords : [];

      let {
        main,
        permalink,
        title,
        datePublished,
        image,
        data
      } = foil;

      // Check with database if the file has been modified.
      let filePath = path.join(pack, '..', file).replace(/\\/g, '/');

      if (!fs.statSync(filePath).isDirectory()) {

        let img = image == undefined ? getAsset(filePath, permalink) : image;

        let foilModule = {
          ...foil,
          title,
          description,
          keywords,
          datePublished: new Date(datePublished),
          dateModified: fs.statSync(filePath).mtime,
          parent,
          file: filePath,
          package: pack,
          permalink: '/' + permalink,
          image: '/' + img,
          main: '/' + main.replace(/\\/g, '/'),
          authors: [author]
        };

        var status = await checkIfModified(filePath);

        // If the file is modified or doesn't exist, try compiling it
        // Then add it to the portfolio database.
        if (status.isModified || status.doesNotExist) {
          let compiledModule = await compile(loaders, foilModule);
          await writeToDb(compiledModule);
        }
      }

    }

  }

}

/**
 * Compiles foil module by waterfalling through loaders.
 * @param loaders A matching algorithm and a compiler function.
 * @param foilModule Current foil module.
 */
async function compile(loaders: Loader[], foilModule: any) {

  // Check each loader for a match
  for (let rule of loaders) {

    // Perform deep comparison
    let compare = Object.keys(rule.test).reduce((prev, cur) => {
      let reg = new RegExp(rule.test[cur]);
      return prev || reg.test(foilModule[cur]);
    }, false);

    if (compare) {
      foilModule = await rule.loader(foilModule);
    }
  }

  return foilModule;
}