// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const logger = cloud.logger();
const util = require("./util");
const config = require("./config.json");

// 云函数入口函数
exports.main = async (event, context) => {
  const now = Date.now();
  const queryStringParameters = event.queryStringParameters || {};
  const title = queryStringParameters.title || "测试标题";
  const msg = queryStringParameters.msg || "测试消息";
  const secretkey = queryStringParameters.secretkey;

  let result = {
    errCode: 0,
    errMessage: "执行成功",
  };

  if (secretkey != config.sendKey) {
    return result;
  }

  const sendMpData = {
    first: {
      value: title,
      color: "#bd2638",
    },
    keyword1: {
      value: "管理员",
      color: "#173177",
    },
    keyword2: {
      value: title,
      color: "#173177",
    },
    keyword3: {
      value: util.formatDate(now, "-", true),
      color: "#173177",
    },

    remark: {
      value: msg,
      color: "#e2244e",
    },
  };

  const res = await util.sendMessage(sendMpData, now);
  result = Object.assign(result, res);
  return result;
};
