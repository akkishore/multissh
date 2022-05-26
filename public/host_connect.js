class HostConnect {
    constructor(hsts) {
        this.connected = false
        this.hosts = hsts
        this.inputArea = document.getElementById('inputarea')
        this.ws = new WebSocket(`ws://${location.host}/`)
        this.ws.onopen = this.connectToHosts.bind(this)
        this.ws.onmessage = this.onMessage.bind(this)
        this.ws.onclose = this.disconnect.bind(this)
    }
    connectToHosts() {
        this.connected = true
        this.inputArea.value = `Connecting to ${this.hosts.length} hosts...`
        this.send('connect', this.hosts)
    }
    startTerms(hostsNum) {
        let self = this
        let termsHtml = []
        let [tw,th] = this.getTermWidthHeight(hostsNum)
        for (let i=0;i<hostsNum;i++) {
            let termHtml = `<div class="term" style="width:${tw}px"><div id="term_title_${i}" class="term-title small">Host ${i}</div><div id="term_body_${i}" class="term-body" style="height:${th}px"></div></div>`
            termsHtml.push(termHtml)
        }
        document.getElementById('multiterm').innerHTML = termsHtml.join('\n')
        this.terms = []
        for (let i=0;i<hostsNum;i++) {
            let _i = i
            let term = new Terminal()
            let fitAddon = new FitAddon.FitAddon()
            term.__fitAddon = fitAddon
            term.setOption('fontSize', 14)
            term.setOption('bellStyle', 'visual')
            // term.setOption('fontFamily', 'Source Code Pro')
            term.loadAddon(fitAddon)
            term.open(document.getElementById('term_body_'+i))
            term.focus()
            term.onTitleChange(function (title) {
                document.getElementById('term_title_'+_i).innerText = title
            })
            term.onResize(function (sz) {
                self.resizeTerm(_i, sz)
            })
            fitAddon.fit();
            term.onData(function (e) {
                // console.log('onedata', e)
                self.typedOne(_i, e)
            })
            this.terms.push(term)
        }
        this.inputArea.focus()
        this.inputArea.value = `Focus here for parallel input to ${this.terms.length} hosts`
        this.addEventListeners()
    }
    addEventListeners() {
        let self = this
        this.inputArea.onkeydown = function (ev) {
            // console.log('keydown', ev)
            // NOTE: xterm.js does not process SPACE with keydown event, [1] is responsible for it, used that line
            // to process SPACE also in keydown event, also directly sending to backend pty if 1 key length for efficiency
            // [1]: https://github.com/xtermjs/xterm.js/blob/master/src/common/input/Keyboard.ts#L363
            if (ev.key && !ev.ctrlKey && !ev.altKey && !ev.metaKey && (ev.keyCode === 32 /* SPACE */ || ev.keyCode >= 48) && ev.key.length === 1) {
                self.typedAll(ev.key)
            } else if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'v' || ev.key === 'V')) {
                return true
            } else {
                for (let term of self.terms) {
                    let nev = new ev.constructor(ev.type, ev);
                    term.textarea.dispatchEvent(nev)
                }
            }
            return false
        }
        this.inputArea.onpaste = function (ev) {
            // console.log('paste', ev)
            let paste = (event.clipboardData || window.clipboardData).getData('text');
            self.typedAll(paste)
            return false
        }
        document.getElementById('right_controls').style.visibility = 'visible'
        this._incfs = this.changeFontSize.bind(this, 1)
        this._decfs = this.changeFontSize.bind(this, -1)
        document.getElementById('font_up').addEventListener('click', this._incfs)
        document.getElementById('font_down').addEventListener('click', this._decfs)
    }
    removeEventListeners() {
        let self = this
        this.inputArea.onkeydown = null
        this.inputArea.onpaste = null
        document.getElementById('right_controls').style.visibility = 'hidden'
        document.getElementById('font_up').removeEventListener('click', this._incfs)
        document.getElementById('font_down').removeEventListener('click', this._decfs)
    }
    changeFontSize(ch) {
        let fs = this.terms[0].getOption('fontSize')
        for (let term of this.terms) {
            term.setOption('fontSize', fs+ch)
            term.__fitAddon.fit()
        }
        this.inputArea.focus()
    }
    updateTerm(data) {
        let [ptyIdx, ptyData] = data
        this.terms[ptyIdx].write(ptyData)
    }
    updateTitle(data) {
        let [ptyIdx, title] = data
        document.getElementById('term_title_'+ptyIdx).innerText = title
    }
    typedOne(idx, str) {
        this.send('typedone', [idx, str])
    }
    typedAll(str) {
        this.send('typedall', str)
    }
    resizeTerm(idx, sz) {
        // console.log('sending resize', idx, sz)
        this.send('resizeterm', [idx, sz])
    }
    exitTerm(data) {
        let [ptyIdx, code, signal] = data
        this.terms[ptyIdx].write(`\x1B[1;3;31mExited with code ${code} and signal ${signal}\x1B[0m`)
    }
    onMessage(ev) {
        let [cmd,data] = JSON.parse(ev.data)
        if (cmd === 'starting') {
            this.startTerms(data)
        } else if (cmd === 'title') {
            this.updateTitle(data)
        } else if (cmd === 'ptydata') {
            this.updateTerm(data)
        } else if (cmd === 'ptyexit') {
            this.exitTerm(data)
        }
        // console.log(cmd, data)
    }
    send(cmd, data) {
        this.ws.send(JSON.stringify([cmd, data]))
    }
    disconnect() {
        if (!this.connected) {
            return
        }
        this.removeEventListeners()
        for (let term of this.terms) {
            term.dispose()
        }
        this.terms = null
        let div = document.getElementById('multiterm')
        while(div.firstChild) {
            div.removeChild(div.firstChild);
        }
        this.inputArea.value = 'Select Host Group to connect'
        this.ws.close()
        this.connected = false
    }

    getTermWidthHeight(hostsNum) {
        let sq = Math.floor(Math.sqrt(hostsNum))
        let nc, nr
        if (hostsNum % sq === 0) {
            nr = hostsNum / sq
            nc = sq
        } else {
            nr = Math.floor(hostsNum / sq) + 1
            nc = sq
        }
        let tw = window.innerWidth/nc
        let th = (window.innerHeight-document.getElementsByClassName('navbar')[0].clientHeight)/nr
        return [tw-5,th-30]
    }
}