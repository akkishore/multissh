const http = require('http')
const HttpDispatcher = require('httpdispatcher')
const WebSocket = require('ws')
const utils = require('./utils')
const HostsHandler = require('./hosts_handler')
const nodepath = require('path')
const open = require('open')

let dispatcher = new HttpDispatcher()

dispatcher.setStatic('/public')
dispatcher.setStaticDirname(nodepath.join(__dirname, 'public'))

dispatcher.onGet('/', function (req, res) {
  utils.serveStaticFile(nodepath.join(__dirname, './public/main.html'), 'text/html', req, res)
})

dispatcher.onGet('/host_groups', function (req, res) {
  let conf = utils.getConf()
  res.writeHeader(200, { 'Content-Type': 'application/json' })
  res.write(JSON.stringify(conf), 'utf-8')
  res.end()
})


async function _start() {
  try {
    let ok = await utils.checkConf()
    if (ok) {
      let server = http.createServer(function (req, res) {
        dispatcher.dispatch(req, res);
      })
      let wss = new WebSocket.Server({noServer: true})
      wss.on('connection', function (ws) {
        new HostsHandler(ws)
      })
      server.on('upgrade', function upgrade(request, socket, head) {
        wss.handleUpgrade(request, socket, head, function (ws) {
          wss.emit('connection', ws, request)
        })
      })
      server.listen(12321, '127.0.0.1');
      console.log('Listening on port 12321')
      open('http://127.0.0.1:12321/')
    }
  } catch (e) {
    console.log('Error', e)
  }
}

_start()