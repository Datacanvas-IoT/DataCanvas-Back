const crypto = require('crypto');

function createAccessKeyPair() {
  const client = crypto.randomBytes(24).toString('hex');
  const secret = crypto.randomBytes(24).toString('hex');
  return { client, secret };
}

function calculateExpirationDate(validDurationDays) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + validDurationDays);
  return expirationDate;
}


function hashAccessKeyPair(keyPair) {
  return crypto.createHash('sha256').update(keyPair).digest('hex');
}

module.exports = {
  createAccessKeyPair,
  calculateExpirationDate,
  hashAccessKeyPair,
};
