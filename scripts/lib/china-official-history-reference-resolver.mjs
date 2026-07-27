import { compact, stableId } from "./event-promotion-core.mjs";

const compoundSurnames = new Set([
  "司马", "上官", "欧阳", "夏侯", "诸葛", "闻人", "东方", "赫连", "皇甫", "尉迟",
  "公羊", "公师", "澹台", "公冶", "宗政", "濮阳", "淳于", "单于", "太叔", "申屠", "公孙",
  "仲孙", "轩辕", "令狐", "钟离", "宇文", "长孙", "慕容", "司徒", "司空", "毌丘", "鲜于",
]);
const singleSurnames = new Set([
  ..."赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏窦章云苏潘葛奚范彭郎鲁韦昌马苗方俞任袁柳鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯卢莫房裘缪干解应宗丁宣邓郁单杭洪包诸左石崔吉龚程邢滑裴陆荣翁荀羊甄曲封糜耿刑衙但刘劉阳陽",
]);
singleSurnames.add("来");
singleSurnames.add("祭");
singleSurnames.add("阎");
singleSurnames.add("逢");
singleSurnames.add("巴");
singleSurnames.add("翟");
singleSurnames.add("师");
singleSurnames.add("師");
singleSurnames.add("侯");
const rejectedNames = new Set([
  "将军", "太守", "刺史", "都督", "司马", "校尉", "中郎", "长史", "司徒", "司空",
  "太尉", "丞相", "尚书", "侍中", "天子", "皇帝", "太子", "群臣", "诸军", "吏民", "万年",
  "高句骊", "高句麗", "于阗", "于闐", "于窴", "龟兹", "龜茲", "车师", "車師", "尤来", "尤來",
  "南单于", "南單于", "乌桓", "烏桓", "鲜卑", "鮮卑", "匈奴",
  "平之", "余众", "余眾", "诸夷", "諸夷", "于冀西", "於冀西", "江都长", "江都長", "遂相招而",
  "于猎中", "於獵中", "于鸾鸟", "於鸞鳥", "贼复", "賊復",
]);
const rejectedNameTailPattern = /(?:众悉|眾悉|盗贼|盜賊|种羌|種羌|叛羌|讨之|討之|攻之|击之|擊之|破之|杀之|殺之|遣兵|以降|以罪|卒见|卒見|招诱|招誘|应募|應募|枉|虽|雖|谋|謀|被|诱|誘|追|迫|奏|薨|崩|卒|遣|氏|羌|蛮|蠻|夷)$/u;
const actionBoundary = "皆下狱|皆下獄|皆为|皆為|下狱|下獄|捕系|捕繫|举城降|舉城降|卒见杀|卒見殺|以罪诛|以罪誅|始遣|谋叛|謀叛|被诛|被誅|诱诛|誘誅|枉杀|枉殺|招诱|招誘|应募|應募|谋诛|謀誅|奏诛|奏誅|大破|东击|東擊|西击|西擊|南击|南擊|北击|北擊|追擊|追击|迫殺|迫杀|遣兵|讽|諷|等|率|将|領|领|遣|使|攻|討|讨|伐|擊|击|追|迫|救|拒|守|圍|围|破|敗|败|戰|战|降|赴|屯|拜|為|为|舉|举|反|叛|殺|杀|誅|诛|斬|斩|害|奔|走|據|据|入|出|向|于|於|坐|遇害|被害|薨|卒|崩|死|及|與|与|、|，|。|；|：|$";
const officePattern = new RegExp(
  `(?:大司馬|大司马|驃騎將軍|骠骑将军|車騎將軍|车骑将军|衛將軍|卫将军|征[東东西西南北]將軍|征[东东西西南北]将军|鎮[東东西西南北]將軍|镇[东东西西南北]将军|安[東东西西南北]將軍|安[东东西西南北]将军|平[東东西西南北]將軍|平[东东西西南北]将军|中郎將|中郎将|牙門將|牙门将|偏將軍|偏将军|裨將軍|裨将军|步兵校尉|步兵校尉|將軍|将军|太守|刺史|都督|都護|都护|都尉|校尉|長史|长史|尚書令|尚书令|侍中|司徒|衛尉|卫尉|(?:永樂|永乐)?少府|內史|内史|流人)([\\p{Script=Han}]{2,4}?)(?=${actionBoundary})`,
  "gu",
);
const additionalOfficePattern = new RegExp(
  `(?:司隸校尉|司隶校尉|中常侍|常侍|太傅|太僕|太仆|太尉|司空|大鴻臚|大鸿胪|光祿勳|光禄勋|執金吾|执金吾|(?:長樂|长乐|永樂|永乐)少府|[\\p{Script=Han}]{1,4}相)([\\p{Script=Han}]{2,4}?)(?=${actionBoundary})`,
  "gu",
);
const polityGeneralPattern = new RegExp(
  `(?:漢|汉|魏|蜀|吳|吴|晉|晋|燕|趙|赵|秦|楚|齊|齐|梁|宋|陳|陈|周|唐|遼|辽|金|元|明|清)(?:大)?(?:將軍|将军|將|将)([\\p{Script=Han}]{2,4}?)(?=${actionBoundary})`,
  "gu",
);
const actionActorPattern = new RegExp(
  `(?:^|[，。；、])([\\p{Script=Han}]{2,4}?)(?=等?(?:(?:率|帥|帅)(?:众|眾)|以郡|遣將|遣将|[東东西南北])?(?:起兵|舉兵|举兵|興兵|兴兵|反|叛|謀反|谋反|謀叛|谋叛|篡位|稱帝|称帝|稱王|称王|稱漢|称汉|(?:僣|僭)(?:号|號|即)|举城降|舉城降|卒见杀|卒見殺|以罪诛|以罪誅|始遣|被诛|被誅|诱诛|誘誅|枉杀|枉殺|招诱|招誘|应募|應募|谋诛|謀誅|奏诛|奏誅|大破|追擊|追击|迫殺|迫杀|遣兵|攻|討|讨|伐|擊|击|殺|杀|誅|诛|斬|斩|降))`,
  "gu",
);
const multiRouteActionActorsPattern = /(?:^|[，。；])((?:[\p{Script=Han}]{2,4}、){1,7}[\p{Script=Han}]{2,4})(?=等?[一二三四五六七八九十]+道出[擊击])/gu;
const officeActionObjectPattern = new RegExp(
  `(?:誅|诛|殺|杀|斬|斩|害|廢|废|黜)(?:太傅|太尉|司徒|司空|大司馬|大司马|大將軍|大将军|將軍|将军|刺史|太守)([\\p{Script=Han}]{2,4}?)(?=等|及|與|与|于|於|，|。|；|、|$)`,
  "gu",
);
const actionObjectPattern = new RegExp(
  `(?:誅|诛|殺|杀|斬|斩|害|廢|废|黜)([\\p{Script=Han}]{2,4}?)(?=等|及|與|与|于|於|，|。|；|、|$)`,
  "gu",
);
const passiveActorPattern = new RegExp(
  `(?:為|为)([\\p{Script=Han}]{2,4}?)(?=所(?:破|敗|败|殺|杀|誅|诛|害))`,
  "gu",
);
const commanderActionPattern = new RegExp(
  `(?:遣別將|遣别将|別將|别将|遣將|遣将|使其將|使其将|部將|部将)([\\p{Script=Han}]{2,4}?)(?=等?(?:起兵|舉兵|举兵|攻|討|讨|伐|擊|击|破|殺|杀|誅|诛))`,
  "gu",
);
const originPersonActionPattern = new RegExp(
  `(?:[\\p{Script=Han}]{1,4})(?:人|流人)([\\p{Script=Han}]{2,4}?)(?=等?(?:起兵|舉兵|举兵|反|叛|应募|應募|招诱|招誘|攻|討|讨|伐|擊|击|殺|杀|誅|诛|害|執|执|降))`,
  "gu",
);
const battleTargetPattern = new RegExp(
  `(?:攻|討|讨|伐|擊|击|破|敗|败)(?:賊|贼)?(?:鮮卑|鲜卑|匈奴|羌|胡)?([\\p{Script=Han}]{2,4}?)(?=于|於|，|。|；|、|$)`,
  "gu",
);
const possessorSubordinatePattern = new RegExp(
  `(?:^|[，。；、攻討讨伐擊击破敗败])([\\p{Script=Han}]{2,4}?)(?:將|将)([\\p{Script=Han}]{2,4}?)(?=于|於|，|。|；|、|$)`,
  "gu",
);
const factionTargetPattern = /(?:攻|討|讨|伐|擊|击|破)([\p{Script=Han}]{2,4}?)党([\p{Script=Han}]{2,4}?)(?=于|於|，|。|；|、|$)/gu;
const kinshipActionPattern = /([\p{Script=Han}]{2,4}?)(?:使)?(?:從弟|从弟|弟|子)([\p{Script=Han}]{1,2})(?=及|與|与|等|起兵|舉兵|举兵|反|叛|攻|討|讨|伐|擊|击|殺|杀|誅|诛|害|圍|围)/gu;
const surrenderActorPattern = new RegExp(
  `(?:^|[，。；、])(?:[\\p{Script=Han}]{1,4}?(?:人|賊|贼))?([\\p{Script=Han}]{2,4}?)(?:等)?(?:率(?:众|眾))?(?=詣|诣)`,
  "gu",
);
const steppeSovereigntyActorPattern = /(?:匈奴)?(?:左|右)?谷蠡王([\p{Script=Han}]{2,5})(?=自立为单于)/gu;
const steppeKinshipActorPattern = /(?:南|北)?(?:单于|單于)[\p{Script=Han}]{1,6}(?:从弟子|從弟子|从弟|從弟|弟子)([\p{Script=Han}]{2,5}?)(?=(?:率|帥|帅|反|叛|攻|討|讨|伐|擊|击|殺|杀|誅|诛))/gu;
const ethnicRebelActorPattern = /(?:蛮|蠻|羌|夷|胡)([\p{Script=Han}]{2,4}?)(?=等?(?:始)?(?:反|叛))/gu;
const foreignRulerDiplomacyActorPattern = /(?:王)([\p{Script=Han}]{2,5})(?=(?:慕义|慕義)[，,]?(?:遣使|来朝|來朝|献|獻))/gu;
const jinTitledPeople = [
  { name: "刘渊", titles: ["刘元海", "劉元海", "元海"] },
  { name: "司马敦", titles: ["安平王敦"] },
  { name: "司马亮", titles: ["汝南王亮"] },
  { name: "司马玮", titles: ["楚王玮", "楚王瑋"] },
  { name: "司马伦", titles: ["赵王伦", "趙王倫"] },
  { name: "司马冏", titles: ["齐王冏", "齊王冏"] },
  { name: "司马乂", titles: ["长沙王乂", "長沙王乂"] },
  { name: "司马颖", titles: ["成都王颖", "成都王穎"] },
  { name: "司马颙", titles: ["河间王颙", "河間王顒"] },
  { name: "司马越", titles: ["东海王越", "東海王越"] },
  { name: "司马允", titles: ["淮南王允"] },
  { name: "司马遹", titles: ["广陵王遹", "廣陵王遹", "皇太子遹", "庶人遹"] },
  { name: "司马攸", titles: ["齐王攸", "齊王攸"] },
  { name: "司马柬", titles: ["秦王柬"] },
  { name: "司马肜", titles: ["梁王肜"] },
  { name: "司马繇", titles: ["东安王繇", "東安王繇"] },
  { name: "司马楙", titles: ["东平王楙", "東平王楙"] },
  { name: "司马晃", titles: ["下邳王晃"] },
  { name: "司马轨", titles: ["毗陵王轨", "毗陵王軌"] },
  { name: "司马羕", titles: ["西阳王羕", "西陽王羕"] },
  { name: "司马耽", titles: ["中山王耽"] },
  { name: "司马泓", titles: ["太原王泓"] },
  { name: "司马遐", titles: ["清河王遐"] },
  { name: "司马植", titles: ["彭城王植"] },
  { name: "司马晏", titles: ["吴王晏", "吳王晏"] },
  { name: "司马蕤", titles: ["东莱王蕤", "東萊王蕤"] },
  { name: "司马迪", titles: ["汉王迪", "漢王迪"] },
  { name: "司马歆", titles: ["新野王歆"] },
  { name: "司马虓", titles: ["范阳王虓", "范陽王虓"] },
  { name: "司马略", titles: ["高密王略"] },
  { name: "司马模", titles: ["南阳王模", "南陽王模"] },
  { name: "贾南风", titles: ["贾后", "賈后", "贾皇后", "賈皇后", "贾庶人", "賈庶人"] },
  { name: "羊献容", titles: ["羊后", "羊皇后", "皇后羊氏"] },
];
const jinTitleAliases = new Set(jinTitledPeople.flatMap((person) => person.titles));
const hanTitledPeople = [
  { name: "郭圣通", titles: ["郭皇后", "光武郭皇后"] },
  { name: "阴丽华", titles: ["光武阴皇后", "光武陰皇后", "光烈皇后"] },
  { name: "邓绥", titles: ["邓太后", "鄧太后", "和熹皇后"] },
  { name: "梁妠", titles: ["梁太后", "顺烈皇后", "順烈皇后"] },
];
const hanTitleAliases = new Set(hanTitledPeople.flatMap((person) => person.titles));
const hanPrincelyTitlePattern = /(?:^|[，。；、])([\p{Script=Han}]{1,4}?)(?:孝|共|恭|哀|惠|景|靖|顷|頃|康|昭|穆|怀|懷|悼|夷|厉|厲|戴|献|獻|敬|宪|憲)?王([\p{Script=Han}])(?=，|。|；|、|复|復|封|徙|进|進|来|來|子|薨|卒|死|被|及|自|无|無|$)/gu;
const rejectedHanPrincelyTitlePrefix = /(?:其|此|彼|何)$|^(?:复|復|封|徙|进|進|帝|天子|皇|国|國|郡|县|縣|大|偏|左|右|前|后|後|中|上|下|空|军|軍|将|將|侍)$|(?:将军|將軍|司徒|司空|太尉|太守|刺史|校尉|都尉|中郎将|中郎將|中常侍|常侍)$/u;
const rejectedHanPrincelyGivenNames = new Set(["首", "后", "後", "众", "眾", "者", "薨", "崩", "卒", "遣", "夭没", "夭沒"]);
const easternHanImperialChildPattern = /(?:皇太子|皇子|皇弟)([\p{Script=Han}]{1,2})(?=为|為|，|。|；|、|$)/gu;
const easternHanImperialGrantRecipientPattern = /(?:皇弟([\p{Script=Han}]{1,2})|[，、]([\p{Script=Han}]))(?=(?:为|為)[\p{Script=Han}]{1,6}王)/gu;
const easternHanPrincelyChildPattern = /(?:故)?[\p{Script=Han}]{1,4}(?:孝|共|恭|哀|惠|景|靖|顷|頃|康|昭|穆|怀|懷|悼|夷|厉|厲|戴|献|獻|敬|宪|憲)?王[\p{Script=Han}]子([\p{Script=Han}]{1,2})(?=为|為|，|。|；|、|$)/gu;
const easternHanPrincelySiblingPattern = /(?:故)?[\p{Script=Han}]{1,4}(?:孝|共|恭|哀|惠|景|靖|顷|頃|康|昭|穆|怀|懷|悼|夷|厉|厲|戴|献|獻|敬|宪|憲)?王([\p{Script=Han}])兄([\p{Script=Han}]{1,2})(?=为|為)/gu;
const easternHanDynasticChildGrantPattern = /封([\p{Script=Han}]{1,2}?)(?:庶)?子(?:[\p{Script=Han}]{1,6}侯)?([\p{Script=Han}]{1,2})(?=(?:为|為)[\p{Script=Han}]{1,6}王)/gu;
const easternHanImperialBirthPattern = /(?:贵人|貴人|皇后|后|後)生([\p{Script=Han}]{1,2})(?=，[^。；]{0,20}立为皇太子)/gu;
const jinContextualPeople = [
  { name: "齐万年", aliases: ["万年", "萬年"], pattern: /(?:攻|討|讨|伐|擊|击)(?:万年|萬年)(?=于|於|，|。|；|、|$)/u },
  { name: "郝度元", aliases: ["度元"], pattern: /(?:為|为)度元所(?:破|敗|败)|度元(?:率|帥|帅|攻|反|戰|战)/u },
  { name: "石勒", aliases: ["勒"], pattern: /(?:攻|討|讨|伐|擊|击|破|敗|败|圍|围)勒(?=于|於|，|。|；|、|$)/u },
];

