# Elden Ring 免费配装、武器与伤害计算站｜完整开发与运营方案 V2.0

**编制日期：2026-10-30｜基于用户确认的 V1 方案进行全面升级｜目标语言：英语｜主要目标市场：美国｜固定成本目标：除域名外 $0**

> **文件性质：可直接交付给开发 AI 的项目 PRD + SEO 信息架构 + 数据/算法规格 + 上线验收合同。** 这是**方案升级**，不是新一轮代码交付，也不代表所有功能已经完成。保留 V1 的全部 **67 个精准工具词与 63 个关联辅助词**以及原始 US/未注明国家数据口径；原始 800 行审计数据以配套 `Elden_Ring_关键词全量审计与页面规划_20261030.xlsx` 为准。
>
> **重要状态：** 已有 V2 开发研究预览（4 个基础工具、虚构数据驱动 AR 实验室；18 项自动化测试通过）。**真实武器数据库 0；AR 游戏内黄金样本 0；真实敌方伤害算法未获验收；生产部署未完成**。严禁将研究页或样例数据当作已上线的正式游戏工具。

---

## 0. 决策摘要与冻结范围

| 决策 | 本轮固定内容 | 允许调整的条件 |
|---|---|---|
| 站点类型 | 免费 Elden Ring Build / Combat Calculator，核心是可操作的计算工具 | 用户明确改变产品方向 |
| 语言 / 市场 | `en-US` 英语单一主站，美国非品牌自然搜索优先 | 新市场完成当地关键词和SERP验证 |
| 成本边界 | 域名之外原则上 $0 固定月费；无收费AI、运行时付费API、数据库、长期服务器任务 | 用户另行明确批准 |
| 目标收入 | 广告优先，收入与流量未知，不作收益承诺 | 真实 GSC / 广告后台数据支持 |
| 已批准关键词 | V1 的 67 精准词 + 63 辅助词、独立 URL意图集群；保留全部记录 | 用户重新批准需求研究 |
| 开发目标 | 核心工具之间状态联动、真正准确、快速、可分享、数据版本透明 | 无法取得合法/可靠数据时按发布门槛降级，而非输出假数据 |
| 游戏版本基线 | **App 1.17.2 / Regulation 1.17.3（2026-10-20官方公告）**；每份数据单独标出适用版本 | 官方新补丁生效并完成核验 |
| 起始职业 | 原版10职业；**Idus Knight 和 Heavy Knight 仅在 Tarnished Pack/Tarnished Edition 可用时启用** | 实际游戏机制变化 |
| 真实验证 | 每一个对外展示为“准确”的游戏计算器，必须有可追溯游戏实测或合法、独立校验样本 | 不满足则保留研发预览/noindex，不能假装通过 |
| 网站标准 | `chenmu2024/Website-Starter-Standard` 当前规范，含 Build Intake、PRD、DESIGN、SEO/GEO、动效和L1/L2验收 | 规范更新时复核差异 |

**V1 修正：** 所有配装页面的核心属性是 **8项**（Vigor、Mind、Endurance、Strength、Dexterity、Intelligence、Faith、Arcane），不是原文的“9项属性”。等级为另外一个派生/输入字段。所有涉及 12 职业的地方必须提供是否拥有 2026 年新增内容的开关，不得对原版玩家无条件开放新职业。

**研究结论边界：** `tarnished.dev` 2026-10-29 全球月自然搜索估算约 6.5K；2026-10-28 美国约 4.1K，数据来自用户 Semrush 截图。关键词低 KD 证明可研究的非品牌需求，**不证明新站能取得相同流量**；逐词 US SERP 前10、页面级竞争、外链强度仍不完整。用户已同意推进研发，视为在 SEO 缺口未完全核实前进行**有条件开发批准**，不视为已保证商业成功。

## 1. 用户、核心任务、成功标准

### 1.1 目标使用者

- **初学配装玩家：** 想知道当前职业与属性点、等级/卢恩成本、负重阈值。
- **中阶玩家：** 在属性、武器强化、质变之间找更好 AR，快速对比两种 Build。
- **研究型玩家：** 关心真实 PvE 伤害、敌人防御、Buff、法术/武器补正等，要求版本、公式和数据有凭据。
- **移动端玩家：** 在游戏间隙用手机查数值、修改输入、复制配装链接；不要被广告遮挡输入和输出。

### 1.2 北极星任务与最低用户体验

**从搜索进入 → 直接修改数值 → 得到带版本标识的可信计算结果 → 与另一方案比较 → 导出/保存/分享。** 无注册、无图片上传、无强制登录、无外部运行时 API。每个重要工具首屏必须有可操作输入或可见结果，而非整屏营销文案。

建议内部验收目标（**质量目标，不是已实现的测量结果**）：

- 手机端首次到达后 1 次滚动内能触达主输入与计算结果；无强制弹窗。
- 8项属性可键盘/触控操作；输入错误有定位到字段的提示，数据版本可见。
- 输入更新时本地计算不导致页面卡死；大枚举/最优化任务可暂停、取消，结果可复现。
- 分享的链接可在无账户环境重现相同状态；版本不兼容时告知并安全降级。
- 支持缩减动画偏好、无鼠标键盘操作、360px至1440px响应式。

## 2. 竞争与SEO机会评估：只使用有来源的数字

### 2.1 已证实与未证实

**已证实：** 竞品拥有美国非品牌排名；`elden ring build calculator`、`weapon calculator`、`damage calculator`、`level calculator` 等属于明确工具需求；你提供的美国 Semrush 查询中有多个 KD<25 的专业词；现有中小竞品有可观非品牌搜索流量。

**未证实：** 三个最重要词各自 Google 美国前10“弱站占比”、新站上首页难度、真实广告 RPM/收入、用户愿意为高级功能付款的比例、完整武器数据的商业可用授权。

### 2.2 竞争者对照矩阵（只记录已公开观察到的功能，不伪造流量）

| 竞品 | 可观察功能方向 | 借鉴价值 | 我们的必须差异 |
|---|---|---|---|
| `tarnished.dev` | Build Planner、Weapon/Armor、Damage 等 | 信息架构和各类计算场景 | 版本化证据、独立验收、跨工具对比、手机易用性 |
| `tarnishedforge.com` | 装备与配装计算 | 装备/属性联动 | 数据覆盖说明、输入验证、分享稳定性 |
| `almanauts.com` | AR 及数值分析 | AR 参数展示与比较 | 计算过程可解释、精确等级与质变矩阵 |
| `softcapbuilds.com` | 属性分配与收益优化 | 最优化工作流 | 清楚区分强度上限、前提及使用数据版本 |

开发前在 `research/SERP-EVIDENCE.md` 为**每一个核心查询**留 10 个实际排名 URL + 日期 + 页面类型 + 功能质量 + AS/外链（可获得时）+ 缺口，不允许填编造的KD或评价。缺数据写 `UNKNOWN`，不阻止研究版开发，但禁止对外宣称“SEO已验证可轻松竞争”。

## 3. 完整产品信息架构（一次规划，按验证逐项开放）

**主页 `/`** 作为品牌和工具导航页，不抢各个精准工具页的关键词主意图。全站只做英文主站；任何用户分享状态参数不可产生额外索引页面。

