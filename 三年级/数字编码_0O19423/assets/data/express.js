/*
 * 快递单号教学示例
 * 顺丰面单格式 https://open.sf-express.com/InternalWaybillGuide
 * 中通真实号段、韵达长度 https://www.luan.gov.cn/hdjl/dwzsk/10765511.html
 * 韵达13位查询提示 https://op.yundasys.com/opserver/pages/mailnoSearch/mailno_search.html
 * 韵达其他格式 https://www.guangde.gov.cn/News/show/1638392.html
 * 京东JDVA实物运单示例 https://www.usst.edu.cn/_upload/article/files/f9/37/1b4f31b74ac8bfba7a58ec47ecef/3b5bbce2-e09a-4993-a9ea-39b44a66439e.pdf
 * 京东JDX其他开头 https://scjgj.cq.gov.cn/zfxxgk_225/gsgg/qtgg/202502/t20250218_14317076.html
 * EMS国内数字单号 https://yz.jiangnan.edu.cn/info/1009/3639.htm
 * EMS其他格式 https://grs.hqu.edu.cn/info/1042/13670.htm
 * 仅展示可核实的代表性常见格式，不将任何一个开头当作公司的全部号段。
 */
var LIFE_EXPRESS_CARRIERS = [
  {
    key: 'sf',
    name: '顺丰速运',
    format: 'prefix',
    prefix: 'SF',
    digitCount: 13,
    values: ['SF', '1234567890123'],
    titles: ['号段开头', '运单序号'],
    otherFormats: '顺丰还有12位纯数字等单号格式。'
  },
  {
    key: 'zto',
    name: '中通快递',
    format: 'numeric',
    prefix: '755',
    digitCount: 15,
    groups: [3, 8, 4],
    values: ['755', '12345678', '9012'],
    titles: ['号段开头', '运单序号', '末段号码'],
    otherFormats: '中通还有756、783等开头的单号。'
  },
  {
    key: 'yunda',
    name: '韵达快递',
    format: 'numeric',
    prefix: '43',
    digitCount: 13,
    groups: [2, 7, 4],
    values: ['43', '1234567', '8901'],
    titles: ['号段开头', '运单序号', '末段号码'],
    otherFormats: '韵达也有46开头的15位数字单号。'
  },
  {
    key: 'jd',
    name: '京东快递',
    format: 'prefix',
    prefix: 'JDVA',
    digitCount: 11,
    values: ['JDVA', '12345678901'],
    titles: ['号段开头', '运单序号'],
    otherFormats: '京东还有JDX等其他开头的单号。'
  },
  {
    key: 'ems',
    name: '邮政 EMS',
    format: 'numeric',
    prefix: '10',
    digitCount: 13,
    groups: [2, 7, 4],
    values: ['10', '1234567', '8901'],
    titles: ['号段开头', '运单序号', '末段号码'],
    otherFormats: 'EMS还有11、12开头及EA…CN等字母格式。'
  }
];
