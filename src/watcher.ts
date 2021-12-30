import chalk from 'chalk';
const { gray } = chalk;
import resolveFoils from './resolve-foils';
import { Runner } from './runner';
import { Post } from './types';

enum WatcherState {
    Initial,
    Watching,
    Processing,
    Done
}

export class Watcher {
    watch = async (startFoils: Post[]) => {
        let state = WatcherState.Initial;
        const runner = new Runner();
        let foils: Post[] = [];
        const stateMachine = async () => {
            switch (+state) {
                case WatcherState.Initial: {
                    if (startFoils.length > 0) {
                        await runner.run(startFoils);
                    }
                    console.log(gray('\n👀  · Watching for changes... · \n'));
                    state = WatcherState.Watching;
                    break;
                }
                case WatcherState.Watching: {
                    foils = await resolveFoils();
                    if (foils.length > 0) {
                        state = WatcherState.Processing;
                    }
                    break;
                }
                case WatcherState.Processing: {
                    if (foils.length > 0) {
                        await runner.run(foils);
                    }
                    state = WatcherState.Done;
                    break;
                }
                case WatcherState.Done: {
                    console.log(gray('\n👀  · Watching for changes... · \n'));
                    state = WatcherState.Watching;
                    break;
                }
            }
            await stateMachine();
        };
        await stateMachine();
    };
}