| 路径 | 主意图/核心词 | 唯一核心产出 | 上线索引状态 | 数据门槛 |
|---|---|---|---|---|
| `/build-planner/` | build calculator / planner | 配装等级、属性、装备与同步 AR/负重 | 验收后 index | 职业与装备真实数据 |
| `/weapon-ar-calculator/` | weapon / ar calculator | 版本化五类 AR 分量及比较 | 验收后 index | 真武器、强化、质变及曲线 |
| `/damage-calculator/` | damage calculator | 对指定目标的 PvE/PvP 伤害预测（标模型） | 验收前 **noindex** | 敌方参数/动作值/Buff 和实测矩阵 |
| `/level-rune-calculator/` | level / rune calculator | 升级费用与预算可达等级 | 核验后 index | 独立黄金样本 |
| `/stat-calculator/` | stat calculator | 角色属性派生值与变化曲线 | 核验后 index | 属性成长曲线 |
| `/equip-load-calculator/` | equip load | 负重及轻/中/重/超重状态 | 核验后 index | 游戏实测阈值及装载规则 |
| `/armor-optimizer/` | armor optimizer | 约束下的盔甲候选 / Pareto 组合 | 验收前 noindex | 完整装备表、最优性与性能测试 |
| `/class-optimizer/` | starting class optimizer | 给定属性目标的最低等级职业 | 核验后 index | 职业初始值及 DLC 设置 |
| `/weapon-compare/` | weapons comparison | 2–4武器横向比较/强化差异 | 独立价值核验后 index | 不等同 AR 页的空壳复制 |
| `/spell-scaling-calculator/` | spell / seal | 杖/印记补正和法术表现 | 验收前 noindex | 额外专用参数与计算公式 |
| `/soft-caps/` | soft caps | 可交互曲线、边际收益与解释 | 曲线校验后 index | 各版本曲线与实测 |
| `/weapons/`、`/armor/`、`/talismans/`、`/spells/` | 数据库浏览/筛选 | 真实数值列表 + 实用筛选器 | 数据完整且有独立价值后 index | 来源与完整度审计 |
| `/builds/` | 已验证配装方案 | 玩家用途与实测示例，不是AI批量攻略 | 人工验收后 index | 可复现配装证据 |
| `/about/`、`/methodology/`、`/changelog/`、`/privacy/`、`/contact/` | 信任/透明与维护 | 原创说明、公式、变更历史与联系 | index/noindex按页面用途 | 真内容，禁止虚构 |

**重要修正：** 原 V1 把 `weapon comparison` 部分词优先级写成 P0、页面却列 P2；新版规定这些关键词保留，但独立对比页取决于是否形成**不同于 AR 页的完整交互任务**。在此之前，由 `/weapon-ar-calculator/` 的 Compare 选项承接，并在工作簿中保留原词归属，不修改用户原始数据。

### 3.1 导航与内部流量路径

- 首页 → `Build Planner`、`Weapon AR`、`Damage`、`Level & Runes`、`Armor`、`More Tools` 六组功能导航；未完成的研发功能**不以公开完成品入口呈现**。
- `Build Planner` 的武器选择 → 带状态到 `Weapon AR`；AR 页的敌人伤害 → `Damage`；`Equip Load` ↔ `Armor Optimizer`；`Level` ↔ `Class Optimizer`。
- 一组搜索意图只给**一个主要可索引 canonical 页面**。类似 `build maker`、`build calc`、`character builder` 自然融入 Build Planner；不生成重复页。
- 数值型 share 链接使用同一 canonical：分享字符串不进入 sitemap、不被作为独立可索引URL。

## 4. 各工具 PRD：字段、结果、错误与验收合同

### 4.1 Build Planner（核心主流程）

**输入：** 游戏 App/Regulation 数据快照（默认已验证最新版）、DLC 内容可用性（Base / Shadow of the Erdtree / Tarnished Pack 分开）、12职业中的可用职业、8项属性（1–99且不低于职业基础）、武器/左右手、强化、质变、头/胸/手/腿、护符、法术插槽与装备、单/双持。

**结果：** 起始等级与当前目标等级、属性分布、剩余点数/非法分配原因、装备总重量与负重档位、最低属性需求警告、AR 跳转对比、导出 JSON / 分享链接。

**边界条件：** 不持有 Tarnished Pack 不可使用新增职业；Shadow of the Erdtree 与 Tarnished Pack **是不同内容集**；不存在的装备或数据缺失不能使用零值代替；旧分享链接需要迁移或明确提示不兼容。游戏人物“八属性”与“等级”绝不能混同。

**验收：** 不同职业初始值、属性点与等级可逆；跨页面带参后结果一致；十组典型配装与独立参考样本一致；界面不存在虚构 AR 值。

### 4.2 Weapon AR Calculator（竞争价值最高）

**输入：** 可合法使用且已验收的武器 ID、强化等级（普通与特殊武器不同合法范围）、质变可用选项、8属性中的5个伤害相关数值、单/双持、相关加成/状态开关（有数据才开放）。

**结果：** Physical / Magic / Fire / Lightning / Holy **逐项 AR**、属性补正拆分、基础/增量分量、武器需求不足提示、两把武器或两种质变比较；明确 AR 不是对敌实际伤害。

**约束：** 不允许把字母 S/A/B/C/D 当成完整的精确补正曲线；不能用线性公式代替游戏多段曲线；不许为缺失强化等级插值猜值；单/双手有效力量、多个伤害类型取整和错误边界需由黄金样本证实。

**验收：** 以不同武器族、普通+0/+25、特殊+0/+10、多种可用质变、单/双持、满足与不满足需求、基础与 DLC 武器设计覆盖矩阵；所有声明“游戏内准确”的验收样本按游戏显示整数精确一致；无法解释的偏差为上线阻塞。

### 4.3 Damage Calculator（严禁 AR 冒充实伤）

**输入：** 来源于 AR 的攻击分量，攻击动作与 motion value，目标敌人及对应阶段、防御与属性吸收、Buff/护符/状态、PvE/PvP 模式、游戏版本，条件影响清单。

**结果：** 每伤害类型的拆分与总值，明确计算前提与不能模拟的机制；没有敌方参数的情况只显示可验证的中间数值，不显示“最终伤害XX”。

**风险：** 分项防御、吸收、技能倍率、异常状态与多段攻击、敌人特定减伤可能产生复杂行为。独立检验前不得承诺 DPS 或 PvP 完全精确。

**验收：** 每个已声明支持的目标/招式组合均有实机或独立可信黄金样本；精确值不符则取消该模式的正式支持。PvP 与 PvE 规则分开，不共享未经验证的倍率。

### 4.4 Level / Rune Calculator

**输入：** 当前等级、目标等级、预算卢恩；可选职业用来检查与属性预算一致性。**结果：** 下一等级成本、总升级成本、预算能达到的最高等级、剩余卢恩、阶梯表。**边界：** 等级1–713、不允许逆向升级、金额大整数不溢出、最高等级无法继续升级。**验收：** 边界值、随机级区间和外部核验样本相符；缓存累加与朴素循环结果一致。

### 4.5 Stats / Soft Caps

**输入：** 8属性、装备与版本/附加机制开关（只启用已验证支持项）。**输出：** 对应派生值、属性变化前后差额、非线性收益和 soft cap 标记。**验收：** 每条曲线的数据来源、适用版本与可支持的数值范围清楚，图表不把经验阈值伪装成统一的官方硬上限。`/soft-caps/` 独立页提供交互图表及文字解释，与 `stat-calculator` 的任务区分清楚。

### 4.6 Equip Load & Armor Optimizer

**Equip Load：** 输入装备重量与受加成影响后的最大负重，输出百分比、轻/中/重/超重状态与距离阈值的余量；使用 30%、70%、100% 门槛的明确比较规则；携带重量与装备重量不同，不能误加背包未装备物品。

**Armor Optimizer：** 真实装备重量、强韧度及防御/抗性参数；可锁定某个位置、排除 DLC/未获得装备、指定预算上限；输出满足约束的可验证组合与排序依据。若仅近似最优，必须标示“近似”，不能宣称全局最优。大搜索在 Web Worker 内运行，设时间/数量上限、取消按钮及超时恢复。

### 4.7 Starting Class Optimizer

**输入：** 目标8属性、是否拥有 Tarnished Pack、新手/特定职业限制。**结果：** 合法起点职业按达到目标的最低等级排序、不可避免多余属性点解释。**验收：** 遍历全部允许职业，与逐一计算的目标等级一致；同等级并列规则稳定。

### 4.8 Weapon Compare、Spell Scaling 与数据库

只有形成新的、独立的用户价值后才建立单独索引页：例如 2–4 武器同一属性 Build 的分项 AR、不同升级等级综合比较、法术印记补正按属性变化表，以及真正可筛选的武器/护甲数据库。比较页与 AR 页互相链接，但不得只复制标题/按钮换关键词。

### 4.9 统一状态与结果协议

统一 `ToolState`：`gameVersion`、`regulationVersion`、`rulesetId`、`datasetId`、`ownedContent[]`、`character`、`loadout`、`weaponSettings`、`scenario`。每个计算结果返回 `status: VERIFIED | PARTIAL | EXPERIMENTAL | UNSUPPORTED`、`assumptions[]`、`sourceSnapshot`、`warnings[]`、`trace[]`。**EXPERIMENTAL 不等于 VERIFIED。**

## 5. 数据源、许可、版本与审计（首要工程门槛）

### 5.1 数据的五层来源