function normalizeExtractedName(value, text, match) {
  let name = compact(value)
    .replace(/(?:及党|及黨|党与|黨與|率众|率眾|帅众|帥眾|以郡|遣将|遣將|以降)$/u, "")
    .replace(/等$/u, "")
    .replace(/(?:下狱|下獄)$/u, "")
    .replace(/[又复復乃遂并並]$/u, "");
  const nextText = text.slice((match.index ?? 0) + match[0].length);
  if (name.length >= 2 && nextText.startsWith(name.at(-1)) && /[举舉攻讨討伐击擊杀殺诛誅]/u.test(name.at(-1))) {
    name = name.slice(0, -1);
  }
  return name;
}

function hasHistoricalSurname(name) {
  if (name.length < 2 || name.length > 4 || rejectedNames.has(name)) return false;
  if (rejectedNameTailPattern.test(name)) return false;
  if (/^(?:司徒|司空|太尉|卫尉|衛尉|少府|中郎|校尉|都尉|太守|刺史|将军|將軍)/u.test(name)) return false;
  if (/(?:太守|刺史|都尉|校尉|将军|將軍|内史|內史|及党|及黨|帅众|帥眾|率众|率眾|以郡|战败|戰敗|遣将|遣將|将|请|請)$/u.test(name)) return false;
  if (/[弟其而]/u.test(name) || /自立|嗣位/u.test(name)) return false;
  return compoundSurnames.has(name.slice(0, 2)) || singleSurnames.has(name[0]);
}

