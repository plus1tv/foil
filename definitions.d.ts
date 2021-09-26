declare module 'main';
declare module 'chalk';

declare module 'id3js' {
  type ITags = {
    artist: string,
    title: string,
    album: string,
    year: string,
    v1: {
      title: string,
      artist: string,
      album: string,
      year: string,
      comment: string,
      track: string,
      version: number
    },
    v2: {
      band: string,
      composer: string,
      'set-part': string,
      genre: string,
      title: string,
      track: string,
      artist: string,
      album: string,
      version: [number, number],
      image: {
        type: string,
        mime: string,
        description: string,
        data: ArrayBuffer
      }
    }
  }
  function id3js(file: { file: string, type?: any }, callback: (err, tags: ITags) => void);

  namespace id3js {

    export var OPEN_LOCAL;

  }

  export = id3js;
}

declare module 'find' {
  export function file(path: string, callback: (files: string[]) => void)
  export function file(pattern: RegExp, path: string, callback: (files: string[]) => void)

  export function fileSync(path: string): string[]
  export function fileSync(pattern: RegExp, path: string): string[]
}