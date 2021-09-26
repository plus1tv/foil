import buildScripts from './tasks';
import { red, cyan, green, gray } from 'chalk';
import { Post } from './types';
export class Runner {
    async run(foils: Post[]) {
        // Run each task
        var scripts = Object.values(buildScripts);

        for (var i = 0; i < scripts.length; i++) {
            let progress = `(${i + 1}/${scripts.length})`;

            console.log(`👟 ${gray(` Running Task ${progress}...`)}\n`);

            await scripts[i](foils)
                .then(_ => {
                    console.log(
                        `\n✔️️ ${green(` Finished Task ${progress}!`)}`
                    );
                })
                .catch(err => {
                    console.log(`\n❌ ${red(` Failed Task ${progress}!`)}`);
                    console.error(err);
                });
        }
        console.log(
            '\n💮 ' + gray(` Finished processing ${scripts.length} tasks!\n`)
        );
    }
}