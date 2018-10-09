/**
 * ✨ Foilfolio
 * Compiles the portfolio and populates it in MongoDB. 
 * Each portfolio item has a unique Build step.
 */

import { red, cyan, green, gray } from 'chalk';
import buildScripts from './tasks';

async function main() {

  // Start Build Process
  console.log(
    cyan('✨ Foilfolio v0.1.0')
  );

  // Run each task
  var scripts = Object.values(buildScripts);

  for (var i = 0; i < scripts.length; i++) {

    let progress = `(${i + 1}/${scripts.length})`;

    console.log(`\n👟 ${gray(`Running Task ${progress}...`)}\n`);

    await scripts[i]()
      .then(res => {
        console.log(`\n✔️️ ${green(`Finished Task ${progress}!`)}\n`);
      })
      .catch(err => {
        console.log(`\n❌ ${red(`Failed Task ${progress}!`)}\n`);
        console.error(err);
      });

  }
  console.log('\n💮 ' + gray(`Finished processing ${scripts.length} tasks!\n`));

  return process.exit();
};

main();
