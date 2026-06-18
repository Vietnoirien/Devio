const html = `<p>{"message": "Type '\\"test\\"' is not assignable"}</p>`;
const cheerio = require('cheerio');
const $ = cheerio.load(html);
const text = $('p').text();
console.log("Extracted text:", text);
try {
  console.log(JSON.parse(text));
} catch (e) {
  console.log("Parse error:", e.message);
}
