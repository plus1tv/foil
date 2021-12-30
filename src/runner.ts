import buildScripts from './tasks';
import chalk from 'chalk';
const { red, green, gray } = chalk;
import { Post } from './types';
export class Runner {
    async run(foils: Post[]) {
        // Run each task
        var scripts = Object.values(buildScripts);

        for (var i = 0; i < scripts.length; i++) {
            let progress = `(${i + 1}/${scripts.length})`;

            console.log(`\n👟 ${gray(` Running Task ${progress}...`)}`);

            await scripts[i](foils)
                .then(_ => {
                    console.log(
                        `✔️️ ${green(` Finished Task ${progress}!`)}`
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