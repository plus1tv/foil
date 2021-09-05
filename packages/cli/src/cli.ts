#!/usr/bin/env node
/**
 * ✨ Foil
 * A sparkly shiny portfolio management system.
 * 📚 Populate your database with relevant metadata from your portfolio.
 */

import { red, cyan, green, gray } from 'chalk';
import { isProduction, isWatch } from './env';
import { version } from '../package.json';
import { config } from './config';
import resolveFoils from './resolve-foils';
import { Post } from './types';
export async function foil() {
    console.log(
        cyan('✨ Foil v' + version) +
            gray(isProduction ? ' (production)' : ' (development)')
    );
    console.log('👋 Hi ' + config.author.name + '!')

    // Compile all modified Foil modules
    let foils: Post[] = await resolveFoils();

    if(foils.length > 0)
    {
        console.log( gray('🎡 Processing ' + foils.length + ' files.') )
    }
    return process.exit();
}

foil();
