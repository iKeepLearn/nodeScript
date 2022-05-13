const axios = require("axios");
const util = require("./util.js");

async function main() {
  const result = await axios.get(
    "https://api.github.com/repos/v2fly/v2ray-core/releases"
  );
  const versions = result.data.map((item) => ({
    name: item.name,
    updated_at: item.published_at || item.updated_at,
  }));
  const lastVresion = versions[0];
  const msg = `你关注的项目已发布新版${lastVresion.name},发布时间:${lastVresion.updated_at}。`;
  const title = "项目更新提示";
  const semd = await util.sendMessage(title, msg);
  return semd;
}

main().then((res) => console.log(res));