export function provisionalOfficialHistoryPersonId(name, contextKey = "unscoped") {
  return `official-history-person-${stableId(`china-official-history-v1:${contextKey}:${name}`).slice(0, 16)}`;
}

export function canonicalProvisionalOfficialHistoryPersonId(person, options = {}) {
  if (!person?.provisional || !options.mergeByName) return person?.id ?? null;
  const scopedEvidence = new Set(options.scopedEvidence ?? []);
  if (scopedEvidence.has(person.via ?? person.evidence)) return person.id;
  return provisionalOfficialHistoryPersonId(person.name, `promotion-profile:${options.profileId}`);
}

export function officialHistoryProvisionalPersonNameAuditReasons(value) {
  const name = compact(value);
  const reasons = [];
  if (/^(?:及|与|與)/u.test(name) || /(?:等反|等叛|夭没|夭沒|薨|崩|卒|遣|[一二三四五六七八九十百千万]+人)$/u.test(name)) {
    reasons.push("collective-or-action-tail");
  }
  if (/(?:父|母|舅|叔|伯)$/u.test(name)) reasons.push("kinship-title-tail");
  return reasons;
}

export function extractExplicitOfficialHistoryPeople(value, knownNames = [], options = {}) {
  const text = compact(value);
  const known = new Set([
    ...knownNames,
    ...(options.excludedNames ?? []),
  ].map(compact).filter(Boolean));
  const results = new Map();
  for (const [pattern, evidence] of [
    [additionalOfficePattern, "office-title"],
    [officePattern, "office-title"],
    [polityGeneralPattern, "polity-general"],
    [actionActorPattern, "action-actor"],
    [officeActionObjectPattern, "office-action-object"],
    [actionObjectPattern, "action-object"],
    [passiveActorPattern, "passive-actor"],
    [commanderActionPattern, "commander-action"],
    [originPersonActionPattern, "origin-person-action"],
    [battleTargetPattern, "battle-target"],
  ]) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const name = normalizeExtractedName(match[1], text, match);
      if (
        !hasHistoricalSurname(name)
        || known.has(name)
        || (String(options.contextKey ?? "").startsWith("jinshu") && jinTitleAliases.has(name))
        || (String(options.contextKey ?? "").startsWith("houhanshu") && hanTitleAliases.has(name))
      ) continue;
      results.set(name, {
        id: provisionalOfficialHistoryPersonId(name, options.contextKey),
        name,
        matched: name,
        evidence,
        confidence: "high",
        provisional: true,
        contextKey: options.contextKey ?? "unscoped",
      });
    }
  }
  multiRouteActionActorsPattern.lastIndex = 0;
  for (const match of text.matchAll(multiRouteActionActorsPattern)) {
    for (const rawName of match[1].split("、")) {
      const name = compact(rawName).replace(/等$/u, "");
      if (!hasHistoricalSurname(name) || known.has(name)) continue;
      results.set(name, {
        id: provisionalOfficialHistoryPersonId(name, options.contextKey),
        name,
        matched: name,
        evidence: "multi-route-action-actor",
        confidence: "high",
        provisional: true,
        contextKey: options.contextKey ?? "unscoped",
      });
    }
  }
  for (const [pattern, evidence] of [
    [steppeSovereigntyActorPattern, "steppe-sovereignty-actor"],
    [steppeKinshipActorPattern, "steppe-kinship-actor"],
    [ethnicRebelActorPattern, "ethnic-rebel-actor"],
    [foreignRulerDiplomacyActorPattern, "foreign-ruler-diplomacy-actor"],
  ]) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const matched = compact(match[1]).replace(/等始?$/u, "").replace(/等?(?:反|叛)$/u, "").replace(/等$/u, "");
      const name = matched.replace(/於/gu, "于");
      if (
        name.length < 2
        || /^(?:及|与|與)/u.test(name)
        || rejectedNames.has(name)
        || rejectedNameTailPattern.test(name)
        || known.has(name)
      ) continue;
      results.set(name, {
        id: provisionalOfficialHistoryPersonId(name, options.contextKey),
        name,
        matched,
        evidence,
        confidence: "high",
        provisional: true,
        contextKey: options.contextKey ?? "unscoped",
      });
    }
  }
  possessorSubordinatePattern.lastIndex = 0;
  for (const match of text.matchAll(possessorSubordinatePattern)) {
    const possessor = compact(match[1]);
    const name = compact(match[2]);
    if (!hasHistoricalSurname(possessor) || !hasHistoricalSurname(name) || known.has(name)) continue;
    results.set(name, {
      id: provisionalOfficialHistoryPersonId(name, options.contextKey),
      name,
      matched: name,
      evidence: "subordinate-name",
      confidence: "high",
      provisional: true,
      contextKey: options.contextKey ?? "unscoped",
    });
  }
  factionTargetPattern.lastIndex = 0;
  for (const match of text.matchAll(factionTargetPattern)) {
    for (const value of [match[1], match[2]]) {
      const name = compact(value);
      if (!hasHistoricalSurname(name) || known.has(name)) continue;
      results.set(name, {
        id: provisionalOfficialHistoryPersonId(name, options.contextKey),
        name,
        matched: name,
        evidence: "faction-target",
        confidence: "high",
        provisional: true,
        contextKey: options.contextKey ?? "unscoped",
      });
    }
  }
  surrenderActorPattern.lastIndex = 0;
  for (const match of text.matchAll(surrenderActorPattern)) {
    const name = normalizeExtractedName(match[1], text, match);
    if (!hasHistoricalSurname(name) || known.has(name)) continue;
    results.set(name, {
      id: provisionalOfficialHistoryPersonId(name, options.contextKey),
      name,
      matched: name,
      evidence: "surrender-actor",
      confidence: "high",
      provisional: true,
      contextKey: options.contextKey ?? "unscoped",
    });
  }
  kinshipActionPattern.lastIndex = 0;
  for (const match of text.matchAll(kinshipActionPattern)) {
    const anchor = compact(match[1]);
    const givenName = compact(match[2]);
    if (!hasHistoricalSurname(anchor) || !known.has(anchor)) continue;
    const surname = compoundSurnames.has(anchor.slice(0, 2)) ? anchor.slice(0, 2) : anchor[0];
    const name = `${surname}${givenName}`;
    if (!hasHistoricalSurname(name) || known.has(name)) continue;
    results.set(name, {
      id: provisionalOfficialHistoryPersonId(name, options.contextKey),
      name,
      matched: compact(match[0]),
      evidence: "kinship-action",
      confidence: "high",
      provisional: true,
      contextKey: options.contextKey ?? "unscoped",
    });
  }
  if (String(options.contextKey ?? "").startsWith("jinshu")) {
    for (const person of jinTitledPeople) {
      const matched = person.titles.find((title) => text.includes(title));
      if (!matched || known.has(person.name) || known.has(matched)) continue;
      results.set(person.name, {
        id: provisionalOfficialHistoryPersonId(person.name, "jin-dynasty-titled-person"),
        name: person.name,
        matched,
        evidence: "jin-princely-title",
        confidence: "high",
        provisional: true,
        contextKey: options.contextKey,
      });
    }
    for (const person of jinContextualPeople) {
      const matched = person.aliases.find((alias) => text.includes(alias));
      if (!matched || !person.pattern.test(text) || known.has(person.name) || known.has(matched)) continue;
      results.set(person.name, {
        id: provisionalOfficialHistoryPersonId(person.name, "jin-dynasty-contextual-person"),
        name: person.name,
        matched,
        evidence: "jin-contextual-person",
        confidence: "high",
        provisional: true,
        contextKey: options.contextKey,
      });
    }
  }
  if (String(options.contextKey ?? "").startsWith("houhanshu")) {
    for (const person of hanTitledPeople) {
      const matched = person.titles.find((title) => text.includes(title));
      if (!matched || known.has(person.name) || known.has(matched)) continue;
      results.set(person.name, {
        id: provisionalOfficialHistoryPersonId(person.name, "han-dynasty-titled-person"),
        name: person.name,
        matched,
        evidence: "han-imperial-title",
        confidence: "high",
        provisional: true,
        contextKey: options.contextKey,
      });
    }
    hanPrincelyTitlePattern.lastIndex = 0;
    for (const match of text.matchAll(hanPrincelyTitlePattern)) {
      const titlePrefix = compact(match[1]);
      if (rejectedHanPrincelyTitlePrefix.test(titlePrefix)) continue;
      const givenName = compact(match[2]);
      if (rejectedHanPrincelyGivenNames.has(givenName)) continue;
      const name = `刘${givenName}`;
      const matched = compact(match[0])
        .replace(/^[，。；、]/u, "")
        .replace(/^(?:绍封|紹封|封)/u, "");
      if (!hasHistoricalSurname(name) || known.has(name) || known.has(matched)) continue;
      results.set(name, {
        id: provisionalOfficialHistoryPersonId(name, "eastern-han-princely-title"),
        name,
        matched,
        evidence: "eastern-han-princely-title",
        confidence: "high",
        provisional: true,
        contextKey: options.contextKey,
      });
    }
    for (const [pattern, evidence] of [
      [easternHanImperialChildPattern, "eastern-han-imperial-child"],
      [easternHanPrincelyChildPattern, "eastern-han-princely-child"],
      [easternHanImperialBirthPattern, "eastern-han-imperial-birth"],
    ]) {
      pattern.lastIndex = 0;
      for (const match of text.matchAll(pattern)) {
        const givenName = compact(match[1]);
        const name = "刘" + givenName;
        const matched = compact(match[0]);
        if (
          rejectedHanPrincelyGivenNames.has(givenName)
          || !hasHistoricalSurname(name)
          || known.has(name)
          || known.has(matched)
        ) continue;
        results.set(name, {
          id: provisionalOfficialHistoryPersonId(name, evidence),
          name,
          matched,
          evidence,
          confidence: "high",
          provisional: true,
          contextKey: options.contextKey,
        });
      }
    }
    if (text.includes("皇弟")) {
      easternHanImperialGrantRecipientPattern.lastIndex = 0;
      for (const match of text.matchAll(easternHanImperialGrantRecipientPattern)) {
        const givenName = compact(match[1] ?? match[2]);
        const name = `刘${givenName}`;
        if (!hasHistoricalSurname(name) || known.has(name)) continue;
        results.set(name, {
          id: provisionalOfficialHistoryPersonId(name, "eastern-han-imperial-child"),
          name,
          matched: givenName,
          evidence: "eastern-han-imperial-child",
          confidence: "high",
          provisional: true,
          contextKey: options.contextKey,
        });
      }
    }
    easternHanPrincelySiblingPattern.lastIndex = 0;
    for (const match of text.matchAll(easternHanPrincelySiblingPattern)) {
      for (const givenName of [match[1], match[2]].map(compact)) {
        const name = `刘${givenName}`;
        if (!hasHistoricalSurname(name) || known.has(name)) continue;
        results.set(name, {
          id: provisionalOfficialHistoryPersonId(name, "eastern-han-princely-sibling"),
          name,
          matched: givenName,
          evidence: "eastern-han-princely-sibling",
          confidence: "high",
          provisional: true,
          contextKey: options.contextKey,
        });
      }
    }
    easternHanDynasticChildGrantPattern.lastIndex = 0;
    for (const match of text.matchAll(easternHanDynasticChildGrantPattern)) {
      for (const givenName of [match[1], match[2]].map(compact)) {
        if (["皇", "帝", "天子"].includes(givenName)) continue;
        const name = `刘${givenName}`;
        if (!hasHistoricalSurname(name) || known.has(name)) continue;
        results.set(name, {
          id: provisionalOfficialHistoryPersonId(name, "eastern-han-dynastic-child-grant"),
          name,
          matched: givenName,
          evidence: "eastern-han-dynastic-child-grant",
          confidence: "high",
          provisional: true,
          contextKey: options.contextKey,
        });
      }
    }
  }
  return [...results.values()];
}