1. **官方更新公告**：用于确定游戏版本、发生了哪些变化；不自动提供完整武器数值。
2. **可合法使用的开源代码**：按代码仓库 LICENSE 逐一核查；许可不一定覆盖原作数值、图标和其他素材。
3. **社区数据与研究文章**：可作为解释/核验线索；复制、批量整理、商业发布之前应查数据库权利和数据源授权。
4. **自建原始观测样本**：游戏内测试步骤、截图/录制证据的内部引用、设备平台、条件与实际显示值，校验公式；是否能公开使用截图仍需权限审查。
5. **独立实现**：自己编写算法、测试、UI 与描述。不得直接搬运缺许可证的计算器源码或竞争站文本。

### 5.2 必需字段与文件结构

每个数据文件元数据必须包含：

```json
{
  "schemaVersion": 1,
  "gameAppVersion": "1.17.2",
  "regulationVersion": "1.17.3",
  "contentPack": "base|shadow-of-the-erdtree|tarnished-pack",
  "dataRevision": "UNVERIFIED_UNTIL_AUDITED",
  "sourceIds": [],
  "licenseReview": "pending",
  "verifiedAt": null,
  "testSuiteId": null,
  "coverage": {"records": 0, "verified": 0}
}
```

上面是**接口结构示例**，不是已拥有真实游戏参数的证明。`sourceIds` 指向 `data/sources.json` 的每条来源（URL、作者、协议、版本、抓取/记录日期、公开许可判断）；所有 dataRevision 与规则变更必须留下校验和及 Changelog。

建议分离 `classes`、`weapons`、`affinityRules`、`reinforcement`、`scalingCurves`、`armor`、`talismans`、`spells`、`enemies`、`motionValues`、`effects`、`runeFormula`、`validationFixtures`。每项支持 `sourceStatus`、`validationStatus`、`availableContent`、`lastVerified`。数据不可用时返回“不支持”，不填0。

### 5.3 上线范围冻结规则

- **红线 A**：没有可以说明合法使用依据的数据 → 不打包发布该数据。
- **红线 B**：真实游戏内黄金样本为0 → AR/伤害只能作为非索引研发预览，不能显示“已验证准确”。
- **红线 C**：缺失数据项不能用“猜测、AI 补全、线性外推”代替。
- **红线 D**：官方补丁公告只代表发布新版本，不代表计算公式自动适配。
- **红线 E**：不使用未经许可的官方游戏 Logo、原画、模型、音频、现成图标集或竞品整页文案；必要描述性游戏名称与非官方免责声明分开处理。

**许可证审查清单**：`EldenRingDatabase/erdb`（公开解析代码，MIT ≠ 商业授权游戏数据库）；`misspia/elden-ring-data` 与 `DanielKinsner/elden-ring-build-calc` 当前公开仓库未发现 LICENSE 声明时按保守处理，不能默认可复制。对每个仓库保存当前 commit SHA、LICENSE 快照和材料归属判断；若不确定，按独立重做而不是复制。

## 6. 计算准确性与测试策略

### 6.1 自动化测试矩阵（**发布目标**，不是本次通过记录）

| 模块 | 最低验收覆盖要求（项目内部约定） | 阻塞条件 |
|---|---|---|
| 等级/卢恩 | 边界 1/713、随机区间、预算逆推、独立核验样本 ≥20 | 任一已验证样本计算不一致 |
| 职业与Build | 10原版+2扩展、8属性、DLC关闭/开启、错误输入/迁移 ≥25 | 角色等级或初始数据错误 |
| 装备负重 | 阈值上下边界、加成、装备变更、移动端输入 ≥20 | 档位错误或负重错误 |
| Weapon AR | 至少覆盖多武器族、普通/特殊、强化端点、质变、1H/2H、需求不足及五元素分项；最初 ≥50 黄金样本 | 游戏内整数值不一致或缺来源 |
| Damage | 支持的敌人/动作/防御组合首先 ≥30 实机样本，PvE/PvP 分开 | 未验收却展示精确实际伤害 |
| Armor Optimizer | 小枚举暴力对照 ≥20、锁定/排除/超时/取消/性能测试 | 不满足约束、虚称全局最优 |
| 版本迁移 | 旧链接、旧 JSON、新补丁状态降级、数据 checksum | 静默使用过期版本数据 |
| SEO/UI/性能 | 静态 HTML、路由、键盘与触控、CWV Lab和生产表现 | P0/P1级问题未处理 |

每个黄金样本必须记录 `sampleId / gameAppVersion / regulationVersion / platform / DLC / exactInputs / expectedOutputs / sourceEvidence / recordedAt / reviewer / codeCommit / dataRevision`。对于随机测试使用固定 seed；保存失败样本，禁止只删除失败用例。

### 6.2 结果证据等级

- `VERIFIED`：受支持情境有可重现外部/实机样本、版本和误差验收，返回明确支持范围。
- `PARTIAL`：只有一部分机制/装备/敌人可计算，对未覆盖路径明确禁用或解释。
- `EXPERIMENTAL`：只能用于研发，不把结果作为可靠游戏建议；**默认不索引**。
- `UNSUPPORTED`：明确不输出数值。

产品内部目标是**对宣称支持的游戏UI整数值逐项一致**，不是以“看起来接近”的平均误差掩盖系统性差异；某些动画帧伤害、敌人状态等不可重现时必须减小支持范围。

### 6.3 现有 V2 代码复用策略（**已检查当前工作目录**）

- `elden-ring-build-lab-preview/src/core.mjs`：8属性、12职业、卢恩、基础负重、职业优化已有独立实现。**已有基础测试，但尚非全面实机验证**；优先抽成 TypeScript 纯函数并补完整证据。
- `src/weapon-ar.mjs`：参数驱动研究计算器；**当前仅有合成参数**，不等于游戏公式已经被验证。不能因为 10 项引擎测试通过就声称 AR 正确。
- `data/ar-synthetic-fixture.mjs`：虚构数据只用于测试，正式构建必须自动检查并排除；`weapon-ar-lab/` 保留 noindex/内部开发用途。
- 截至上一版验收记录：**18/18 测试通过，真实 AR 黄金样本为0**。后续测试数量和结果只有实际运行后才能更新，不得把本规划目标写成已完成。

## 7. 技术架构与文件合同

**部署**：Cloudflare Pages Free 托管纯静态输出；Astro SSG + TypeScript（如经依赖许可与体积审查可用），计算独立 npm/TS 模块；无需运行中的 Node 服务。使用 Vite/Astro 仅在构建期运行；运行时默认无外部 API 请求。

```text
project/
  src/pages/                    # 首页、工具页、方法页（静态生成）
  src/components/               # InputGroup, ResultPanel, VersionBadge, CompareTable
  src/lib/calculators/          # 纯函数：level, build, ar, damage, equip, optimize
  src/lib/validation/           # schema 校验、来源元数据、类型检查
  src/lib/share/                # 版本化分享状态编解码 + 压缩/限制
  src/styles/                   # DESIGN tokens、全局主题和可访问性样式
  public/data/{revision}/       # 经许可审计并验证的 JSON 数据包
  public/robots.txt
  tests/unit/                   # 规则单元、边界/属性测试
  tests/golden/                 # 实机/外部权威黄金样本（有溯源）
  tests/e2e/                    # Playwright 用户任务/视觉/键盘测试
  research/                     # SERP-EVIDENCE、许可审计、市场源表
  docs/PRD.md
  docs/DESIGN.md
  docs/SEO-GEO-PROJECT-BRIEF.md
  docs/DATA-PROVENANCE.md
  docs/VALIDATION-MATRIX.md
  docs/RELEASE-EVIDENCE.md
  docs/PATCH-MAINTENANCE.md
  .github/workflows/           # 免费额度内 CI，校验并部署
```

**数据按需加载：** 职业和等级表小文件内联/首屏加载；武器和护甲大库按类别分包；用户实际进入某功能时才加载相应规则；Web Worker 处理耗时优化，支持 cancel/timeout。禁止后台循环、持续渲染大动画造成耗电。

**隐私/安全：** 默认不上传配装/存档；默认本地保存草稿，可清空；分享 URL 必须校验版本、长度、合法区间并拒绝恶意深层 JSON；导入文件容量上限、字段白名单、无动态执行、不使用 `eval`；公开 `Content-Security-Policy`、无第三方追踪默认值。若上线广告与分析，按地区评估同意管理义务，隐私披露与实际运行一致。

