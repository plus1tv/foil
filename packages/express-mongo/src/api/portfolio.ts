import { Request, Response } from 'express';
import { database } from '../db';


/**
 * API Request Schema
 */
export type APISanitized = {
  // Find post with this exact permalink
  permalink: string | RegExp,
  // Find posts where these keywords are present
  keywords?: {
    $in: string[]
  }
  // Skip the x number of posts
  skip: number,
  // Limit the number of posts to this amount
  limit: number
} | {
  $or: {
    permalink: string
  }[],
  // Skip the x number of posts
  skip: number,
  // Limit the number of posts to this amount
  limit: number
}

/**
 * 
 */
export type APIRequest = {
  permalink?: string,
  data?: boolean,
  keywords?: string[]
}

/**
 * Sanitizes the API's Input.
 */
function sanitize(reqBody): APISanitized {

  let {
    skip,
    limit,
    permalink,
    keywords
  } = reqBody;

  // Define some helper functions
  let inRange = (v, a, b, def) => (v > a && v < b) ? v : def;

  let isArray = arr => (Array.isArray(arr) && arr.reduce((prev, cur) => prev && typeof cur === 'string', true)) ? { $in: arr } : undefined;

  let makeRegexPath = (s: string) => {
    if (!(typeof s === 'string' && s.length < 256 && s.length > 0))
      return undefined;

    // Check if there's a * only at the end
    var validPathCheck = s.match(/\([^\0 !$`&*()+]\|\\\(\ |\!|\$|\`|\&|\*|\(|\)|\+\)\)\+/);
    if (validPathCheck !== null) {
      if (validPathCheck.length === 1 && s.match(/\*$/) !== null) {
        return new RegExp(s.replace('*', '\w*'));
      }
      return undefined;
    }
    return s;
  };

  try {

    let cleanReq;

    if (Array.isArray(permalink)) {

      cleanReq = {
        $or: permalink.map(p => ({
          permalink: typeof p == 'string' ? p : '',
          datePublished: { $lte: new Date() }
        })),
        limit: inRange(limit, 1, 30, 15),
        skip: 0
      };
    }
    else {
      cleanReq = {
        skip: inRange(skip, 0, 1000, 0),
        limit: inRange(limit, 1, 30, 15),
        permalink: makeRegexPath(permalink),
        keywords: isArray(keywords),
        datePublished: { $lte: new Date() }
      };
    }
    // Remove Undefined Keys
    Object.keys(cleanReq).map((k) => (cleanReq[k] === undefined) ? delete cleanReq[k] : null);

    return cleanReq;
  }
  catch (e) {
    return {
      permalink: '',
      skip: 0,
      limit: 15
    }
  }


}

/**
 * An API Endpoint requesting blog posts.
 */
export default (req: Request, res: Response) => {

  // Get POST parameters
  let apiReq: APISanitized = sanitize(req.body);

  // Design Query
  let query = {
    ...apiReq
  };

  delete query.limit;
  delete query.skip;

  // Responses
  let failure = () => res.status(400).json({ error: "We can't find these posts. :(" });
  let success = msg => res.status(200).json(msg);

  database.then(
    client => {
      let db = client.db('db');
      let c = db.collection('portfolio');

      let projection = {
        file: 0,
        package: 0
      }

      let data = c.find(query, projection)
        .sort({
          datePublished: -1
        })
        .skip(apiReq.skip)
        .limit(apiReq.limit)
        .toArray((err, data) => {
          if (err || data.length === 0)
            return failure();
          success(data);
        });
    });
}