export function isJinPrincelyTitlePersonOverlap(value, personMatch) {
  const text = compact(value);
  return jinTitledPeople.some((person) =>
    person.name !== personMatch.name
      && person.titles.some((title) => text.includes(title) && title.endsWith(personMatch.alias)),
  );
}

function locativeAliasPattern(alias) {
  const escaped = alias.replace(/[\\^$.*+?()[\]{}|]/gu, "\\$&");
  const provinceAbbreviations = "幽并並冀兖兗青徐扬揚荆荊益凉涼交";
  return new RegExp(
    `(?:(?:于|於|至|入|赴|攻|討|讨|伐|寇|圍|围|守|屯|據|据|都|遷|迁)${escaped}(?=$|城|三台|[，。；、${provinceAbbreviations}])|[，、${provinceAbbreviations}]${escaped}(?=(?:二州|州)))`,
    "u",
  );
}

function placeAliasIsTitleOrOrigin(text, index, alias) {
  const suffix = text.slice(index + alias.length);
  return /^(?:王|公|侯|刺史|州牧|牧|太守|内史|內史|都督|都尉|校尉|人|流人)/u.test(suffix)
    || /^(?:孝|共|恭|哀|惠|景|靖|頃|顷|康|昭|穆|怀|懷|悼|夷|厉|厲|戴|献|獻|敬|頃)?(?:王|公|侯)/u.test(suffix)
    || /^(?:[\p{Script=Han}]{0,3})?(?:太皇太后|皇太后|太后|皇后|太妃|王后|王妃|太子|世子)/u.test(suffix)
    || /^(?:为|為)[\p{Script=Han}]{0,6}(?:王|公|侯)/u.test(suffix);
}