**离线边界：** “100% 本地计算”不代表首次访问必然离线。若承诺断网后使用，需用 Service Worker 预缓存程序与所需数据，测试缓存更新、撤销及版本冲突；不需要则只承诺“数据处理不上传”。

**零成本门槛：** Cloudflare Pages Free 使用之前检查官方当前额度；2026-09-05 文档列出 Free 每月500次构建、单次20分钟超时，实际按部署时官方政策执行。禁止无批准引入付费日志、付费字体、R2计费、Workers付费、远程AI API和常驻数据库。

## 8. SEO / GEO 完整执行规则

### 8.1 英文页面关键词与标题冻结

| 规范路径 | Primary Keyword | Title 草案 | H1 草案 | 关联关键词进入位置 |
|---|---|---|---|---|
| `/build-planner/` | `elden ring build calculator` | Elden Ring Build Calculator & Planner | Elden Ring Build Calculator | builder, planner, build maker in guide/FAQ |
| `/weapon-ar-calculator/` | `elden ring weapon calculator` | Elden Ring Weapon AR Calculator | Elden Ring Weapon Calculator | ar calculator, attack rating, scaling |
| `/damage-calculator/` | `elden ring damage calculator` | Elden Ring Damage Calculator | Elden Ring Damage Calculator | weapon damage, damage calc（仅发布后） |
| `/level-rune-calculator/` | `elden ring level calculator` | Elden Ring Level & Rune Calculator | Elden Ring Level Calculator | rune calculator, cost, per level |
| `/stat-calculator/` | `elden ring stat calculator` | Elden Ring Stats Calculator | Elden Ring Stat Calculator | stat calc, stats calculator |
| `/equip-load-calculator/` | `elden ring equip load calculator` | Elden Ring Equip Load Calculator | Elden Ring Equip Load Calculator | weight, endurance, equipment load |
| `/armor-optimizer/` | `elden ring armor optimizer` | Elden Ring Armor Optimizer | Elden Ring Armor Optimizer | armor calculator, poise |
| `/class-optimizer/` | `elden ring class optimizer` | Elden Ring Starting Class Optimizer | Elden Ring Class Optimizer | starting class, build optimization |
| `/soft-caps/` | `elden ring soft caps` (旧库市场不明) | Elden Ring Soft Caps & Stats Curves | Elden Ring Soft Caps | static cap explanation & graph |

其余适用词与原始数值完整保留在第10节（V1 原表逐项保留）。**不要把 130 个词变成 130 个网页。** 对具独立搜索意图的扩展页，需满足非重复内容和经过审核的数据能力。

### 8.2 站内链接与canonical示例

- 首页可见工具入口与真实 `<a href>` 链接；工具页 → 相关工具 → 方法论 → 官方版本日志。返回入口能让用户携带当前配装而不是丢失状态。
- `/build-planner/?state=...`、`?from=...` 不形成独立页面；内容稳定且自指 canonical 为 `/build-planner/`；危险/超长参数拒绝加载而不渲染垃圾内容。
- 禁止把损坏的 `noindex` 研究页加入生产 sitemap，也不允许 robots.txt 阻断爬虫读取 noindex 指令后仍出现 URL 的情况；最优方案是生产构建**不打包研发页**。
- 只有可用、真实、独立有价值的工具才能进 sitemap；单纯“Coming Soon”的页面不应索引。

### 8.3 每个工具页的内容模板（不制造薄内容）

1. 首屏：真实可操作输入、实时输出/计算按钮、数据版本、支持范围。
2. 结果：数值/拆分/解释、错误/限制状态、Compare/Save/Share。
3. 自解释：计算依据与作用域（AR 与真实伤害区分）、关键变量及边界。
4. 可复现示例：输入条件 + 输出 + 已核验来源/测试说明（**不可使用合成游戏数字冒充真例子**）。
5. 关联工具：例如 Build→AR→Damage，明确每页独立任务。
6. FAQ：仅答用户真实问题；不要为 FAQ rich results 做虚假承诺。
7. Changelog + 数据透明：何时核验、当前支持和不支持的 DLC/版本。

### 8.4 结构化数据与可抓取性

- 静态 HTML 中真实输出 title、H1、description、canonical、正文介绍和可爬内链，避免只提供空 JS 容器。
- `WebApplication` / `SoftwareApplication` Schema.org 仅标真实属性；**不得虚构评分/评论**。Google 的软件应用富媒体资格要求可能包含真实评分/评价字段，结构化数据合法不等于必然有富媒体结果。
- `BreadcrumbList` 在真正存在面包屑时标注；`FAQPage` 仅记录真实可见内容且遵循 Google 适用性限制；不建仅供 AI 的重复页面，不把 `llms.txt` 当谷歌必需项。
- 生产前核验响应状态码、canonical、sitemap、robots、404、内链、无意 noindex、真实手机视口、站点的原生英文文本和 URL 一致性。
- 首发只做英语，西/葡语以当地已核验关键词和原生内容质量为前提；不机器翻译批量建多语薄页面。

### 8.5 搜索运营与防内容垃圾

Google 2026 年的政策重点是帮助用户的真实独创内容，不能大量创建仅为搜索排名服务的近似页面。功能页使用实用计算与可信示例构成差异，而不是每个变体生成新页面。获取非品牌外链只做相关高质量渠道（玩家论坛、教程作者、工具目录等符合版规的网站），不要用批量垃圾目录和付费链接赌排名。

## 9. UI设计体系（可直接填入 DESIGN.md）

**设计原则：** 深石墨灰 + 柔金点缀的精致战斗工具工作台；不用官方游戏原画/Logo，不复制 Tarnished.dev 的布局资产；“Operate”任务优先，数据易读胜过电影级动画。

| Token | 建议值 | 使用目的 |
|---|---|---|
| `canvas` | `#101316` | 页面背景 |
| `surface-1` | `#1A2025` | 输入/结果主面板 |
| `surface-2` | `#242C32` | 次级面板/悬浮层 |
| `ink` | `#F5F2E8` | 主文字 |
| `body` | `#DAE0E1` | 正文 |
| `muted` | `#AAB6BD` | 次级文字 |
| `hairline` | `#39444C` | 分割线 |
| `primary` | `#D8B570` | 主操作/焦点强调 |
| `success` | `#78C9A8` | 数据已核验 |
| `warning` | `#F0C06D` | 数据实验/版本过期 |
| `error` | `#F28B82` | 验证失败/非法值 |

注意：以上是**设计建议，不是已通过 WCAG 对比度测试的结果**，开发必须实测。主题不使用高成本背景滤镜/循环光效。使用本地系统字体或合法开源字体，不用侵权游戏字形。

- **桌面 ≥1024px：** 顶部紧凑全局导航；右侧版本标识；工具工作台左侧输入 40–45%、右侧结果 55–60%，结果卡可在大量输入时固定但不得盖底部控件；底部方法与FAQ。
- **手机 360–767px：** 顺序为标题/版本→主要输入→实时结果→深入参数；比较表允许明确的横向滚动，提供列收起或两方案轮播；主要按钮高度建议44px以上、无横向页面溢出。
- **平板 768–1023px：** 合理上下排或可折叠双列；不是把PC缩小。
- **交互状态：** 空/编辑/计算中/已验证/仅部分支持/错误/数据过期/离线/版本不匹配；所有状态要有文字说明，不靠颜色独自传达。
- **动画：** 数值变化用约 120–220ms 过渡、Tab/分组切换合理反馈；不能每秒循环；无 JS 的主内容初始可见，`prefers-reduced-motion` 下禁用非必要动效；实际耗时需基准测试。
- **无障碍：** HTML label、字段错误关联 `aria-describedby`、焦点样式、数值输出读屏提示、键盘全链路、200%字号放大，实测对比度。
- **设计参考评审流程：** 在项目 `docs/DESIGN.md` 记录 2–4 个高质量真实工具界面，分析工作台密度/布局/响应式交互，只提炼可用原则，不克隆对方品牌和完整布局。

## 9A. 变现与盈利验证（不做无根据收益承诺）

**第一阶段**：免费工具 + AdSense（审核通过后）。移动端广告不许压住主要结果、游戏数据版权声明和交互按钮；优先工具完成后/下方区域及符合政策的锚定广告；插页广告应考虑体验与搜索品质，不默认滥用。

