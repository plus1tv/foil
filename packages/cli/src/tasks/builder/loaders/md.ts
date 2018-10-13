import markademic from 'markademic';
import { join } from 'path';
import { readFileSync } from 'fs';

export let md = {
  test: { file: /\.md$/, permalink: /^blog/ },
  loader: async foil => {

    var config = {
      input: readFileSync(foil.file).toString(),
      rerouteLinks: (link) => join(foil.permalink, link)
    };

    if (typeof foil['references'] !== undefined) {
      config['citations'] = foil['references'];
    }

    var data = "";

    try {
      data = markademic(config);
    }
    catch (e) {
      console.error('Markademic', e.message);
    }

    return {
      ...foil,
      data
    }
  }
}