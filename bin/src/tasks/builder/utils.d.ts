import { Post } from '../../types';
export declare function getAsset(file: string, permalink: string, image?: string): string;
export declare function makePermalink(file: string, root: string): string;
export declare function getDatabaseFiles(rootPath: string): Promise<any>;
export declare function writeToDb(foil: Post): Promise<void>;
