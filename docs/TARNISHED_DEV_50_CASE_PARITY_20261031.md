# Tarnished.dev v1.17 — 50/50 competitor-verified Weapon AR parity (2026-10-31)

## 结论与验收范围

**50 / 50 组不同的武器／质变／强化／属性／单双持组合**，均在 Tarnished.dev **公共 v1.17 Build Calculator** 上由真实 Chromium 浏览器确认输入、读取显示 AR，并在两轮独立执行中取得完全相同的整数结果。使用本项目的独立计算代码与固定公开 v1.17 参数来源复算，**最终结果全部一致，误差 0**。

- 首批 15 组此前独立重复验证：[首次输入校验](https://github.com/garrison2025/Elden-Ring/actions/runs/41180592038) · [重复运行](https://github.com/garrison2025/Elden-Ring/actions/runs/41180757356)。
- 新增 35 组真实网页读取：[首次 50 组完整运行](https://github.com/garrison2025/Elden-Ring/actions/runs/41191448470) · [第二次独立 50 组运行](https://github.com/garrison2025/Elden-Ring/actions/runs/41191804102)。
- **两轮各 50 组输入全部一致，35 组新增读数全部一致**；第二次读数的独立旧版计算比较显示 42/50 完全相等，8 组低 1。
- [原始分量求和后再取整的独立证据审计](https://github.com/garrison2025/Elden-Ring/actions/runs/41192338565)表明：原算法“先对每种分量取整再求和”仅 **42/50**；修正为“物理/元素原始计算值求和后统一下取整”后为 **50/50**。没有给特定武器加固定数值，且继续保留历史手动计算档案原有规则。

**用户最终验收标准：与 Tarnished.dev v1.17 的网页功能和同条件数值一致即可，不要求游戏客户端验证、游戏截图或 Regulation 1.17.3 独立结果。** 本次 50 组证明的是该 *Weapon AR 计算分支* 的代表性对标通过，而不是无条件验证全部 3,296 个来源武器变体，更不能替代五个计算模块的全面功能/数据覆盖验收。

## 新增 35 样本

新样本涵盖 Longsword、Uchigatana、Claymore、Greatsword、Dismounter、Milady、Fire Knight's Greatsword、Moonveil、Blasphemous Blade、Dark Moon Greatsword、Bloodhound's Fang、Rivers of Blood，涵盖 Standard、Heavy、Keen、Quality、Fire、Flame Art、Lightning、Sacred、Magic、Cold、Poison、Blood、Occult、None（特殊武器）。Regular +0/+12/+15/+20/+25，Somber +0/+5/+10，单持和双持，DLC 主来源和普通武器都有覆盖。

**8 个误差已精确定位为分量舍入规则：**

| 新对照 ID | Tarnished.dev v1.17 | 旧算法 | 差异 | 修正后 |
|---|---:|---:|---:|---:|
| longsword-fire-p12 | 336 | 335 | -1 | 336 |
| claymore-magic-p25 | 774 | 773 | -1 | 774 |
| greatsword-cold-p25 | 823 | 822 | -1 | 823 |
| greatsword-fire-p12-2h | 597 | 596 | -1 | 597 |
| fire-knight-greatsword-flameart-p25 | 885 | 884 | -1 | 885 |
| fire-knight-greatsword-fire-p25 | 836 | 835 | -1 | 836 |
| blasphemous-blade-unique-s10 | 785 | 784 | -1 | 785 |
| dark-moon-greatsword-unique-s5 | 482 | 481 | -1 | 482 |

完整的 35 条来源输入与所见 AR 在 `public/src/tarnished-v117-approved-additions.mjs`，原 15 条在 `public/src/tarnished-reference-benchmark.mjs`。新观察及其来源运行记录在 `scripts/tarnished-v117-35-observed-ui-totals.mjs` 和 GitHub Actions 临时证据 artifact 中。

## 为什么修改计算聚合

每种伤害分量均有自己的基础攻击值、成长和浮点修正。不同聚合顺序在混合伤害武器上会产生 1 点差异。我们的内部计算继续保留 **逐分量原始值**与**各分量取整值**，但固定来源 v1.17 的**最终 nominal AR** 改为“原始分量合计后取整”，经真实网页逐组独立测得 50/50 一致。仅对这个具有显式 `calculationRules.aggregation='floor-raw-sum'` 的来源档案使用该规则；历史手动输入档案仍采用各自的舍入设置。

额外的 3,296 来源变体 × 12 档 = 39,552 例内部算术审计是**本项目两个独立计算路径对同一来源的交叉核对**，不能混称 39,552 组 Tarnished.dev 网站独立观察。

## 不再需要与仍需保持独立的事项

- **不要求**实机数据、游戏客户端截图、最新 Regulation 1.17.3 数值认证，二者均不阻断 v1.17 对标。
- 第三方数据再分发权利、图片/文字授权、SEO 是否开放索引，仍按独立发布/版权流程审查，不能因数值对标通过而自动放开。
- 当前 **Weapon AR 50 样本数字对标通过**，但是 72 条社区资料字段缺失、9 条来源不一致，以及 Build 装备主动效果、Armor 全参数、Damage 和 Spell 完整模块功能/数据，对标总问题 [#83](https://github.com/garrison2025/Elden-Ring/issues/83) / [#86](https://github.com/garrison2025/Elden-Ring/issues/86) 仍开放。
