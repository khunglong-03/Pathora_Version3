var fs = require('fs');
var path = require('path');

function findFiles(dir, ext, results) {
  results = results || [];
  try {
    var entries = fs.readdirSync(dir, { withFileTypes: true });
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var full = path.join(dir, e.name);
      if (e.isDirectory()) {
        findFiles(full, ext, results);
      } else if (ext.test(e.name)) {
        results.push(full);
      }
    }
  } catch(err) { results.push('ERROR ' + dir + ': ' + err.message); }
  return results;
}

var base = 'D:\\DoAn';
var tsx = findFiles(base, /\.tsx?$/, []);
tsx.forEach(function(f){ console.log(f); });
