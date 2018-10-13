/**
 * Portfolio Item Schema
 */
export type PortfolioItem = {
  // Indexing Data
  title: string,
  authors: string[],
  description: string,
  keywords: string[],
  datePublished: Date,
  dateModified: Date,
  permalink: string,
  image: string,
  // App Data
  main: string,
  data: any
}

/**
 * Redirection Schema
 * 
 * Ex: { from: '/blog/raw-vulkan/cover.jpg', to: 'D:/Pictures/...'}
 * Or: { from '/blog', to '/blog/*' } 
 */
export type Redirect = {
  from: string,
  to: string,
  dateModified: Date
}