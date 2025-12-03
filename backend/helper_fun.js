const ZKtoHG = (str) => {
  return str.replace(/[\u30A1-\u30F6]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0x60);
  });
};

module.exports = { ZKtoHG };