**对收入的计算框架**：`月广告收入 = 月可变现页面浏览量 / 1000 × 实际页面 RPM`。本站目前没有 GSC 点击、实际 PV、广告填充率和 RPM 数据，因此**不得填写虚构的月收入预测**；Semrush 搜索量与 CPC 均不能直接代替这些变量。对 AdSense 的账户资格、广告政策、cookie/同意机制、版权及 invalid traffic 风险另建验收检查。

**30/60/90日评估指标**（仅启动观察后才有真实值）：已收录工具页数，GSC 非品牌曝光/点击、按页面位置与 CTR、核心任务成功率、错误反馈与回访、移动端 CWV、广告收益及异常无效流量指标。未接入数据前写 `NO DATA`，不制造仪表盘数字。

---

## 10. 完整可用关键词与原始数据（附录）
**阅读说明**：`US Vol/KD/流量/排名`=新文件的美国 Semrush；`旧Vol/KD/CPC`=旧600词文件，国家不明；US“流量”是 Tarnished 在该关键词的一条主自然排名记录的估算值，不等于我们新站的预期。表中“—”表示该来源没有该字段；同义词和多URL不重复求和。

### 10.1 核心工具词：Build Planner（21词）
| Keyword | 目标URL | 优先 | US Vol | US KD | Tarnished US流量 | 竞品US排名 | 旧Vol(市场未知) | 旧KD | US CPC |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| elden ring build calculator | /build-planner/ | P0 | 4,400 | 25 | 1,091 | 1 | 4,400 | 16 | 0.00 |
| elden ring build planner | /build-planner/ | P0 | 1,900 | 19 | 250 | 2 | 1,900 | 27 | 0.00 |
| elden ring build calc | /build-planner/ | P0 | 880 | 23 | 218 | 1 | 880 | 23 | 1.51 |
| elden ring character builder | /build-planner/ | P0 | 480 | 22 | 119 | 1 | — | — | 0.00 |
| elden ring build maker | /build-planner/ | P0 | 390 | 16 | 96 | 1 | — | — | 0.00 |
| elden ring planner | /build-planner/ | P0 | 390 | 16 | 96 | 1 | — | — | 0.00 |
| eldenring build planner | /build-planner/ | P0 | 210 | 16 | 52 | 1 | — | — | 0.00 |
| elden ring builder | /build-planner/ | P0 | 2,400 | 21 | 27 | — | 2,400 | 27 | 2.14 |
| build calculator elden ring | /build-planner/ | P0 | 110 | 17 | 27 | 1 | — | — | 0.00 |
| elden ring builds calculator | /build-planner/ | P0 | 110 | 14 | 27 | 1 | — | — | 0.00 |
| elden ring character planner | /build-planner/ | P0 | 1,600 | 12 | 18 | — | — | — | 0.00 |
| character planner elden ring | /build-planner/ | P0 | 70 | 26 | 17 | 1 | — | — | 0.00 |
| elden ring build creator | /build-planner/ | P0 | 70 | 18 | 17 | 1 | — | — | 0.00 |
| elden ring build optimizer | /build-planner/ | P0 | 110 | 24 | 9 | 3 | — | — | 0.00 |
| build planner elden ring | /build-planner/ | P0 | 40 | 20 | 9 | 1 | — | — | 0.00 |
| eldenring builder | /build-planner/ | P0 | 40 | 19 | 9 | 1 | — | — | 2.14 |
| elden ring build generator | /build-planner/ | P0 | 90 | 7 | 5 | 4 | — | — | 0.00 |
| elden ring calculator | /build-planner/ | P1 | 1,000 | 11 | 248 | 1 | 1,000 | 22 | 0.00 |
| elden ring calc | /build-planner/ | P1 | 170 | 8 | 42 | 1 | — | — | 0.10 |
| elden ring optimizer | /build-planner/ | P1 | 40 | 15 | 3 | 3 | — | — | 0.00 |
| elden ring build website | /build-planner/ | P2 | 170 | — | 5 | 6 | — | — | 0.00 |

### 10.2 核心工具词：Weapon AR & Compare（15词）
| Keyword | 目标URL | 优先 | US Vol | US KD | Tarnished US流量 | 竞品US排名 | 旧Vol(市场未知) | 旧KD | US CPC |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| elden ring weapon calculator | /weapon-ar-calculator/ | P0 | 2,400 | 18 | 196 | 2 | 1,600 | 6 | 0.00 |
| elden ring ar calculator | /weapon-ar-calculator/ | P0 | 880 | 11 | 116 | 2 | 880 | 11 | 0.00 |
| elden ring attack rating calculator | /weapon-ar-calculator/ | P0 | 320 | 14 | 79 | 1 | — | — | 0.00 |
| ar calculator elden ring | /weapon-ar-calculator/ | P0 | 210 | 4 | 52 | 1 | — | — | 0.00 |
| elden ring weapon ar calculator | /weapon-ar-calculator/ | P0 | 110 | 9 | 27 | 1 | — | — | 0.00 |
| elden ring ar | /weapon-ar-calculator/ | P0 | 90 | 20 | 11 | 2 | — | — | 0.00 |
| elden ring weapon calc | /weapon-ar-calculator/ | P0 | 70 | 11 | 9 | 2 | — | — | 0.00 |
| elden ring weapons calculator | /weapon-ar-calculator/ | P0 | 70 | 4 | 9 | 2 | — | — | 0.00 |
| weapon calculator elden ring | /weapon-ar-calculator/ | P0 | 110 | 5 | 6 | — | — | — | 0.00 |
| elden ring scaling calculator | /weapon-ar-calculator/ | P0 | 40 | 15 | 5 | 2 | — | — | 0.00 |
| elden ring weapons comparison | /weapon-compare/ | P0 | 40 | 18 | 5 | 2 | — | — | 0.00 |
| elden ring ar calc | /weapon-ar-calculator/ | P0 | 210 | 17 | 4 | — | — | — | 0.00 |
| elden ring weapons comparison table | /weapon-compare/ | P0 | 70 | 19 | 4 | 4 | — | — | 0.00 |
| elden ring weapon comparison table | /weapon-compare/ | P0 | 40 | 26 | 3 | 3 | — | — | 0.00 |
| elden ring weapon scaling calculator | /weapon-ar-calculator/ | P0 | 50 | 3 | 0 | 19 | — | — | 0.75 |

### 10.3 核心工具词：Damage Calculator（5词）
| Keyword | 目标URL | 优先 | US Vol | US KD | Tarnished US流量 | 竞品US排名 | 旧Vol(市场未知) | 旧KD | US CPC |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| elden ring damage calculator | /damage-calculator/ | P0 | 1,000 | 3 | 132 | 2 | 1,000 | 3 | 0.00 |
| elden ring damage calc | /damage-calculator/ | P0 | 170 | 8 | 22 | 2 | — | — | 0.00 |
| damage calculator elden ring | /damage-calculator/ | P0 | 90 | 8 | 22 | 1 | — | — | 0.00 |
| elden ring weapon damage calculator | /damage-calculator/ | P0 | 140 | 7 | 18 | 2 | — | — | 0.00 |
| elden ring weapons damage calculator | /damage-calculator/ | P0 | 50 | 8 | 6 | 2 | — | — | 0.00 |

### 10.4 核心工具词：Level & Rune Calculator（13词）
| Keyword | 目标URL | 优先 | US Vol | US KD | Tarnished US流量 | 竞品US排名 | 旧Vol(市场未知) | 旧KD | US CPC |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| elden ring level calculator | /level-rune-calculator/ | P1 | 1,000 | 13 | 82 | 3 | 1,000 | 21 | 0.00 |
| elden ring rune calculator | /level-rune-calculator/ | P1 | 720 | 9 | 21 | 7 | — | — | 0.00 |
| elden ring lvl calculator | /level-rune-calculator/ | P1 | 210 | 6 | 17 | 3 | — | — | 0.00 |
| elden ring leveling calculator | /level-rune-calculator/ | P1 | 140 | 10 | 11 | 3 | — | — | 0.00 |
| rune calculator elden ring | /level-rune-calculator/ | P1 | 320 | 11 | 9 | 7 | — | — | 0.00 |
| level calculator elden ring | /level-rune-calculator/ | P1 | 90 | 8 | 7 | 3 | — | — | 0.00 |
| elden ring level calc | /level-rune-calculator/ | P1 | 50 | 6 | 4 | 3 | — | — | 0.00 |
| elden ring level calculator stats | /level-rune-calculator/ | P1 | 40 | 13 | 3 | 3 | — | — | 0.00 |
| elden ring level up calculator | /level-rune-calculator/ | P1 | 40 | 10 | 3 | 3 | — | — | 0.00 |
| elden ring rune calc | /level-rune-calculator/ | P1 | 90 | 5 | 2 | 7 | — | — | 0.00 |
| elden ring rune level calculator | /level-rune-calculator/ | P1 | 90 | 8 | 1 | 7 | — | — | 0.00 |
| elden ring runes per level calculator | /level-rune-calculator/ | P1 | 70 | 5 | 1 | 8 | — | — | 0.00 |
| elden ring rune cost calculator | /level-rune-calculator/ | P1 | 50 | 12 | 1 | 8 | — | — | 0.00 |

