const path = require("path");
const { definedNoApiConfig } = require("@zmn/noapi");
module.exports = definedNoApiConfig({
  swUrl: "https://test3-devops.xiujiadian.com/swagger/doc.json",
  outDir: path.resolve("./src/api"),
  definition: {
    outDir: path.resolve("./src/model"),
  },
});
