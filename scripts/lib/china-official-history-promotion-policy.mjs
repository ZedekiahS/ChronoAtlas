import { compact, normalizeIdentityText, truncate } from "./event-promotion-core.mjs";

const explicitEventPattern =
  /起兵|举兵|興兵|兴兵|起事|出征|谋反|謀反|谋叛|反叛|叛|造逆|寇掠|寇|讨|伐|攻取|攻|取|击|擊|围|圍|破|败|敗|斩|斬|杀|殺|自尽|自盡|诛|誅|(?<![要灾災祸禍])害|降|投降|归附|歸附|归汉|歸漢|内属|內屬|来奔|來奔|请降|請降|贡献|貢獻|奉贡|奉貢|下狱|下獄|弃市|棄市|处死|處死|捕系|捕繫|禁锢|禁錮|刻石|设立|設立|设|設|增置|罢|罷|改置|停止营建|停止營建|山崩|失火|火灾|火災|撤销|撤銷|改属|改屬|改隶|改隸|调整州属|調整州屬|召开.{0,8}会议|召開.{0,8}會議|加元服|册立|冊立|修筑|修築|筑|築|大举钩党|大舉鉤黨|卖官|賣官|举孝廉|舉孝廉|置五经博士|置五經博士|置[\p{Script=Han}]{1,12}郡|[\p{Script=Han}]{1,8}之(?:战|戰|谋|謀)|(?:驾崩|駕崩|崩)(?:于|於).{1,10}$|(?:驾崩|駕崩|崩|薨|去世|卒)$|即位|自称.{0,8}太子|自稱.{0,8}太子|(?:僣|僭)(?:号|號|即|称|稱)|立(?:(?:为|為).{0,10}|.{1,10}(?:为|為))(?:帝|王|单于|單于|太子|皇太子|皇后|后)|迎.{0,10}(?:帝|王|太子)|废|廢|黜|国除|國除|称帝|稱帝|称.{0,4}王|稱.{0,4}王|称汉|稱漢|代(?:汉|漢)建新|篡|受禅|受禪|禅位|禪位|迁都|遷都|封赏|封賞|封.{0,12}(?:王|侯|公)|遣使|遣子.{0,8}入侍|来朝|來朝|请和|請和|结盟|結盟|会盟|會盟|赦|改元/u;
const highSignalCollectivePattern =
  /^(?:(?:(?:黄巾|黃巾|赤眉|关东诸侯|關東諸侯|群雄|诸侯|諸侯|郡县|郡縣|军民|軍民)|[\p{Script=Han}]{1,10}(?:蛮|蠻|羌|夷|匈奴|鲜卑|鮮卑|乌桓|烏桓)).{0,12}(?:起兵|举兵|興兵|兴兵|反叛|叛乱|叛亂|叛|投降|归附|歸附|请降|請降|降)|[\p{Script=Han}]{2,8}(?:反叛|叛乱|叛亂|叛)(?:杀|殺|害)[\p{Script=Han}]{2,12})$/u;
const commentaryPattern =
  /国学导航|國學導航|师古曰|師古曰|注曰|案曰|音曰|杜预曰|杜預曰|臣松之|松之案|《[^》]{1,30}》|疑衍|頁|页/u;
const speechOrTreatisePattern = /^(?:曰|云|雲|臣|史臣|太史公|案|注|音|赞|贊|论|論)/u;
const unresolvedObjectPattern = /(?:(?:击|擊|破|杀|殺|斩|斬|诛|誅|讨|討|伐|攻|败|敗|走|降|迎|遣|害)(?:之|其|焉|尔|爾)|(?:杀|殺|斩|斬|诛|誅)其渠(?:帅|帥))$/u;
const unresolvedCompoundObjectPattern = /(?:讨灭|討滅|讨除|討除|讨平|討平|破平)(?:之|其|焉|尔|爾)$/u;
const bareTransitiveActionPattern = /(?<!所)(?:讨|討|伐|攻|击|擊|追击|追擊|围|圍|破|斩|斬|杀|殺|诛|誅)$/u;
const unresolvedShortObjectPattern = /(?:击|擊|破|杀|殺|斩|斬|诛|誅|讨|討|伐|攻)(?!吴$|吳$|蜀$|魏$|汉$|漢$|楚$|赵$|趙$|燕$|齐$|齊$|秦$)[\p{Script=Han}]$/u;
const unresolvedOfficeObjectPattern = /(?:击|擊|杀|殺|斩|斬|诛|誅|讨|討|伐|攻|害)(?:太宰|太傅|太保|太尉|司徒|司空|大将军|大將軍|将军|將軍|刺史|太守|都尉|校尉|内史|內史)(?:等)?$/u;
const unresolvedSingleObjectGroupPattern = /(?:击|擊|杀|殺|斩|斬|诛|誅|讨|討|伐|攻|害)[\p{Script=Han}]等$/u;
const unresolvedCollectiveObjectPattern = /(?:降|归附|歸附)(?:贼|賊|众|眾|军|軍)$/u;
const collectiveContinuationPattern = /(?:皆|并|並)(?:遇害|被害|伏诛|伏誅|败|敗|死)$/u;
const weakPassiveFragmentPattern = /^[\p{Script=Han}]{2,10}(?:战败|戰敗|败绩|敗績|遇害|被害)$/u;
const weakCareerPattern =
  /^(?:[^\s，。；、]{0,8})?(?:为|為|拜为|拜為|迁|遷|转|轉|除|征|辟|举|舉|荐|薦|复为|復為|出补|出補|入为|入為|累迁|累遷|领|領|守|任|授|以为|以為).{0,18}(?:太守|刺史|郎|掾|从事|從事|参军|參軍|将军|將軍|侍中|尚书|尚書|校尉|令|相|祭酒|主簿|司马|司馬|督|都督|内史|內史|黄门|黃門|舍人)$/u;