### 10.5 核心工具词：Stats & Class Optimizer（5词）
| Keyword | 目标URL | 优先 | US Vol | US KD | Tarnished US流量 | 竞品US排名 | 旧Vol(市场未知) | 旧KD | US CPC |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| elden ring stat calculator | /stat-calculator/ | P1 | 480 | 16 | 119 | 1 | — | — | 0.00 |
| elden ring stats calculator | /stat-calculator/ | P1 | 170 | 18 | 42 | 1 | — | — | 0.00 |
| elden ring stat calc | /stat-calculator/ | P1 | 90 | 18 | 22 | 1 | — | — | 0.00 |
| elden ring starting class optimizer | /class-optimizer/ | P1 | 140 | 24 | 11 | 3 | — | — | 0.00 |
| elden ring class optimizer | /class-optimizer/ | P1 | 170 | 19 | 0 | 9 | — | — | 0.00 |

### 10.6 核心工具词：Armor & Equip Load（7词）
| Keyword | 目标URL | 优先 | US Vol | US KD | Tarnished US流量 | 竞品US排名 | 旧Vol(市场未知) | 旧KD | US CPC |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| elden ring equip load calculator | /equip-load-calculator/ | P1 | 390 | 23 | 25 | 4 | — | — | 0.00 |
| elden ring armor optimizer | /armor-optimizer/ | P1 | 90 | 0 | 22 | 1 | — | — | 0.00 |
| elden ring weight calculator | /equip-load-calculator/ | P1 | 210 | 15 | 17 | 3 | — | — | 0.00 |
| elden ring armor calculator | /armor-optimizer/ | P1 | 70 | 11 | 17 | 1 | — | — | 0.00 |
| equip load calculator elden ring | /equip-load-calculator/ | P1 | 140 | 17 | 11 | 3 | — | — | 0.00 |
| elden ring equipment load calculator | /equip-load-calculator/ | P1 | 70 | 24 | 5 | 3 | — | — | 0.00 |
| elden ring endurance calculator | /equip-load-calculator/ | P1 | 90 | 25 | 3 | 4 | — | — | 0.00 |

### 10.7 核心工具词：Spell Scaling（1词）
| Keyword | 目标URL | 优先 | US Vol | US KD | Tarnished US流量 | 竞品US排名 | 旧Vol(市场未知) | 旧KD | US CPC |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| elden ring seal calculator | /spell-scaling-calculator/ | P2 | 40 | 15 | 3 | 3 | — | — | 0.00 |

### 10.8 关联辅助关键词（旧600词数据，市场未注明）
**这些关键词只作为未来真实数据筛选器、配装预设或说明页的主题线索；不代表应立即单独建页。**
#### Armor Browser（8词）
| Keyword | 目标URL（候选） | Volume(市场未知) | KD | CPC USD | 用途 |
|---|---|---:|---:|---:|---|
| elden ring armor | /armor/ [P2需内容质量验证] | 5,400 | 17 | 1.07 | Armor Browser |
| elden ring armor sets | /armor/ [P2需内容质量验证] | 4,400 | 21 | 0.00 | Armor Browser |
| armor sets elden ring | /armor/ [P2需内容质量验证] | 1,300 | 26 | 0.00 | Armor Browser |
| armours elden ring | /armor/ [P2需内容质量验证] | 1,300 | 23 | 0.00 | Armor Browser |
| elden ring armors | /armor/ [P2需内容质量验证] | 1,300 | 17 | 1.07 | Armor Browser |
| best armor elden ring | /armor/ [P2需内容质量验证] | 880 | 28 | 0.00 | Armor Browser |
| elden ring armor for a dark lord | /armor/ [P2需内容质量验证] | 880 | 20 | 0.00 | Armor Browser |
| elden ring armor sets for a dexterous samurai | /armor/ [P2需内容质量验证] | 880 | 24 | 0.00 | Armor Browser |

#### Build Guides & Presets（13词）
| Keyword | 目标URL（候选） | Volume(市场未知) | KD | CPC USD | 用途 |
|---|---|---:|---:|---:|---|
| elden ring build | /builds/ [P2需内容质量验证] | 1,600 | 26 | 1.51 | Build Guides & Presets |
| elden ring strength build | /builds/ [P2需内容质量验证] | 1,600 | 18 | 0.00 | Build Guides & Presets |
| elden ring faith build | /builds/ [P2需内容质量验证] | 1,300 | 24 | 0.00 | Build Guides & Presets |
| bleed build elden ring | /builds/ [P2需内容质量验证] | 1,000 | 21 | 0.00 | Build Guides & Presets |
| elden ring build tier list 2026 | /builds/ [P2需内容质量验证] | 1,000 | 12 | 0.00 | Build Guides & Presets |
| elden ring samurai build | /builds/ [P2需内容质量验证] | 1,000 | 25 | 0.00 | Build Guides & Presets |
| faith build elden ring | /builds/ [P2需内容质量验证] | 1,000 | 25 | 0.00 | Build Guides & Presets |
| fun elden ring builds | /builds/ [P2需内容质量验证] | 1,000 | 23 | 0.00 | Build Guides & Presets |
| strength build elden ring | /builds/ [P2需内容质量验证] | 1,000 | 23 | 0.00 | Build Guides & Presets |
| best bleed build elden ring | /builds/ [P2需内容质量验证] | 880 | 23 | 0.00 | Build Guides & Presets |
| blasphemous blade elden ring build | /builds/ [P2需内容质量验证] | 880 | 21 | 0.00 | Build Guides & Presets |
| elden ring frenzied samurai bleed build | /builds/ [P2需内容质量验证] | 880 | 25 | 0.00 | Build Guides & Presets |
| elden ring mage build | /builds/ [P2需内容质量验证] | 880 | 21 | 0.00 | Build Guides & Presets |

#### Equipment & Rune Reference（9词）
| Keyword | 目标URL（候选） | Volume(市场未知) | KD | CPC USD | 用途 |
|---|---|---:|---:|---:|---|
| elden ring weapons | /weapons/ [P2可选] | 18,100 | 27 | 1.17 | Equipment & Rune Reference |
| weapons elden ring | /weapons/ [P2可选] | 4,400 | 25 | 0.00 | Equipment & Rune Reference |
| elden ring great runes | /great-runes/ [P2可选] | 3,600 | 29 | 0.00 | Equipment & Rune Reference |
| great runes elden ring | /great-runes/ [P2可选] | 2,400 | 23 | 0.00 | Equipment & Rune Reference |
| bleed weapons elden ring | /weapons/ [P2可选] | 1,300 | 18 | 0.00 | Equipment & Rune Reference |
| faith weapons elden ring | /weapons/ [P2可选] | 1,300 | 24 | 0.00 | Equipment & Rune Reference |
| best elden ring weapons | /weapons/ [P2可选] | 1,000 | 26 | 1.52 | Equipment & Rune Reference |
| colossal weapons elden ring | /weapons/ [P2可选] | 1,000 | 20 | 0.00 | Equipment & Rune Reference |
| all weapons elden ring | /weapons/ [P2可选] | 880 | 26 | 0.00 | Equipment & Rune Reference |

