declare let config: {
    title: string;
    author: {
        name: string;
        email: string;
        url: string;
    };
    tags: string[];
    cover: string;
    description: string;
    files: string[];
    redirects: any[];
    currentDir: string;
    foilCliRoot: string;
    mongoUrl: string;
};
export { config };
