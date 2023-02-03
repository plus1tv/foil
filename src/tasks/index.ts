import { clean } from './clean';
import { build } from './builder';
import { rssFeed } from './rss';
import { redirects } from './redirects';

export default [clean, build, rssFeed, redirects];
