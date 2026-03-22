// Base62 character set — URL safe characters only
// 62 chars: a-z (26) + A-Z (26) + 0-9 (10)
const BASE62_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const BASE = 62;
const SHORT_CODE_LENGTH = 6;

/**
 * Encode a number to Base62 string
 * 
 * How it works (same as converting decimal to binary, but base 62):
 * Example: encode(12345)
 *   12345 % 62 = 21  → chars[21] = 'v'
 *   199   % 62 = 13  → chars[13] = 'n'
 *   3     % 62 = 3   → chars[3]  = 'd'
 *   Result: "dnv" (reversed)
 * 
 * In Java terms: like Integer.toString(num, 62) but with custom chars
 */
const encode = (num) => {
  if (num === 0) return BASE62_CHARS[0];

  let result = '';
  while (num > 0) {
    result = BASE62_CHARS[num % BASE] + result;
    num = Math.floor(num / BASE);
  }
  return result;
};

/**
 * Decode a Base62 string back to a number
 * Reverse of encode — useful for debugging
 */
const decode = (str) => {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = result * BASE + BASE62_CHARS.indexOf(str[i]);
  }
  return result;
};

/**
 * Generate a random short code of fixed length
 * 
 * Why random instead of sequential?
 * Sequential (1,2,3...) is predictable — anyone can guess links
 * Random is unpredictable — much more secure
 * 
 * 62^6 = 56 billion combinations — virtually no collisions
 */
const generateShortCode = () => {
  let code = '';
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * BASE);
    code += BASE62_CHARS[randomIndex];
  }
  return code;
};

/**
 * Validate that a URL is properly formatted
 * Returns true if valid, false if not
 */
const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

module.exports = { encode, decode, generateShortCode, isValidUrl };