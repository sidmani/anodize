module.exports.matchAll = function (regex, str) {
  let results = [];
  let o;
  while ((o = regex.exec(str)) !== null) {
    results.push(o);
  }
  return results;
};
