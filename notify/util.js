const cloud = require("wx-server-sdk");
const https = require("https");
const axios = require("axios");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
const logger = cloud.logger();
const config = require("./config.json");

function formatDate(date, str, hasTime) {
  date = new Date(date);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  if (hasTime) {
    return (
      [year, month, day].map(formatNumber).join(str || "-") +
      " " +
      [hour, minute, second].map(formatNumber).join(":")
    );
  }

  return [year, month, day].map(formatNumber).join(str || "-");
}

const formatNumber = (n) => {
  n = n.toString();
  return n[1] ? n : "0" + n;
};

function httpRequest(params, postData) {
  return new Promise(function (resolve, reject) {
    let req = https.request(params, function (res) {
      // reject on bad status
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error("statusCode=" + res.statusCode));
      }
      // cumulate data
      let body = [];
      res.on("data", function (chunk) {
        body.push(chunk);
      });
      // resolve on end
      res.on("end", function () {
        try {
          body = JSON.parse(Buffer.concat(body).toString());
        } catch (e) {
          reject(e);
        }
        resolve(body);
      });
    });

    // reject on request error
    req.on("error", function (err) {
      // This is not a "Second reject", just a different sort of failure
      reject(err);
    });

    req.on("timeout", () => {
      req.abort();
    });

    if (postData) {
      req.write(postData);
    }
    // IMPORTANT
    req.end();
  });
}

async function getAccessToken(now) {
  const { data } = await db
    .collection("setting")
    .where({
      config_name: "access_token",
      expire_time: _.gt(now),
    })
    .get();
  if (data.length) {
    return {
      token: data[0].access_token,
    };
  } else {
    const { access_token } = await getAccessTokenFromWeixin(now);
    return {
      token: access_token,
    };
  }
}

async function getAccessTokenFromWeixin(now) {
  const options = {
    hostname: "api.weixin.qq.com",
    port: 443,
    path: `/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.secretKey}`,
    method: "GET",
    timeout: 800,
  };

  const result = {};

  try {
    const { access_token, expires_in } = await httpRequest(options);
    result.expires_in = expires_in;
    result.access_token = access_token;
    const addToken = db
      .collection("setting")
      .where({
        config_name: "access_token",
      })
      .update({
        data: {
          access_token,
          expires_in,
          expire_time: now + expires_in * 1000,
        },
      });
  } catch (error) {
    logger.info({
      error,
    });
  }

  return result;
}

async function sendMessage(sendData, now, touser) {
  const { token } = await getAccessToken(now);
  const sendMpData = {
    touser: touser,
    mp_template_msg: {
      appid: config.serviceAccountId,
      template_id: config.templateId,
      url: "http://weixin.qq.com/download",
      miniprogram: {
        appid: config.appId,
        pagepath: "/admin/index",
      },
      data: sendData,
    },
  };

  const result = {};

  const fullPath = `https://api.weixin.qq.com/cgi-bin/message/wxopen/template/uniform_send?access_token=${token}`;
  const res = await axios.post(fullPath, sendMpData);

  return result;
}

module.exports = {
  httpRequest,
  getAccessToken,
  sendMessage,
  formatDate,
};
