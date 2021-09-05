import builder from '../../resolve-foils';
import { ts, blog, book } from './loaders';

/**
 * Loaders waterfall through, and performs a deep search on the loader. If the package matches,
 * The loader will execute, modifying the data along the way.
 */
let loaders = [
    ts,
    blog,
    book
]

export async function build() {
    //await builder(loaders);
};