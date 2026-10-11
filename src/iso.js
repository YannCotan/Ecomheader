// Code propriétaire de conteneur au format ISO 6346 (ex. YCTU 123456 7), avec chiffre de contrôle réel.
const VAL = {};
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').reduce((v, ch) => {
  if (v % 11 === 0) v++;
  VAL[ch] = v;
  return v + 1;
}, 10);

export function isoCode(owner3, seed) {
  const digits = String(100000 + (Math.abs(seed) % 900000));
  const base = owner3 + 'U' + digits;
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    const ch = base[i];
    const v = /[A-Z]/.test(ch) ? VAL[ch] : +ch;
    sum += v * 2 ** i;
  }
  const check = (sum % 11) % 10;
  return { text: `${owner3}U ${digits} ${check}`, digits, check };
}
