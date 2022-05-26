window.onload = async function() {
  document.getElementById('inputarea').value = 'No status'
  document.getElementById('inputarea').onkeyup = function(ev) { return false; }
  let _config = new HostConfig()
  await _config.fetchConf()
  _config.render()
}