#### Spell & Equipment Browser（16词）
| Keyword | 目标URL（候选） | Volume(市场未知) | KD | CPC USD | 用途 |
|---|---|---:|---:|---:|---|
| elden ring talismans | /talismans/ [P2可选] | 6,600 | 28 | 0.00 | Spell & Equipment Browser |
| elden ring incantations | /spells/ [P2可选] | 5,400 | 20 | 0.00 | Spell & Equipment Browser |
| incantations elden ring | /spells/ [P2可选] | 3,600 | 20 | 0.00 | Spell & Equipment Browser |
| talismans elden ring | /talismans/ [P2可选] | 3,600 | 27 | 0.00 | Spell & Equipment Browser |
| elden ring sorceries | /spells/ [P2可选] | 2,900 | 28 | 0.00 | Spell & Equipment Browser |
| elden ring spells | /spells/ [P2可选] | 2,900 | 19 | 0.00 | Spell & Equipment Browser |
| best staff elden ring | /spells/ [P2可选] | 2,400 | 20 | 0.00 | Spell & Equipment Browser |
| elden ring seals | /spells/ [P2可选] | 1,900 | 27 | 0.00 | Spell & Equipment Browser |
| best incantations elden ring | /spells/ [P2可选] | 1,600 | 29 | 0.00 | Spell & Equipment Browser |
| best talismans elden ring | /talismans/ [P2可选] | 1,600 | 29 | 2.22 | Spell & Equipment Browser |
| all legendary talismans elden ring | /talismans/ [P2可选] | 1,300 | 19 | 0.00 | Spell & Equipment Browser |
| how to use incantations elden ring | /spells/ [P2可选] | 1,300 | 23 | 0.00 | Spell & Equipment Browser |
| legendary talismans elden ring | /talismans/ [P2可选] | 1,300 | 17 | 0.00 | Spell & Equipment Browser |
| seals elden ring | /spells/ [P2可选] | 1,000 | 23 | 0.00 | Spell & Equipment Browser |
| all talismans elden ring | /talismans/ [P2可选] | 880 | 27 | 0.00 | Spell & Equipment Browser |
| best spells elden ring | /spells/ [P2可选] | 880 | 20 | 0.00 | Spell & Equipment Browser |

#### Stats & Soft Caps（8词）
| Keyword | 目标URL（候选） | Volume(市场未知) | KD | CPC USD | 用途 |
|---|---|---:|---:|---:|---|
| elden ring soft caps | /soft-caps/ | 3,600 | 26 | 0.00 | Stats & Soft Caps |
| elden ring stats | /soft-caps/ | 1,900 | 25 | 0.00 | Stats & Soft Caps |
| pve poise breaks elden ring | /soft-caps/ | 1,000 | 20 | 0.00 | Stats & Soft Caps |
| what does dex do in elden ring | /soft-caps/ | 1,000 | 19 | 0.00 | Stats & Soft Caps |
| when does intelligence peak elden ring | /soft-caps/ | 1,000 | 27 | 0.00 | Stats & Soft Caps |
| elden ring poise | /soft-caps/ | 880 | 23 | 0.00 | Stats & Soft Caps |
| elden ring respec | /soft-caps/ | 880 | 22 | 0.00 | Stats & Soft Caps |
| elden ring stat caps | /soft-caps/ | 880 | 27 | 0.00 | Stats & Soft Caps |

#### Weapon Browser & Comparison（9词）
| Keyword | 目标URL（候选） | Volume(市场未知) | KD | CPC USD | 用途 |
|---|---|---:|---:|---:|---|
| elden ring best weapons | /weapons/ [P2可选] | 2,900 | 22 | 0.00 | Weapon Browser & Comparison |
| best strength weapons elden ring | /weapons/ [P2可选] | 2,400 | 24 | 0.00 | Weapon Browser & Comparison |
| elden ring weapon tier list | /weapons/ [P2可选] | 1,900 | 21 | 0.00 | Weapon Browser & Comparison |
| best dex weapons elden ring | /weapons/ [P2可选] | 1,600 | 22 | 0.00 | Weapon Browser & Comparison |
| best faith weapons elden ring | /weapons/ [P2可选] | 1,600 | 26 | 0.00 | Weapon Browser & Comparison |
| best weapons elden ring | /weapons/ [P2可选] | 1,600 | 21 | 0.00 | Weapon Browser & Comparison |
| best dexterity weapons elden ring | /weapons/ [P2可选] | 1,300 | 25 | 0.00 | Weapon Browser & Comparison |
| best str weapons elden ring | /weapons/ [P2可选] | 1,300 | 16 | 0.00 | Weapon Browser & Comparison |
| elden ring weapons tier list | /weapons/ [P2可选] | 1,000 | 14 | 0.00 | Weapon Browser & Comparison |


## 11. 实施路线：完整目标先冻结，再按质量门槛分批发布

> 这不是“先做几个占位页就宣布完成”的分期开发。V2 已经定义完整功能范围；分阶段只是**发布顺序**，所有未经验证的模块保持内部研发，不占据公开工具导航和索引。

| 阶段 | 具体完成条件 | 交付物 | 发布条件 |
|---|---|---|---|
| A. 冻结需求与素材审计 | 67+63词分类、核心URL与证据源固定；游戏数值来源逐项许可审查 | `BUILD-INTAKE`、PRD、`DATA-PROVENANCE`、SERP缺口表 | 无未声明授权风险 |
| B. 核验基础计算 | 等级/卢恩、职业优化、负重、属性实际数值验证，补到黄金样本 | 基础四工具 + 单元测试 | 验收通过才可索引 |
| C. 武器AR实机模型 | 真实许可数据、强化/质变/曲线适用性、样本矩阵与UI对比 | Weapon AR + Compare | 真实样本通过、版本锁定 |
| D. Build 联动 | 配装与 AR / Level / Equip 全套状态往返和分享 | Build Planner | 不允许丢属性/使用假数值 |
| E. 高复杂度模块 | Damage/Armor/Spell 参数库与实机校验、优化正确性 | 真正完整的高级计算器 | 每个模块单独 Gate，通过才索引 |
| F. 站点质量 & 发布 | Astro SSG、SEO、UI、CWV、无障碍、法规检查 | GitHub 项目、Cloudflare 生产站、测试/验收报告 | P0/P1问题为0 |
| G. 生产SEO追踪 | GSC、真实抓取、广告资格、变更回归和补丁维护 | 发布后基线、30/60/90天报告 | 不把未取得搜索结果当失败数据缺失掩盖 |

### 11.1 开发AI的逐项任务清单（均为实施要求，非已完成）

- [ ] 读取最新 Website Starter Standard 的 `AGENTS.md`、`BUILD-INTAKE-CONTRACT.md`、`DESIGN.md`、`SEO-GEO-QUALITY-GATE.md`、`TASTE-UI-PROTOCOL.md`、`IMPECCABLE-UI-QUALITY-GATE.md`。
- [ ] 将本 V2 和既有 XLSX 精准关键词表冻结为项目唯一研究输入，避免二次猜测关键词数据。
- [ ] 在 GitHub 建立新项目仓库前确认用户希望的账号和仓库名，未经授权不得写入现有其他站点仓库。
- [ ] 读取 V2 预览源码，保留已通过测试，建立 TypeScript/静态站迁移基线。
- [ ] 完成合法数据源与来源文档、实际游戏测试样本采集流程。
- [ ] 完成游戏数据版本化、计算器输出状态协议、独立 Worker 和分享编解码。
- [ ] 完成正式核心工具、状态联动、桌面/手机 UI、错误状态与无障碍。
- [ ] 只为已验收工具生成可索引页面，未就绪研发工具不进 sitemap。
- [ ] 自动执行 lint/typecheck/unit/golden/e2e/静态 SEO 检测并产出证据。
- [ ] Cloudflare Pages Free 预览 → 浏览器真机检查 → 生产发布 → GSC 索引测试。
- [ ] 建立补丁更新差异审核流程、监控失败报警与回滚程序。

## 12. 维护：以官方补丁触发，不依赖常驻自动任务

**官方已核实事实**（2026-10-30为止）：2026-08-27 官方 1.17 补丁加入两个付费额外内容可选的初始职业与武器调整；2026-10-20 官方 1.17.2 为修复补丁，无新增内容，主机/PC 的 App 为 1.17.2、Regulation 为 1.17.3。不可把这两个版本号混写成同一个，也不能因为“Bug Fixes Only”就直接假定所有计算机制不受影响。

| 触发 | 操作 | 是否必须部署 |
|---|---|---|
| 官方公布新补丁 | 检查 patch note、版本变化、角色/武器/规则变化 | 先审计，不一定部署 |
| 新增武器、质变、装备或职业 | 更新受影响的数据 JSON，补样本和对应UI筛选 | 数据核验后部署 |
| 游戏平衡改动影响AR/伤害 | 复核公式/黄金样本并出回归报告 | 通过后部署；不通过暂停受影响结果 |
| 纯UI/文本 bugfix | 判断是否影响计算，记录“无需数据更新”依据 | 可不部署 |
| 用户报告不一致 | 收集复现输入 + 游戏版本 + 截图/证据，建Issue | 确认错误后修复 |
| 无补丁、无BUG | 无需每日人工维护或服务器定时抓取 | 无需部署 |

