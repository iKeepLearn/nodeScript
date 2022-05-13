const axios = require("axios");

const config = require("./config.json");

async function sendMessage(title, content) {
  const fullPath = `${config.notifyUrl}?title=${title}&msg=${content}&secretkey=${config.notifyKey}`;
  const encoded = encodeURI(fullPath);
  const sendm = await axios.get(encoded);
  return sendm.data;
}

module.exports = {
  sendMessage,
};
