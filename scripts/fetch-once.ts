import { config } from 'dotenv';
import { resolve } from 'path';
import { runFetchCycle } from '../src/lib/rss/pipeline';

config({ path: resolve(process.cwd(), '.env.local') });

runFetchCycle()
  .then(r => {
    console.log('done:', r);
    process.exit(r.failed > 0 ? 1 : 0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
