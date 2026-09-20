/* 养生:每日贴士按日期轮换(本地计算,无需联网) */
const WELLNESS_TIPS = [
  '早起一杯温水,唤醒肠胃;早餐一定要吃热的。',
  '久坐 1 小时起身活动 3 分钟,比周末狂运动更养身。',
  '晚上 23 点前睡觉,子时胆经当令,是身体修复黄金期。',
  '泡脚水温 40°C 左右,15~20 分钟微微出汗即可,别大汗。',
  '上午晒背 15 分钟,补阳气又促进钙吸收。',
  '饭后不要立刻躺,散步 10 分钟助消化。',
  '少油少盐少糖,重口味是脾胃最大的负担。',
  '秋燥多吃梨和银耳,冬寒多吃萝卜和羊肉。',
  '生气伤肝,情绪平稳是最好的养生药。',
  '寒从脚起,天凉了袜子要比别人先穿上。',
  '细嚼慢咽,每口饭嚼 20 下,肠胃负担小一半。',
  '睡前 1 小时放下手机,蓝光伤肝血又影响睡眠。',
  '八段锦每天 12 分钟,疏通经络,适合所有体质。',
  '红枣枸杞虽好,湿热体质要少吃,养生也要看体质。'
];

function initWellness() {
  const box = $('#wellness-tip');
  if (!box) return;
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const tip = WELLNESS_TIPS[dayOfYear % WELLNESS_TIPS.length];
  box.innerHTML = `
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">📅 ${now.getMonth() + 1} 月 ${now.getDate()} 日</div>
    <div>${tip}</div>`;
}

if (typeof window !== 'undefined') window.initWellness = initWellness;
