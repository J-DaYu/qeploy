const fs = require('fs');

function exists(pathTo){
  return fs.existsSync(pathTo) || fs.existsSync(pathTo);
}
function isFile(pathTo){
  return exists(pathTo) && fs.statSync(pathTo).isFile();
}
function isDirectory(pathTo){
  return exists(pathTo) && fs.statSync(pathTo).isDirectory();
}

module.exports = {
  isExists: exists,
  isFile: isFile,
  isDirectory: isDirectory
}
