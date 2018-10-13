import builder from './builder';
import { ts, md } from './loaders';

/**
 * Loaders waterfall through, and performs a deep search on the loader. If the package matches,
 * The loader will execute, modifying the data along the way.
 */
let loaders = [
    ts,
    md
]

export async function build() {
    await builder(loaders);
};