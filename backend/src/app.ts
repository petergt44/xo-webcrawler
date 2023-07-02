import { UrlLoaderService } from './services/url-loader.service.js'
import { Command } from 'commander'

interface AppParameters {
  url: string
  word: string
  depth: number
}

export const DEFAULT_URL = 'https://www.kayako.com/'

export class App {
  /* istanbul ignore next */
  constructor(private readonly urlLoader: UrlLoaderService, private readonly command = new Command()) {
  }

  async run(): Promise<void> {
    const appParameters = this.parseCli()

    await this.process(appParameters)
  }

  async process(appParameters: AppParameters): Promise<void> {
    const visitedUrls = new Set<string>();
    const queue = [{ url: appParameters.url, depth: 0 }];

    while (queue.length > 0) {
      const { url, depth } = queue.shift()!;
      visitedUrls.add(url);

      if (depth <= appParameters.depth) {
        const extractedText = await this.urlLoader.loadUrlTextAndLinks(url);
        const count = (extractedText.text.toLowerCase().match(new RegExp(appParameters.word, 'ig')) ?? []).length;
        console.log(`Found ${count} instances of '${appParameters.word}' in the body of the page at ${url}`);

        if (depth < appParameters.depth) {
          const links = extractedText.links.filter((link) => !visitedUrls.has(link));
          links.forEach((link) => queue.push({ url: link, depth: depth + 1 }));
        }
      }
    }
  }

  parseCli(argv: readonly string[] = process.argv): AppParameters {
    this.command
      .requiredOption('-u, --url <url>', 'URL to load', DEFAULT_URL)
      .option('-w, --word <word>', 'Word to search', 'kayako')
      .option('-d, --depth <depth>', 'Depth level', parseInt, 2);

    this.command.parse(argv);
    const options = this.command.opts();

    return { url: options.url, word: options.word, depth: options.depth };
  }
}
