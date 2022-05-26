class HostConfig {
    constructor() {
        this.no_conf_modal = new mdb.Modal(document.getElementById("no_conf"))
        this.inputArea = document.getElementById('inputarea')
        this.connector = null
    }
    async fetchConf() {
        this.inputArea.value = 'Fetching conf...'
        let respj = await fetch('/host_groups')
        this.conf = await respj.json()
    }
    render() {
        let self = this
        let lis = []
        let i = 0
        this.inputArea.value = 'Select Host Group to connect'
        if ('confhosts' in this.conf) {
            for (let {group, hosts} of this.conf['confhosts']) {
                lis.push(`<li><a class="dropdown-item host-group-name" href="javascript:void(0)">${group}</a></li>`)
                i += 1
            }
            document.getElementById('host-groups').innerHTML = lis.join("\n")
            let hgelems = document.getElementsByClassName('host-group-name')
            hgelems.forEach(function (elem, i) {
                elem.addEventListener('click', function () {
                    self.connect(self.conf['confhosts'][i]['hosts'])
                })
            })
            // let nohgelems = document.getElementsByClassName('no-host-group-name')
            // if (nohgelems.length > 0) {
            //     nohgelems[0].addEventListener('click', function () {
            //         alert("No '.multissh.conf' file in your HOME folder")
            //     })
            // }
        } else {
            let self = this
            document.getElementById('dropdownMenuButton').addEventListener('mousedown', function () {
                self.no_conf_modal.show()
            })
        }
        if ('cmdhosts' in this.conf) {
            this.connect(this.conf['cmdhosts'])
        }
    }
    async connect(hosts) {
        if (this.connector) {
            this.connector.disconnect()
        }
        this.connector = new HostConnect(hosts)
    }
}