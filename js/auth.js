/* The sign-in gate.

   This is a public GitHub Pages site — everything it ships can be read by
   anyone who looks. So the codes themselves are NOT here: only the SHA-256 of
   "klever-reports-2019:<code>". Someone with the repo and patience could still grind six digits
   offline, so treat this as a lock on a door, not a safe. It stops a stranger
   who finds the URL and it stops one person filing as another; it is not
   protection against someone determined.

   The codes live outside the repo. To change one, hash it the same way and
   replace the line. '*' is the Chairman: he sees the whole board.           */

const ACCESS_SALT = 'klever-reports-2019';

const ACCESS = [
  { p:'ephrata', h:'627f36c30eecdeeff7ce07da3d98f9991126f6ef806b815f763efefe296deb32' },
  { p:'liu', h:'8977431af29b46d29cebd0c4860f7a61aee9f1d7afa9e114809b07fda56228e3' },
  { p:'betty', h:'127af6c2cd4e9b3aa9aa03855c873f3432c94cd796b1ea335ea136e4a143ebcb' },
  { p:'getachew', h:'c6c5e588e0df3417b045240d823081fc63c1f041a6fba75104f8cd4f304c82a4' },
  { p:'yordanos', h:'a4328367bee04ac2fe1a9d9ebbd885df685fcc698efc299663c1304cbdab7b53' },
  { p:'amaha', h:'eaedcfa75334073ad5983a283e8229a482d95e282f0313346315d700ac46788f' },
  { p:'wude', h:'b1ae4bc1573ddd8ccd196c8281ac2cf3f66a85869883820b5b9fd6e7abb4b348' },
  { p:'elyas', h:'25538c43796fcff5a34471c0790e49705cbabecb12ad02ec5d182348a25b2007' },
  { p:'ashenafi', h:'2dfd6d74f4c17dce3e0c5296a6b9c7bcb4418cfc3105bfee8d1775676b8ecfd5' },
  { p:'tsega', h:'71e29d56c952dc480f3d6b757d3978c1cd7972d5f905a1631ca03a0fd209ec51' },
  { p:'biruktayet', h:'d92b03067269a1029300024a4a9b57c29e85867782d5a1a1a9063938fdea757a' },
  { p:'yohannis', h:'1c787926b8a391b4fa147519bc3261d4ba2d9ac2f4677ad5eae5ba99ac40c214' },
  { p:'yonas', h:'aaafea6873819a0d1653e42af115fb6c3bfce93ad0cb1cd473a67ca7bb0c67ee' },
  { p:'abrham-g', h:'91f631dd89683e5e79f91843e340f83a98319651067569f4a32916d7a1460bc1' },
  { p:'teklweld', h:'b9186ee5a1aa4d42eb0ebdf1d90bb33789a7f0313eb566f4758e73232d46420d' },
  { p:'abrham-w', h:'2c80ebe9acdb12c39ece95eebd0924c4e4fa93d5e49c7e6fe2d8611207cbc59b' },
  { p:'*', h:'b6d94d86844bc5f76fe95385d5a9fcd5ab80259420e5825c619af96ca86d3cbe' }
];

/* SHA-256 in plain JavaScript, because crypto.subtle needs a secure context
   and this page must also work when opened straight from a file. */
function sha256(msg) {
  var K = [], H = [], i, j, p = 2, n = 0;
  function isPrime(x) { for (var d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; }
  for (p = 2, n = 0; n < 64; p++) {
    if (!isPrime(p)) continue;
    K[n] = Math.floor((Math.cbrt(p) % 1) * 4294967296) | 0;
    if (n < 8) H[n] = Math.floor((Math.sqrt(p) % 1) * 4294967296) | 0;
    n++;
  }
  var bytes = [];
  for (i = 0; i < msg.length; i++) {
    var c = msg.charCodeAt(i);
    if (c < 128) bytes.push(c);
    else if (c < 2048) bytes.push(192 | c >> 6, 128 | c & 63);
    else bytes.push(224 | c >> 12, 128 | (c >> 6) & 63, 128 | c & 63);
  }
  var bitLen = bytes.length * 8;
  bytes.push(128);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (i = 7; i >= 0; i--) bytes.push((bitLen / Math.pow(2, i * 8)) & 255);

  var w = new Array(64);
  function rr(x, k) { return (x >>> k) | (x << (32 - k)); }
  for (i = 0; i < bytes.length; i += 64) {
    for (j = 0; j < 16; j++)
      w[j] = (bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) |
             (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3];
    for (j = 16; j < 64; j++) {
      var s0 = rr(w[j - 15], 7) ^ rr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      var s1 = rr(w[j - 2], 17) ^ rr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }
    var a = H[0], b = H[1], c2 = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (j = 0; j < 64; j++) {
      var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
      var ch = (e & f) ^ (~e & g);
      var t1 = (h + S1 + ch + K[j] + w[j]) | 0;
      var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
      var mj = (a & b) ^ (a & c2) ^ (b & c2);
      var t2 = (S0 + mj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0;
      d = c2; c2 = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c2) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
}

var AUTH = {
  KEY: 'klever.who',
  who: function () {
    try { return localStorage.getItem(this.KEY) || null; } catch (e) { return null; }
  },
  signIn: function (code) {
    var h = sha256(ACCESS_SALT + ':' + String(code).trim());
    for (var i = 0; i < ACCESS.length; i++) {
      if (ACCESS[i].h === h) {
        try { localStorage.setItem(this.KEY, ACCESS[i].p); } catch (e) {}
        return ACCESS[i].p;
      }
    }
    return null;
  },
  signOut: function () { try { localStorage.removeItem(this.KEY); } catch (e) {} },
  isChairman: function () { return this.who() === '*'; },
  /* the Chairman may open anyone's form; everyone else only their own */
  mayOpen: function (report) {
    var w = this.who();
    return w === '*' || (w !== null && report.person === w);
  }
};
