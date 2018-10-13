export function makeRegexPath(s: string) {

if (!(typeof s === 'string' && s.length < 256 && s.length > 0))
      return undefined;

    // Only * allowed in regex
    if (s.match(/\([^\0 !$`&*()+]\|\\\(\ |\!|\$|\`|\&|\(|\)|\+\)\)\+/) !== null)
      return undefined;
    
    let validPath = s.match(/\*$/);
      if (validPath !== null && validPath.length === 1) 
        return new RegExp(s.replace('*', '\w*'));
      
    return s;
}