- 使用 GitHub Issue 模板固定 `game version / DLC / input / expected / actual / reproduction`。
- GitHub Actions 可在免费额度内运行 CI，或手动检查官方公告；**不会在未实际配置的情况下宣称已自动监控**。
- 每次部署保留可回滚产物和 checksum；若当前游戏版本未被支持，页面显示“Latest supported regulation ...”，不能暗示永远最新。
- 推荐项目内部补丁响应目标：受影响核心功能先标记不支持，再完成数值核验，避免未验证数据仍作为准确结果显示。具体更新耗时不做承诺。

## 13. 强制上线验收 Gate 与交付证据

| Gate | 必须保存的证据 | 判定 |
|---|---|---|
| Data/Legal | 来源、许可证、素材权属、游戏版本和数据覆盖表 | 未通过不能上线依赖数据的结果 |
| Formula/Golden | 实机数值对照、边界测试、失败记录、回归记录 | 对声称准确的模块有重大偏差即失败 |
| Frontend/Task | 桌面/手机实际结果截图与完整任务 E2E、表单边界和取消优化 | 主要任务失败为P0 |
| SEO | Raw HTML与渲染对比、title/H1/canonical/robots/sitemap、工具可索引清单 | 关键页误noindex、空壳或重复则失败 |
| Visual/a11y | 360/390/768/1024/1440宽度、键盘、触摸、读屏和对比度 | P0/P1缺陷不通过 |
| Performance | 移动端 LCP/INP/CLS 真实测量或实验室测量注明口径 | 无数据记 NOT RUN，不能虚报通过 |
| Release | Cloudflare Pages 实际部署 URL、GSC URL检查、版本标识、回滚证明 | 无生产部署证据不宣称上线 |
| AdSense | 原创/功能完整/广告政策/隐私与同意制度/无效流量风险 | 未通过不得声称广告已可变现 |

可参考内部性能目标：**LCP≤2.5s、INP≤200ms、CLS≤0.1**（Google良好阈值，使用合适百分位与实际数据源）；任务响应/Worker效率由真实设备预算与任务正确性验证，不把一次本机跑分当作线上用户数据。

## 14. GitHub 网站标准对齐与版本差异报告

核对 `chenmu2024/Website-Starter-Standard` 的 README、`BUILD-INTAKE-CONTRACT.md`、`DESIGN.md`、`SEO-GEO-QUALITY-GATE.md`、`IMPECCABLE-UI-QUALITY-GATE.md`（本轮读取）。**商业研究归 gefei-seo，工程实现/验收归 Website Starter；V2 是用户选择继续开发后工程输入，不代替缺失的 SERP 验证。**

交付物至少包括：

- `docs/PRD.md`（本V2细化）、项目 `docs/DESIGN.md`（不能留下 TBD）、`docs/SEO-GEO-PROJECT-BRIEF.md`、`docs/DATA-PROVENANCE.md`；
- `UI-RELEASE-EVIDENCE.md`、`SEO-GEO-RELEASE-EVIDENCE.md`、`QA-CHECKLIST.md`；
- 版本化 `game-data-manifest.json`、金样本测试套件与版权审查记录；
- 开发/生产截图、真实构建/测试日志、GSC基线和生产访问链接（**仅在真正部署后才提供**）。

动效默认允许有意义的轻量变化反馈，但不得影响性能/SEO或引入付费 API；不必为动效增加后台运行服务。

## 15. 已知风险、不能偷偷跨过的决定

1. **最重大风险：数据许可与准确性。** 代码可开源，游戏数值/模型不等于可任意复制；当前没有商业使用完整游戏数据库的许可结论，也没有 AR 黄金样本。
2. **SEO风险：** 小站竞品有实际流量，但逐词 SERP 与页面级竞争仍未全部证明；建站不保证关键词进入前三。
3. **内容扩张风险：** 63个辅助词不少是攻略意图，不能直接变成数百个自动生成页面；必须有原创可交互价值。
4. **DLC 分歧：** 两个新职业属于特定额外内容，用户要选择内容包；旧数据可能不适用于新增职业。
5. **游戏商标风险：** 品牌/域名采用不易混淆的中性名称；“Elden Ring”在正文作为必要描述可使用，但不等于没有任何商标风险；发布免责声明与联系渠道。
6. **数据版本过时：** 2026年游戏仍更新。官网版本显示必须可核对；不支持的版本不输出伪准确数值。
7. **隐私/广告：** 当前目标无登录无上传；若将来接入广告/分析，不能把“零外部数据访问”继续写进隐私政策。
8. **域名和收益：** 域名未选/注册可用性未核查，AdSense未审核，预计收入未知。

## 16. 官方与开发资料（核查日期2026-10-30）

### 一手官方来源

- 2026-08-27 官方 1.17 版本公告及 Tarnished Pack 附加职业/平衡变化：https://en.bandainamcoent.eu/elden-ring/news/elden-ring-patch-notes-version-117
- 2026-10-20 官方 1.17.2（App 1.17.2 / Regulation 1.17.3）：https://en.bandainamcoent.eu/elden-ring/news/elden-ring-patch-notes-version-1172
- Google scaled-content spam政策：https://developers.google.com/search/docs/essentials/spam-policies
- Google SoftwareApplication结构化数据：https://developers.google.com/search/docs/appearance/structured-data/software-app
- Cloudflare Pages Free上限：https://developers.cloudflare.com/pages/platform/limits/

### 工程参考与事实限制

- 网站标准：https://github.com/chenmu2024/Website-Starter-Standard
- Github `EldenRingDatabase/erdb`：解析器和技术描述参考，**不等于游戏数值许可**：https://github.com/EldenRingDatabase/erdb
- 代码研究报告：`Elden_Ring_第二阶段开发验收_20261030.md`，V2研究ZIP `Elden_Ring_Build_Lab_V2_AR研究与基础工具_20261030.zip`（若可用，按当前实际工作目录读取）。
- 研究源数据：`粘贴的文本 (1)(10).txt`（600条，国家未知）、`粘贴的文本 (1)(20261030-023303).txt`（200条US排名行）、原始 Excel 工作簿（8个工作表）。

---

## 17. V1 → V2 修订清单（审计）

| V1不足/歧义 | V2处理 |
|---|---|
| “9项属性”与游戏实际不符 | 改为8项属性，等级另算 |
| 12职业默认为所有玩家可用 | 新增 DLC 可用性/权益门槛，单独管理 Tarnished Pack |
| 简单描述“高精度AR” | 改成数据/曲线/样本/版本/误差的分级发布合同 |
| Damage 与 AR 可能被混淆 | 强制分项、目标防御、PvE/PvP与假精度阻断 |
| 数据来源写得太笼统 | 数据字段、版本快照、LICENSE和 provenance 证据链 |
| 缺少明确参数与验收条件 | 8项核心工具 PRD + 黄金样本数量目标 + 错误状态 |
| “零成本”可能忽略隐形运行费 | 明确免费静态托管、运行时无API、广告/隐私例外 |
| 关键词与URL映射有 P0/P2 矛盾 | 保留原词数据，明确跨页承接与独立比较工具的发布条件 |
| 缺少真正可执行的页面设计方案 | 增加色彩 token、布局、交互、响应式、减少动画、可访问性 |
| 预览版状态容易被误解为正式完成 | 明确18项测试、0真实AR黄金样本、0正式武器数据、生产未部署 |
| SEO/GEO规则宏观 | 增加 raw HTML、index/noindex/canonical/sitemap、页面内容模块、结构化数据边界 |
| 维护计划没有触发/回滚流程 | 补丁差异审查、暂停受影响数据、回归、发布与回滚 |
| 缺上线交付审计 | 证据清单、完成状态、P0/P1停发规则 |

**开发交接最终指令：** 基于本方案和现有研究源码继续，而不是从零使用虚构游戏数据拼出漂亮演示。首先完成**数据合法性、真实AR黄金样本、核心公式实测**；只对通过审核的模块开放正式索引。若数据无法合法可靠取得，停止依赖它的正式页面发布并明示阻塞，不向用户制造“全部完成”的假象。
