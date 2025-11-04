import componentLoader from '../dist/admin-panel/component-loader.js'

import { bundle } from '@adminjs/bundler'

void (async () => {
  await bundle({
    componentLoader,
    destinationDir: './.adminjs',
  })
})()