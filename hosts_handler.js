const pty = require('node-pty')
const SSH_CMD = process.platform === 'win32' ? 'ssh.exe' : 'ssh'

class HostsHandler {
    constructor(ws) {
        this.ws = ws
        this.ws.onmessage = this.onMessage.bind(this)
    }
    onMessage(ev) {
        let [cmd, data] = JSON.parse(ev.data)
        if (cmd === 'connect') {
            this.doPtyConnect(data)
        } else if (cmd === 'typedone') {
            this.typedOne(data)
        } else if (cmd === 'typedall') {
            this.typedAll(data)
        } else if (cmd === 'resizeterm') {
            this.resizeTerm(data)
        }
    }
    doPtyConnect(hosts) {
        let self = this
        this.ptys = []
        let i = 0
        this.send('starting', hosts.length)
        for (let hst of hosts) {
            this.send('title', [i, 'Connecting '+hst+'...'])
            let hostPty = pty.spawn(SSH_CMD, [hst], {
                name: 'xterm-256color',
                cols: 80,
                rows: 24,
                cwd: process.env.HOME,
                env: process.env
            })
            hostPty.__id = i
            hostPty.on('data', function (data) {
                self.send('ptydata', [hostPty.__id, data])
            })
            hostPty.on('exit', function (code, signal) {
                hostPty.__exited = true
                self.send('ptyexit', [hostPty.__id, code, signal])
            })
            this.ptys.push(hostPty)
            i += 1
        }
    }
    typedOne(data) {
        let [idx, str] = data
        if (this.ptys[idx].__exited !== true) {
            this.ptys[idx].write(str)
        }
    }
    typedAll(data) {
        let str = data
        for (let hostPty of this.ptys) {
            if (hostPty.__exited !== true) {
                hostPty.write(str)
            }
        }
    }
    resizeTerm(data) {
        let [idx, sz] = data
        if (this.ptys[idx].__exited !== true) {
            this.ptys[idx].resize(sz.cols, sz.rows)
        }
    }
    send(cmd, data) {
        this.ws.send(JSON.stringify([cmd, data]))
    }
}

module.exports = HostsHandler