const leadingDiscoursePattern = /^(?:初|先是|是时|是時|会|會|俄而|既而|于是|於是|乃|遂|又|及|至|其后|其後|后|後|顷之|頃之|久之|明年|是月|其年|同年|寻而|尋而|自是|自|复(?!封)|復(?!封)|旋|但|大凡|[春夏秋冬]而)[，、\s]*/u;
const actionAtStartPattern = /^(?:出[\p{Script=Han}]{1,6}(?:击|擊|讨|討|伐|攻)|出征|寇掠|寇|讨|討|伐|攻取|攻|取|击|擊|破|败|敗|斩|斬|杀|殺|诛|誅|遣|使|围|圍|降)/u;
const militaryActionAtStartPattern = /^(?:出[\p{Script=Han}]{1,6}(?:击|擊|讨|討|伐|攻)|出征|寇掠|寇|讨|討|伐|攻取|攻|取|击|擊|大破|破|败|敗|斩|斬|杀|殺|诛|誅|围|圍)/u;
const sovereigntyActionAtStartPattern = /^(?:(?:僣|僭)(?:号|號|即|称|稱)|称帝|稱帝|称.{0,4}王|稱.{0,4}王|称汉|稱漢)/u;
const consequentialSovereigntyPattern = /起兵|举兵|興兵|兴兵|反叛|叛乱|叛亂|谋叛|自立为单于|自立為單于|代(?:汉|漢)建新|篡|受禅|受禪|禅位|禪位|即位|(?:僣|僭)(?:号|號|即|称|稱)|称帝|稱帝|称.{0,4}王|稱.{0,4}王|称汉|稱漢/u;
const specificSovereigntyPattern = /(?:僣|僭)即|称帝|稱帝|称.{0,4}王|稱.{0,4}王|称汉|稱漢/u;

