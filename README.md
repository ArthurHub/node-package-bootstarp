# Node Package Bootstrap

node -> pkg -> bootstrap -> run

## WIP

Utility to package a Node.js app into a single executable file requiring zero dependencies.

### Strategy

Package `node.exe`, `node_modules` folder, and app `bundle.js` into a single node executable created with [pkg](https://www.npmjs.com/package/pkg). Running the executable bootstraps node by extracting the embedded node app and running it in a temporary folder.

### Flow

1. Bundle node app into a single js file with as many node modules dependencies as possible.
   1. Using whatever bundler
   1. Excluding node dependencies that cannot be bundled. For using workers, external utils, etc.
1. Create a separate `node_modules` folder of the node dependencies that could not be bundled
   1. Running `npm install`
   1. Cleaning `node_modules` folder from symlinks and non-prod files.
1. Archive the `node_modules` folder
1. Archive selected `node.exe` executable
1. Create a single executable file using [pkg](https://www.npmjs.com/package/pkg) that executes `bootstrap.js` and incudes node_modules archive, node.exe archive, and app bundle file.
1. Running the node-executable created by pkg
   1. Create a temp folder for the node app
   1. Extract node.exe
   1. Extract node_modules
   1. Copy app bundle
   1. Run node app with the extracted node and app bundle `tmpfolder/node.exe tmpfolder/bundle.js`
