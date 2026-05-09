const os = require('os');

function isPrivateIPv4(ip) {
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const octets = ip.split('.');
    const second = Number(octets[1]);
    return second >= 16 && second <= 31;
  }
  return false;
}

function pickLanIp() {
  const nets = os.networkInterfaces();
  const preferred = [];
  const fallback = [];

  for (const [name, addrs] of Object.entries(nets)) {
    if (!Array.isArray(addrs)) continue;

    for (const addr of addrs) {
      if (!addr || addr.family !== 'IPv4' || addr.internal) continue;
      const entry = { name, ip: addr.address };

      if (isPrivateIPv4(addr.address) && /^en\d+$/i.test(name)) {
        preferred.push(entry);
      } else if (isPrivateIPv4(addr.address)) {
        fallback.push(entry);
      } else {
        fallback.push(entry);
      }
    }
  }

  const picked = preferred[0] || fallback[0];
  return picked ? picked.ip : '127.0.0.1';
}

process.stdout.write(pickLanIp());