function stripAnnotations(value) {
  return compact(value)
    .replace(/[〔［\[][^〕］\]]*[〕］\]]/gu, "")
    .replace(/[【［\[][^】］\]]*[】］\]]/gu, "")
    .replace(/[（(][^）)]*[）)]/gu, "")
    .replace(/^[」』"'“”‘’】\s]+/u, "")
    .replace(/[」『』「"'“”‘’]+$/u, "");
}

function stripDateAndDiscourseLead(value) {
  let text = compact(value);
  for (let index = 0; index < 3; index += 1) {
    const next = text
      .replace(leadingDiscoursePattern, "")
      .replace(/^使(?=[\p{Script=Han}]{2,10}(?:讨|討|伐|攻|击|擊|围|圍|守|拒))/u, "")
      .replace(/^(?:[^\s，。；、]{2,6})?(?:元|[一二三四五六七八九十百千万〇零\d]+)年(?:春|夏|秋|冬)?(?:正月|[一二三四五六七八九十]+月)?(?:[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]+)?[，、\s]*/u, "")
      .replace(/^(?:春|夏|秋|冬)?(?:正月|[一二三四五六七八九十]+月)(?:[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]+)?[，、\s]*/u, "")
      .replace(/^[：:，。、；;]+/u, "");
    if (next === text) break;
    text = next;
  }
  return text;
}

function candidateClauses(eventLabel, factBrief, preferredNames) {
  const source = compact(eventLabel) || compact(factBrief);
  const alternate = compact(factBrief);
  const values = [source, alternate].filter(Boolean);
  const candidates = [];
  for (const value of values) {
    const cleaned = stripAnnotations(value);
    for (const sentence of cleaned.split(/[。；;！？!?]/u)) {
      const full = stripDateAndDiscourseLead(sentence);
      candidates.push(full);
      const coordinatedRoutes = full.match(
        /^((?:[\p{Script=Han}]{2,4}、){1,7}[\p{Script=Han}]{2,4})(等?[一二三四五六七八九十]+道出[擊击][^，。；]{1,10})$/u,
      );
      if (coordinatedRoutes) {
        const firstActor = coordinatedRoutes[1].split("、")[0];
        const action = coordinatedRoutes[2].startsWith("等")
          ? coordinatedRoutes[2]
          : `等${coordinatedRoutes[2]}`;
        candidates.push(`${firstActor}${action}`);
      }
      if (/、[^。；]{1,30}皆(?:下狱|下獄)死/u.test(full)) {
        const coordinatedPeople = [...preferredNames]
          .filter((name) => name?.length >= 2 && full.includes(name))
          .filter((name, _index, names) => !names.some((shorter) => shorter !== name && name.endsWith(shorter)))
          .sort((left, right) => full.indexOf(left) - full.indexOf(right));
        if (coordinatedPeople.length >= 2) candidates.push(`${coordinatedPeople[0]}等下狱死`);
      }
      if (/、[^。；]{1,30}坐事(?:下狱|下獄)死/u.test(full)) {
        const coordinatedPeople = [...preferredNames]
          .filter((name) => name?.length >= 2 && full.includes(name))
          .filter((name, _index, names) => !names.some((shorter) => shorter !== name && name.endsWith(shorter)))
          .sort((left, right) => full.indexOf(left) - full.indexOf(right));
        if (coordinatedPeople.length === 2) {
          candidates.push(`${coordinatedPeople[0]}与${coordinatedPeople[1]}下狱死`);
        }
      }
      const sharedAction = full.match(/，共((?:击|擊|讨|討|伐|攻)[^，。；]{2,18})(?=，|$)/u);
      if (sharedAction) {
        const coordinatedPeople = [...preferredNames]
          .filter((name) => name?.length >= 2 && full.indexOf(name) >= 0 && full.indexOf(name) < (sharedAction.index ?? 0))
          .sort((left, right) => full.indexOf(left) - full.indexOf(right));
        if (coordinatedPeople.length >= 2) candidates.push(`${coordinatedPeople[0]}等${sharedAction[1]}`);
      }
      let currentActor = null;
      let currentSovereigntyPlace = null;
      for (const rawClause of full.split(/[，、]/u)) {
        const actor = [...preferredNames]
          .filter((name) => name && rawClause.includes(name))
          .sort((left, right) => {
            const leftEnd = rawClause.lastIndexOf(left) + left.length;
            const rightEnd = rawClause.lastIndexOf(right) + right.length;
            return rightEnd - leftEnd || right.length - left.length;
          })[0];
        if (actor) currentActor = actor;
        const sovereigntyPlace = rawClause.match(/(?:僣|僭)(?:号|號)于([\p{Script=Han}]{1,6})$/u)?.[1];
        if (sovereigntyPlace) currentSovereigntyPlace = sovereigntyPlace;
        const clause = stripDateAndDiscourseLead(rawClause);
        const ethnicRevolt = clause.match(
          /^[\p{Script=Han}]{1,8}(?:蛮|蠻|羌|胡)([\p{Script=Han}]{2,4})等?反$/u,
        );
        if (ethnicRevolt) candidates.push(`${ethnicRevolt[1].replace(/等$/u, "")}等叛乱`);
        if (
          currentActor
          && sovereigntyActionAtStartPattern.test(clause)
          && !preferredNames.some((name) => name && clause.includes(name))
        ) {
          const placeSuffix = currentSovereigntyPlace && !/[于於]/u.test(clause)
            ? `于${currentSovereigntyPlace}`
            : "";
          candidates.push(`${currentActor}${clause}${placeSuffix}`);
        }
        if (
          currentActor
          && actionAtStartPattern.test(clause)
          && !preferredNames.some((name) => name && clause.includes(name))
        ) {
          candidates.push(`${currentActor}${clause}`);
        }
        candidates.push(clause);
      }
    }
  }
  return [...new Set(candidates.map(compact).filter(Boolean))];
}

function isEventTitleCandidate(label, factType, eventScale) {
  const length = Array.from(label).length;
  if (length < 4 || length > 24) return false;
  if (/[，、；;]/u.test(label)) return false;
  if (/其称.{0,4}王者|其稱.{0,4}王者|称邑王者|稱邑王者/u.test(label)) return false;
  if (/^(?:议|議|谋|謀)(?:击|擊|讨|討|伐|攻)/u.test(label)) return false;
  if (/^(?:其归附者|其歸附者|余众|餘眾|斩其渠帅|斬其渠帥|杀略吏民|殺略吏民)/u.test(label)) return false;
  if (militaryActionAtStartPattern.test(label)) return false;
  if (commentaryPattern.test(label) || speechOrTreatisePattern.test(label)) return false;
  if (unresolvedObjectPattern.test(label)) return false;
  if (unresolvedCompoundObjectPattern.test(label)) return false;
  if (bareTransitiveActionPattern.test(label)) return false;
  if (unresolvedShortObjectPattern.test(label)) return false;
  if (unresolvedOfficeObjectPattern.test(label) || unresolvedSingleObjectGroupPattern.test(label)) return false;
  if (unresolvedCollectiveObjectPattern.test(label)) return false;
  if (collectiveContinuationPattern.test(label) || weakPassiveFragmentPattern.test(label)) return false;
  if (/^(?:宜|可|欲|当|當|若|此|与|與|为|為)/u.test(label)) return false;
  if (!explicitEventPattern.test(label)) return false;
  if (weakCareerPattern.test(label)) {
    const consequentialAppointment = /封.{0,12}(?:王|侯|公)|拜.{0,12}(?:丞相|大将军|大將軍|太尉|司徒|司空)/u.test(label);
    if (!consequentialAppointment || eventScale === "minor") return false;
  }
  if (
    ["service", "elite_network"].includes(String(factType ?? ""))
    && eventScale !== "major"
    && !consequentialSovereigntyPattern.test(label)
  ) return false;
  return true;
}

function eventTitleCandidateScore(label, preferredNames) {
  const punitiveActionIndex = label.search(/斩|斬|杀|殺|诛|誅/u);
  const hasNamedPunitiveTarget = punitiveActionIndex >= 0 && preferredNames.some((name) => (
    name.length >= 2 && label.indexOf(name) > punitiveActionIndex
  ));
  const preferredNameCount = new Set(preferredNames.filter((name) => name?.length >= 2 && label.includes(name))).size;
  return (Array.from(label).length <= 16 ? 2 : 0)
    + (actionAtStartPattern.test(label) || sovereigntyActionAtStartPattern.test(label) ? -2 : 0)
    + (consequentialSovereigntyPattern.test(label) ? 6 : 0)
    + (specificSovereigntyPattern.test(label) ? 3 : 0)
    + (preferredNameCount ? 4 + Math.min(preferredNameCount - 1, 2) * 2 : 0)
    + (/(?:与|與)[\p{Script=Han}]{2,4}(?:下狱|下獄)死$|等(?:下狱|下獄)死$/u.test(label) ? 2 : 0)
    + (/取[\p{Script=Han}]{2,6}(?:地)?$/u.test(label) ? 1 : 0)
    + (punitiveActionIndex >= 0 && !hasNamedPunitiveTarget ? -4 : 0);
}

function highSignalOfficialHistoryTitle(eventLabel, factBrief, preferredNames) {
  const source = stripDateAndDiscourseLead(stripAnnotations(compact(eventLabel) || compact(factBrief)));
  const names = [...new Set(preferredNames)]
    .filter((name) => name?.length >= 2 && source.includes(name))
    .sort((left, right) => source.indexOf(left) - source.indexOf(right));

  const rebelAssault = source.match(/^(?:[春夏秋冬][，、])?([\p{Script=Han}]{1,8})贼起[，、]攻([\p{Script=Han}]{1,8})。?$/u);
  if (rebelAssault) return `${rebelAssault[1]}贼起兵攻${rebelAssault[2]}`;

  const princelySuicide = source.match(/^([^，。；]{2,10}王[\p{Script=Han}])被诬谋反，[^。；]{0,12}及妻子皆自杀/u);
  if (princelySuicide) return `${princelySuicide[1]}谋反冤案`;

  if (/鲜卑寇幽[、，]?并二州|鮮卑寇幽[、，]?並二州/u.test(source)) return "鲜卑寇幽并二州";

  const partyPurge = source.match(/皆为(?:钩党|鉤黨)，(?:下狱|下獄)/u);
  if (partyPurge && names.length >= 2) {
    const influenceIndex = source.search(/讽有司奏|諷有司奏/u);
    const actor = names.find((name) => source.indexOf(name) < influenceIndex);
    const target = names.find((name) => source.indexOf(name) > influenceIndex);
    if (actor && target) return `${actor}构陷${target}等党人下狱`;
  }

  const routedDefeat = source.match(/并伐([^，。；]{1,8})，[^，。；]{1,4}等大(?:败|敗)/u);
  if (routedDefeat) {
    const actionIndex = routedDefeat.index ?? source.length;
    const actors = names.filter((name) => source.indexOf(name) < actionIndex);
    if (actors.length) return `${actors[0]}等征伐${routedDefeat[1]}大败`;
  }

  const decisiveVictory = source.match(/大破([^，。；]{1,10})于([^，。；]{1,10})/u);
  if (decisiveVictory) {
    const actionIndex = decisiveVictory.index ?? source.length;
    const actors = names.filter((name) => source.indexOf(name) < actionIndex);
    if (actors.length) {
      const actorLabel = actors.length > 1 ? `${actors[0]}等` : actors[0];
      return `${actorLabel}大破${decisiveVictory[1]}于${decisiveVictory[2]}`;
    }
  }

  const condemned = source.match(/坐([^，。；]{1,12})，(?:弃市|棄市)/u);
  if (condemned) {
    const actionIndex = condemned.index ?? source.length;
    const person = names.find((name) => source.indexOf(name) < actionIndex);
    if (person) return `${person}因${condemned[1]}被处死`;
  }

  const capturedStudents = source.match(/(?:捕系|捕繫)太学诸生千余人|(?:捕系|捕繫)太學諸生千餘人/u);
  if (capturedStudents) {
    const person = names.find((name) => source.indexOf(name) < (capturedStudents.index ?? source.length));
    if (person) return `${person}捕系太学诸生千余人`;
  }

  if (/诏诸儒正《?五经》?文字，刻石立于太学门外|詔諸儒正《?五經》?文字，刻石立於太學門外/u.test(source)) {
    return "诏正五经文字并刻石于太学";
  }
  if (/(?:始置鸿都门学生|始置鴻都門學生)/u.test(source)) return "设立鸿都门学";
  if (/(?:初开|初開)西邸(?:卖官|賣官)/u.test(source)) return "西邸开始卖官";
  if (/(?:州郡大举钩党|州郡大舉鉤黨)/u.test(source)) return "州郡大举钩党";
  if (/诏党人门生故吏父兄子弟在位者，皆免官禁锢|詔黨人門生故吏父兄子弟在位者，皆免官禁錮/u.test(source)) {
    return "党人亲属被免官禁锢";
  }
  return null;
}

export function normalizeOfficialHistoryEventTitle(eventLabel, factBrief, factType, eventScale, preferredNames = []) {
  if (/^[^，。；]{1,8}帝即位，[^。；]{0,24}(?:明年|(?:元|[一二三四五六七八九十]+)年)/u.test(stripAnnotations(factBrief))) {
    return null;
  }
  const directPardonTitle = compact(eventLabel).match(/^(?:大)?赦天下(?:系囚)?$/u)?.[0];
  if (directPardonTitle) return directPardonTitle;
  const highSignalTitle = highSignalOfficialHistoryTitle(eventLabel, factBrief, preferredNames);
  if (highSignalTitle && isEventTitleCandidate(highSignalTitle, factType, eventScale)) return highSignalTitle;
  const candidates = candidateClauses(eventLabel, factBrief, preferredNames)
    .filter((candidate) => isEventTitleCandidate(candidate, factType, eventScale))
    .sort((left, right) => {
      const leftScore = eventTitleCandidateScore(left, preferredNames);
      const rightScore = eventTitleCandidateScore(right, preferredNames);
      return rightScore - leftScore || Array.from(left).length - Array.from(right).length;
    });
  if (!candidates[0]) return null;
  let title = candidates[0]
    .replace(/^[\p{Script=Han}]{2,4}部(?:大)?(?:將軍|将军)(?=[\p{Script=Han}]{2,4}(?:等|攻|討|讨|伐|擊|击|圍|围|守|破|降))/u, "")
    .replace(/於/gu, "于")
    .replace(/擊/gu, "击")
    .replace(/敗/gu, "败")
    .replace(/殺/gu, "杀")
    .replace(/誅/gu, "诛")
    .replace(/稱/gu, "称")
    .replace(/廢/gu, "废")
    .replace(/為/gu, "为")
    .replace(/又为/gu, "为")
    .replace(/(?:僣|僭)即皇帝位/gu, "称帝")
    .replace(/(?:僣|僭)即([\p{Script=Han}]{1,4}王)位/gu, "称$1")
    .replace(/(?:僣|僭)称/gu, "称")
    .replace(/(?:僣|僭)(?:号|號)(?:为)?/gu, "称")
    .replace(/又遣/gu, "遣")
    .replace(/^(赦天下(?:系囚)?).+$/u, "$1")
    .replace(/^([\p{Script=Han}]{1,4})为([\p{Script=Han}]{2,4})所(破|败|杀|诛|害)$/u, "$2$3$1")
    .replace(/([\p{Script=Han}]{2,4})以[\p{Script=Han}]{0,8}(?:元|[一二三四五六七八九十廿卅〇零\d]{1,4})年/gu, "$1");
  title = stripOfficePrefixesForNames(title, preferredNames);
  title = title.replace(/^([\p{Script=Han}]{2,4})率[一二三四五六七八九十]+郡太守(?=讨|討)/u, "$1");
  title = title.replace(/^([\p{Script=Han}]{1,4})为([\p{Script=Han}]{2,4})所(破|败|杀|诛|害)$/u, "$2$3$1");
  title = stripOriginPrefixesForNames(title, preferredNames);
  title = title.replace(
    /^([\p{Script=Han}]{1,10}(?:羌|蛮|蠻|夷|匈奴|鲜卑|鮮卑|乌桓|烏桓))叛$/u,
    "$1叛乱",
  );
  title = title.replace(
    /^[\p{Script=Han}]{1,8}(?:蛮|蠻|羌|胡)([\p{Script=Han}]{2,4})等?反$/u,
    "$1等叛乱",
  );
  title = title.replace(
    /^([\p{Script=Han}]{1,8}(?:蛮夷|蠻夷|蛮|蠻|羌|夷))[一二三四五六七八九十百千万余餘]+人(?=寇)/u,
    "$1",
  );
  title = title.replace(/(取[\p{Script=Han}]{2,6})地$/u, "$1");
  const regionalRevolt = stripAnnotations(factBrief).match(
    /(?:^|，)([\p{Script=Han}]{1,6})、([\p{Script=Han}]{1,6})(?:蛮|蠻|羌|胡)([\p{Script=Han}]{2,4})等?反/u,
  );
  const revoltLeader = regionalRevolt?.[3].replace(/等$/u, "");
  if (regionalRevolt && title === `${revoltLeader}等叛乱`) {
    title = `${revoltLeader}等在${regionalRevolt[1]}${regionalRevolt[2]}叛乱`;
  }
  const compactRegionalRevolt = title.match(
    /^([\p{Script=Han}]{2})([\p{Script=Han}]{2})(?:蛮|蠻|羌|胡)([\p{Script=Han}]{2,4})等反叛$/u,
  );
  if (compactRegionalRevolt) {
    title = `${compactRegionalRevolt[3]}等在${compactRegionalRevolt[1]}${compactRegionalRevolt[2]}叛乱`;
  }
  const regionalIncursion = stripAnnotations(factBrief).match(
    /(?:^|，)([\p{Script=Han}]{1,6})、([\p{Script=Han}]{1,6})((?:蛮夷|蠻夷|蛮|蠻|羌|夷)[一二三四五六七八九十百千万余餘]*人?寇(?:掠)?[\p{Script=Han}]{1,8})/u,
  );
  if (regionalIncursion && title === `${regionalIncursion[2]}${regionalIncursion[3]}`.replace(
    /((?:蛮夷|蠻夷|蛮|蠻|羌|夷))[一二三四五六七八九十百千万余餘]+人(?=寇)/u,
    "$1",
  )) {
    title = `${regionalIncursion[1]}${title}`;
  }
  if (/遣使译献犀牛$/u.test(title) && /犀牛、大象/u.test(factBrief)) {
    title = title.replace(/遣使译献犀牛$/u, "遣使献犀牛大象");
  }
  title = title.replace(
    /^([\p{Script=Han}]{2,8}?)(?:首先)?(?:反叛|叛乱|叛亂)(?:并|並)?杀(?:西域)?(?:都护|都護)?([\p{Script=Han}]{2,4})$/u,
    "$1叛杀$2",
  );
  for (const name of [...new Set(preferredNames)].filter((item) => item?.length >= 2).sort((left, right) => right.length - left.length)) {
    const punishment = stripAnnotations(factBrief).match(
      new RegExp(`${escapeRegExp(name)}坐([^，。；]{1,10})，(?:下狱|下獄)死`, "u"),
    );
    if (punishment && title.includes(name) && title.includes(punishment[1])) {
      title = `${name}因${punishment[1]}下狱死`;
      break;
    }
  }
  title = title.replace(/^(?![\p{Script=Han}]*被)([\p{Script=Han}]{2,6})废$/u, "$1被废");
  title = title.replace(/^([\p{Script=Han}]{2,4})奏诛([\p{Script=Han}]{2,4})及子.+$/u, "$1奏诛$2等");
  if (Array.from(title).length > 18 || !isEventTitleCandidate(title, factType, eventScale)) return null;
  return title;
}

function stripOfficePrefixesForNames(value, preferredNames) {
  let title = value;
  const office = "(?:北匈奴(?:左|右)?谷蠡王|西域假司马|西域假司馬|假司马|假司馬|司隶校尉|司隸校尉|大司马|大司馬|大将军|大將軍|骠骑将军|驃騎將軍|车骑将军|車騎將軍|中郎将|中郎將|别将|別將|将军|將軍|将|將|刺史|太守|内史|內史|都护|都護|都尉|校尉|太傅|太保|太尉|司徒|司空|流人)";
  for (const name of [...new Set(preferredNames)].filter((item) => item?.length >= 2).sort((left, right) => right.length - left.length)) {
    const pattern = new RegExp(`(^|[与與及攻击擊杀殺害讨討伐诛誅斩斬破敗败圍围遣使执執])(?:[\\p{Script=Han}]{1,4})?${office}(?=${escapeRegExp(name)})`, "gu");
    title = title.replace(pattern, (_, lead) => lead);
  }
  return title;
}

function stripOriginPrefixesForNames(value, preferredNames) {
  let title = value;
  for (const name of [...new Set(preferredNames)].filter((item) => item?.length >= 2).sort((left, right) => right.length - left.length)) {
    const pattern = new RegExp(`^[\\p{Script=Han}]{1,4}(?:人|流人)(?=${escapeRegExp(name)})`, "u");
    title = title.replace(pattern, "");
  }
  return title;
}

export function cleanOfficialHistorySummary(value, fallbackTitle) {
  let text = stripAnnotations(value);
  const narrative = stripDateAndDiscourseLead(text);
  if (/^立(?:为|為)(?:皇后|后|太子|皇太子|帝|皇帝|王|单于|單于)[。！!？?]?$/u.test(narrative)) {
    const resolved = compact(fallbackTitle);
    return resolved.endsWith("。") ? resolved : `${resolved}。`;
  }
  text = text.replace(/^[」』"'“”‘’】\s]+/u, "");
  const speechLead = text.match(/(?:^|[，。；])[^，。；]{0,20}(?:书曰|書曰|上疏曰|上書曰|曰：|曰:|云：|雲：)/u);
  if (speechLead?.index >= 8) text = text.slice(0, speechLead.index);
  const firstSentence = text.split(/[。；;]/u).map(compact).find((item) => item.length >= 6) ?? fallbackTitle;
  const summary = truncate(firstSentence || fallbackTitle, 100).replace(/[，、：:]$/u, "");
  return summary.endsWith("。") ? summary : `${summary}。`;
}

export function eventTypeForOfficialHistory(factType, title = "") {
  if (/起兵|举兵|興兵|兴兵|出征|谋叛|反叛|叛|寇|讨|討|伐|攻|取|击|擊|围|圍|破|败|敗|斩|斬|杀|殺|诛|誅|战|戰|陷|降/u.test(title)) {
    return "war";
  }
  if (/遣使|来朝|來朝|请和|請和|结盟|結盟|会盟|會盟/u.test(title)) return "diplomacy";
  if (["military", "campaign", "war", "rebellion"].includes(String(factType ?? ""))) return "war";
  if (["diplomacy", "frontier"].includes(String(factType ?? ""))) return "diplomacy";
  if (["culture", "economy", "religion", "society"].includes(String(factType ?? ""))) return factType;
  return "politics";
}

export function topicIdForOfficialHistoryEvent(eventType) {
  return eventType === "war" ? "military" : "political_structure";
}

export function titleHasParticipant(title, people) {
  return people.some((person) => person.name && title.includes(person.name));
}

export function canonicalizeOfficialHistoryTitlePersonAliases(
  title,
  people,
  scopedProvisionalPersonEvidence = [],
) {
  const scopedEvidence = new Set(scopedProvisionalPersonEvidence);
  let normalized = compact(title);
  const canonicalNames = [...new Set(people.map((person) => compact(person.name)).filter(Boolean))]
    .sort((left, right) => right.length - left.length);
  const protectedNames = new Map(canonicalNames.map((name, index) => [name, `\u0000${index}\u0000`]));
  for (const [name, placeholder] of protectedNames) {
    normalized = normalized.split(name).join(placeholder);
  }
  for (const person of people) {
    const canonicalName = compact(person.name);
    const placeholder = protectedNames.get(canonicalName);
    if (!placeholder) continue;
    const aliases = [...(person.names ?? [])]
      .map(compact)
      .filter((name) => (
        Array.from(name).length >= 2
        && name !== canonicalName
        && (!/[王后帝公侯太子庶人]/u.test(name) || scopedEvidence.has(person.via))
      ))
      .sort((left, right) => right.length - left.length);
    for (const alias of aliases) {
      normalized = normalized.replace(new RegExp(escapeRegExp(alias), "gu"), (matched, offset, value) => {
        const before = value.slice(0, offset);
        const after = value.slice(offset + matched.length);
        const isInstallationName = /(?:立|迎立)$/u.test(before)
          && /^(?:为|為)(?:帝|皇帝|王|单于|單于|太子|皇太子|皇后|后)/u.test(after);
        const demiseRank = alias.match(/^([\p{Script=Han}]{1,8}(?:王|侯|公|帝))[\p{Script=Han}]{1,3}$/u);
        if (demiseRank && /(?:驾崩|駕崩|崩|薨|去世|卒)$/u.test(normalized)) {
          return `${demiseRank[1]}${canonicalName}`;
        }
        return isInstallationName ? matched : placeholder;
      });
    }
  }
  for (const [name, placeholder] of protectedNames) {
    normalized = normalized.split(placeholder).join(name);
  }
  return normalized;
}

export function titleHasNamedActor(title, people) {
  const actionIndex = title.search(/起兵|举兵|興兵|兴兵|起事|出征|谋反|謀反|谋叛|反叛|叛|寇|构陷|構陷|捕系|捕繫|处死|處死|讨|討|伐|攻|取|击|擊|围|圍|破|败|敗|斩|斬|杀|殺|诛|誅|下狱死|下獄死|驾崩|駕崩|崩|薨|去世|卒|(?<!要)害|投降|请降|請降|归汉|歸漢|降|即位|自称|自稱|(?:僣|僭)(?:号|號|即)|册立|冊立|立|迎|废|廢|黜|国除|國除|称帝|稱帝|称.{0,4}王|稱.{0,4}王|称汉|稱漢|代(?:汉|漢)建新|篡|受禅|受禪|禅位|禪位|迁都|遷都|任命|改任|任|撤销|撤銷|改属|改屬|改隶|改隸|召开|召開|加元服|设|設|失火|火灾|火災|封赏|封賞|封|遣使|遣|使|来朝|來朝|请和|請和|结盟|結盟|会盟|會盟|赦|改元/u);
  if (actionIndex <= 0) return false;
  return people.some((person) =>
    [...(person.names ?? [person.name])]
      .filter((name) => name?.length >= 2)
      .some((name) => {
        const index = title.indexOf(name);
        return index >= 0 && index < actionIndex;
      }));
}

export function titleHasNamedGrantRecipient(title, people) {
  const action = title.match(/(?:复封|復封|绍封|紹封|封|拜|立)/u);
  if (!action) return false;
  const actionEnd = (action.index ?? 0) + action[0].length;
  return people.some((person) =>
    [...(person.names ?? [person.name])]
      .filter((name) => name?.length >= 2)
      .some((name) => title.indexOf(name) >= actionEnd));
}

export function canonicalizeOfficialHistoryGrantTitle(title, people) {
  const workingTitle = title.replace(/^绍(?=刘[\p{Script=Han}]{1,3}(?:为|為).+王$)/u, "绍封");
  const rank = workingTitle.match(/(?:为|為)([\p{Script=Han}]{1,8}(?:王|侯|公))$/u);
  const action = [...workingTitle.matchAll(/复封|復封|绍封|紹封|封/gu)].at(-1);
  if (!rank || !action) return title;
  const rankIndex = rank.index ?? workingTitle.length;
  const actionEnd = (action.index ?? 0) + action[0].length;
  const relationshipRecipient = workingTitle.slice(actionEnd, rankIndex).match(
    /(?:庶?子|兄)(?:[\p{Script=Han}]{1,6}侯)?(刘?[\p{Script=Han}]{1,3})$/u,
  )?.[1];
  const relatedPerson = relationshipRecipient
    ? people.find((person) => person.name === relationshipRecipient || person.name === `刘${relationshipRecipient}`)
    : null;
  if (relatedPerson) {
    const normalizedAction = /绍|紹/u.test(action[0]) ? "绍封" : /复|復/u.test(action[0]) ? "复封" : "封";
    return `${normalizedAction}${relatedPerson.name}为${rank[1]}`;
  }
  const recipients = people.flatMap((person) => [...(person.names ?? [person.name])]
    .map((name) => ({ person, name, index: workingTitle.lastIndexOf(name, rankIndex) }))
    .filter((item) => item.name && item.index >= actionEnd && item.index < rankIndex));
  const recipient = recipients.sort((left, right) => right.index - left.index || right.name.length - left.name.length)[0];
  if (!recipient) return workingTitle;
  const normalizedAction = /绍|紹/u.test(action[0]) ? "绍封" : /复|復/u.test(action[0]) ? "复封" : "封";
  return `${normalizedAction}${recipient.person.name}为${rank[1]}`;
}

export function isOfficialHistoryCommentaryText(value) {
  const text = compact(value);
  if (
    /^(?:[」』】\s]*)?(?:《[^》]{1,30}》|本注|注文|注|案|音义|音義|师古|師古|李贤|李賢|臣松之|松之)(?:曰|云|雲)/u.test(text)
    || /(?:，|；)(?:《[^》]{1,30}》|本注|注文|注|案|音义|音義|师古|師古|李贤|李賢)(?:曰|云|雲)/u.test(text)
  ) return true;
  const speech = text.match(/^[」』】\s]*[【〔]?[^\n。；]{0,32}(?:曰[：:]?|(?:云|雲)[：:])/u);
  if (!speech) return false;
  const markerIndex = speech[0].search(/曰|云|雲/u);
  return markerIndex < 0 || !explicitEventPattern.test(speech[0].slice(0, markerIndex));
}

function escapeRegExp(value) {
  return value.replace(/[\^$.*+?()[\]{}|]/gu, "\\$&");
}

export function officialHistoryRoleAuditReasons(title, sourceText, people) {
  const reasons = [];
  const consequentialGrant = title.match(/(?:复封|復封|绍封|紹封|封|拜)(.{1,12}?)(?:为|為)?(?:王|侯|公)/u);
  if (consequentialGrant) {
    const actionIndex = consequentialGrant.index ?? title.search(/复封|復封|绍封|紹封|封|拜/u);
    const actionEnd = actionIndex + title.slice(actionIndex).search(/封|拜/u) + 1;
    const hasNamedRecipient = people.some((person) =>
      [...(person.names ?? [person.name])]
        .filter((name) => name?.length >= 2)
        .some((name) => title.indexOf(name) >= actionEnd));
    const hasNamedPassiveRecipient = people.some((person) =>
      [...(person.names ?? [person.name])]
        .filter((name) => name?.length >= 2)
        .some((name) => {
          const nameIndex = title.indexOf(name);
          if (nameIndex < 0 || nameIndex + name.length > actionIndex) return false;
          return /受(?:封|号|號)$/u.test(title.slice(nameIndex + name.length, actionEnd));
        }));
    if (!hasNamedRecipient && !hasNamedPassiveRecipient) reasons.push("unresolved-grant-recipient");
  }
  const surrenderIndex = title.search(/请降|請降|降/u);
  if (surrenderIndex > 0) {
    const source = compact(sourceText);
    const approachIndex = source.search(/于|於|向|诣|詣/u);
    const hasNamedSurrenderer = approachIndex > 0 && people.some((person) =>
      [...(person.names ?? [person.name])]
        .filter((name) => name?.length >= 2)
        .some((name) => {
          const index = source.indexOf(name);
          return index >= 0 && index < approachIndex;
        }));
    if (hasNamedSurrenderer) return reasons;
    const hasExplicitNamedRecipient = people.some((person) =>
      [...(person.names ?? [person.name])]
        .filter((name) => name?.length >= 2)
        .some((name) => new RegExp(`向${escapeRegExp(name)}(?:请降|請降|投降|降)$`, "u").test(title)));
    if (hasExplicitNamedRecipient) return reasons;
    const namedActor = people
      .flatMap((person) => [...(person.names ?? [person.name])])
      .filter((name) => {
        const index = title.indexOf(name);
        return name?.length >= 2 && index >= 0 && index + name.length <= surrenderIndex;
      })
      .sort((left, right) => right.length - left.length)[0];
    if (namedActor) {
      const recipientPattern = new RegExp("(?:于|於|向|诣|詣)[^。；]{0,24}" + escapeRegExp(namedActor) + "(?:请降|請降|降)", "u");
      if (recipientPattern.test(source)) reasons.push("surrender-recipient-as-actor");
    }
  }
  if (/(?:追)?(?:讨|討)之，(?:斩|斬|杀|殺|诛|誅)/u.test(compact(sourceText))) {
    const actionIndex = title.search(/斩|斬|杀|殺|诛|誅/u);
    const titleActors = people.filter((person) => [...(person.names ?? [person.name])].some((name) => (
      name?.length >= 2 && title.indexOf(name) >= 0 && title.indexOf(name) < actionIndex
    )));
    const sourceLead = compact(sourceText).split(/(?:追)?(?:讨|討)之/u)[0];
    const sourceActors = people.filter((person) => [...(person.names ?? [person.name])].some((name) => (
      name?.length >= 2 && sourceLead.includes(name)
    )));
    if (actionIndex > 0 && sourceActors.length > titleActors.length) reasons.push("partial-coordinated-actor");
  }
  return reasons;
}

export function canPromoteWithoutNamedParticipant(title) {
  return highSignalCollectivePattern.test(title);
}

export function normalizedOfficialHistoryIdentity(title) {
  return normalizeIdentityText(title)
    .replace(/[於于]/gu, "于")
    .replace(/[擊击]/gu, "击")
    .replace(/[敗败]/gu, "败")
    .replace(/[殺杀]/gu, "杀")
    .replace(/[誅诛]/gu, "诛")
    .replace(/[稱称]/gu, "称")
    .replace(/[廢废]/gu, "废")
    .replace(/[為为]/gu, "为");
}

export function officialHistoryTitleAuditReasons(title) {
  const reasons = [];
  if (!title || Array.from(title).length < 4) reasons.push("too-short");
  if (commentaryPattern.test(title)) reasons.push("commentary");
  const hasUnresolvedObject = unresolvedObjectPattern.test(title);
  if (hasUnresolvedObject) reasons.push("unresolved-object");
  if (unresolvedCompoundObjectPattern.test(title)) reasons.push("unresolved-compound-object");
  if (bareTransitiveActionPattern.test(title)) reasons.push("missing-object");
  if (!hasUnresolvedObject && unresolvedShortObjectPattern.test(title)) reasons.push("unresolved-short-object");
  if (unresolvedOfficeObjectPattern.test(title)) reasons.push("unresolved-office-object");
  if (unresolvedSingleObjectGroupPattern.test(title)) reasons.push("unresolved-single-object-group");
  if (Array.from(title ?? "").length > 20) reasons.push("too-long");
  if (/^(?:宜|可|欲|寻而|尋而|但|共|自是)/u.test(title)) reasons.push("prose-fragment");
  if (militaryActionAtStartPattern.test(title)) reasons.push("missing-actor");
  if (/[，。；、！？]/u.test(title)) reasons.push("punctuation");
  return reasons;
}