export function findPlaceMentions(value, placeRecords) {
  const text = compact(value);
  const matches = [];
  for (const place of placeRecords) {
    const aliases = [...new Set([place.label, ...(place.aliases ?? [])])]
      .filter(Boolean)
      .sort((left, right) => right.length - left.length || left.localeCompare(right));
    for (const alias of aliases) {
      const locativeOnly = (place.locativeOnlyAliases ?? []).includes(alias) || alias.length < 2;
      let index = text.indexOf(alias);
      while (index >= 0) {
        if (
          !placeAliasIsTitleOrOrigin(text, index, alias)
          && (!locativeOnly || locativeAliasPattern(alias).test(text))
        ) {
          matches.push({ ...place, matched: alias, index, confidence: locativeOnly ? "medium" : "high" });
          break;
        }
        index = text.indexOf(alias, index + alias.length);
      }
      if (index >= 0) break;
    }
  }
  const nonOverlapping = [];
  for (const match of matches.sort(
    (left, right) => right.matched.length - left.matched.length || left.index - right.index,
  )) {
    const start = match.index;
    const end = start + match.matched.length;
    const overlapsLongerMatch = nonOverlapping.some((selected) => {
      const selectedStart = selected.index;
      const selectedEnd = selectedStart + selected.matched.length;
      return start < selectedEnd && end > selectedStart;
    });
    if (!overlapsLongerMatch) nonOverlapping.push(match);
  }
  return nonOverlapping
    .sort((left, right) => left.index - right.index || right.matched.length - left.matched.length)
    .filter((place, index, items) => items.findIndex((item) => item.id === place.id) === index);
}

export function chooseOfficialHistoryEventPlaces(title, places) {
  const titleMatches = findPlaceMentions(title, places);
  const selected = new Map(titleMatches.map((place) => [place.entityId, place]));
  for (const place of places) {
    if (place.eventRole && place.via === "card_places" && !selected.has(place.entityId)) {
      selected.set(place.entityId, place);
    }
  }
  const matches = [...selected.values()];
  const targetPlace = titleMatches.find((place) => {
    const prefix = compact(title).slice(0, place.index);
    return /(?:寇(?:钞|鈔)?|攻(?:击|擊)?|围|圍|袭|襲|取|入|屯|据|據|守|迁都|遷都|至|赴|于|於|在)$/u.test(prefix);
  });
  return {
    places: matches,
    primaryPlace: targetPlace ?? titleMatches[0] ?? (matches.length === 1 ? matches[0] : null),
  };
}
