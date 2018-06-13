'use strict';

function sortValue(object, sortKey = 'sort') {
  if (Array.isArray(object)) {
    return object.index && object.index[sortKey] ? object.index[sortKey] : 0;
  }

  return object[sortKey] || 0;
}

module.exports = function sort(directory) {
  const sortKey = directory.index && directory.index.sortBy ? directory.index.sortBy : 'sort';

  return directory.sort((a, b) => sortValue(b, sortKey) - sortValue(a, sortKey));
};
