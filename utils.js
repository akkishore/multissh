const nodepath = require('path')
const fsProm = require('fs').promises
const os = require('os')
const fs = require('fs')

const confFile = '.multissh.conf'
const confPath = nodepath.join(os.homedir(), confFile)
const noConfFileMsg = `No hosts provided in command line and no config file found at '${confPath}', following is a sample config file, edit it and save to your ${confFile} config file:
[
  {"group": "Host group 1",
   "hosts": [
    "user@domain1.of.host.com",
    "user@domain2.of.host.com"
  ]},
  {"group": "Host group 2",
   "hosts": [
    "user@another1.domain.of.host.com",
    "user@another2.domain.of.host.com"
  ]}
]
`
let _hostConf = {}

let utils = {
  checkConf: async function () {
    if (process.argv.length > 2) {
      _hostConf['cmdhosts'] = process.argv.slice(2)
    }
    try {
      let fdj = await fsProm.readFile(confPath, 'utf-8')
      _hostConf['confhosts'] = JSON.parse(fdj)
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log(noConfFileMsg)
      } else {
        console.log(`Error in reading config file '${confPath}'`, err)
      }
    }
    return ('cmdhosts' in _hostConf || 'confhosts' in _hostConf)
  },
  getConf: function () {
    return _hostConf
  },
  serveStaticFile: function (path, ct, req, res) {
    fs.readFile(path, function (err, fileData) {
      if (err) {
        res.writeHead(500)
        res.end()
      } else {
        res.writeHeader(200, { 'Content-Type': ct })
        res.write(fileData, 'binary')
        res.end()
      }
    })
  }
}

module.exports = utils