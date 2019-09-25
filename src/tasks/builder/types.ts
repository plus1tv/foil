export type Post = {
    permalink: string;
    title: string;
    description: string;
    keywords: string[];
    authors: { name: string; email: string; url: string }[];

    // Metadata
    main: string;
    rootPath: string;
    rootPermalink: string;
    files: { path: string; modified: Date }[];
    data: any;
};

export type Loader = {
    test: {
        [key: string]: RegExp;
    };
    transform: (post: Post, modifiedFiles: Set<string>) => Promise<Post>;
};

export type BuildState = {
    // 🚒 Loaders and their transformer functions
    loaders: Loader[],
    // 🌟 Files that have already been processed
    modifiedFiles: Set<string>
}