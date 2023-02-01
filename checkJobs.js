const axios = require("axios");
const util = require("./util.js");
const config = require("./config.json");

async function main() {
  const headers = {
    Authorization: `Bearer ${config.v2token}`,
  };
  const { data } = await axios.get(
    "https://www.v2ex.com/api/v2/nodes/jobs/topics",
    { headers }
  );
  const result = data.result
    .map((item) => ({
      title: item.title,
      created: item.created,
      url: item.url,
    }))
    .sort((a, b) => b.created - a.created);

  const now = Date.now();

  const topics = result.filter(
    (item) => item.created * 1000 > now - 24 * 60 * 60 * 1000
  );

  const topicsRes = topics.map((item) => {
    const created = new Date(item.created * 1000).toLocaleString("zh-CN");
    return {
      ...item,
      created,
    };
  });

  const title = topicsRes.map((item) => item.title).join(";");
  const msg = `24小时内话题${topicsRes.length}个，分别为${title}`;

  console.log(topicsRes, { msg });
  const alertTitle = "内容更新提示";
  const semd = await util.sendMessage(alertTitle, msg);
  return semd;
}

main().then((res) => console.log(res.data));
