import { clean } from './clean';
import { build } from './builder';
import { rssFeed } from './rss';

export default [
  clean,
  build,
  rssFeed
]