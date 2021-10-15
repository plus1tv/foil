import test from 'ava';
import { testLoader } from '../src/tasks/builder';
import { blog } from '../src/tasks/builder/loaders';
test('Test Blog Loader', t => {
    const mock = {
        permalink: '/blog/mypost'
    };
    t.is(testLoader(blog, mock), true);
});
