const axios = require("axios");
const util = require("./util.js");
const config = require("./config.json");

async function main() {
  const headers = {
    Authorization: `Bearer ${config.v2token}`,
  };
  const { data } = await axios.get(
    "https://www.v2ex.com/api/v2/nodes/pet/topics",
    { headers }
  );
  const result = data.result
    .map((item) => ({ title: item.title, created: item.created }))
    .sort((a, b) => b.created - a.created);

  const now = Date.now();
  const newTopic = result[0];

  if (newTopic.created * 1000 > now - 24 * 60 * 60 * 1000) {
    newTopic.created = new Date(newTopic.created * 1000).toLocaleString(
      "zh-CN"
    );
    const msg = `你关注的宠物节点有新话题${newTopic.title},发布时间:${newTopic.created}。`;
    const title = "内容更新提示";
    const semd = await util.sendMessage(title, msg);
    return semd;
  }
}

main().then((res) => console.log(res.data));
