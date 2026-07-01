import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
const batchId = "manual-event-details-china-sasanian-remaining-190-310";

const details = [
  {
    id: "china-190-coalition-against-dong-zhuo",
    detail: {
      overview:
        "190 年关东诸军以讨伐董卓为名起兵，标志着州郡军事力量公开进入全国政治舞台。联盟未能形成稳定中央替代者，却让东汉朝廷失去对地方军政集团的实际约束。",
      background: [
        "董卓入洛阳后废少帝、立献帝，直接以凉州军控制朝廷，引发关东士族和地方军政势力反弹。",
        "黄巾起义以来州郡军事化已经扩大，地方长官和豪强拥有调兵、募兵、结盟的现实条件。",
        "袁绍、袁术、曹操等人虽同称讨董，但各自有地域基础和政治诉求，联盟从一开始就缺乏统一指挥。"
      ],
      process: [
        "关东诸军推袁绍为盟主，分别在酸枣、河内、南阳等地集结，以讨伐董卓为共同名义。",
        "曹操等少数力量尝试主动进兵，但联盟主力多观望不前，内部协调能力有限。",
        "董卓最终迁都长安，焚毁洛阳，关东军没有完成恢复朝廷秩序的目标。"
      ],
      result: [
        "董卓集团退入关中，献帝朝廷仍在军阀挟持之下。",
        "关东联盟迅速松散，各路诸侯从讨董转向争夺地盘和人口。",
        "曹操、袁绍、袁术等人的独立政治军事路线开始清晰化。"
      ],
      impact: [
        "此事件把东汉末年从宫廷政变推向州郡军阀公开割据阶段。",
        "联盟失败说明旧朝廷名义仍有号召力，但已不足以重建统一秩序。",
        "袁绍、袁术、曹操后续竞争的起点都可以追溯到这次讨董联盟。"
      ],
      sourceNotes: [
        "《后汉书·董卓列传》提供董卓入洛、迁都和关东军反应的核心叙述。",
        "《三国志·魏书·武帝纪》从曹操早期行动角度补充讨董过程。",
        "《资治通鉴》卷五十九适合串联初平元年前后的联盟、迁都和地方分化。"
      ],
      uncertainty: [
        "关东诸军具体兵力和各营驻地在史书中不宜精确量化。",
        "联盟失败不能简单归因于某一人怯战，更应看作地方利益和指挥结构失效。"
      ]
    }
  },
  {
    id: "china-192-dong-zhuo-killed",
    detail: {
      overview:
        "192 年王允、吕布诛杀董卓，但这不是朝廷秩序恢复，而是董卓旧部反扑和长安再度失控的开端。献帝朝廷继续成为军阀争夺合法性的核心资源。",
      background: [
        "董卓迁都长安后继续以暴力和亲信控制朝廷，关东讨董联盟未能直接解除献帝困局。",
        "王允等朝臣试图借宫廷内部力量除去董卓，吕布则因个人处境和董卓关系恶化成为关键执行者。",
        "董卓军政集团并非只依赖董卓本人，李傕、郭汜等凉州旧部仍掌握军事力量。"
      ],
      process: [
        "王允与吕布合谋，在董卓入宫过程中将其刺杀。",
        "董卓死后，王允未能妥善安置或整合董卓旧部，关中军事集团迅速反弹。",
        "李傕、郭汜等攻入长安，王允被杀，吕布逃离，献帝朝廷再次被军事集团控制。"
      ],
      result: [
        "董卓本人被除去，但董卓集团遗留的军事化政治并未结束。",
        "吕布从宫廷政变参与者转为流亡军人，之后进入兖州、徐州争夺。",
        "献帝朝廷继续失去独立行动能力，为 196 年曹操迎帝至许埋下背景。"
      ],
      impact: [
        "此事件说明东汉末年的危机已经不只是权臣个人问题，而是军队、地方和朝廷结构失衡。",
        "王允失败后，朝廷内部士人无法单独恢复秩序，地方军阀成为实际政治主角。",
        "长安动荡推动献帝后来东归，并最终被曹操接入许都政治体系。"
      ],
      sourceNotes: [
        "《后汉书·董卓列传》是董卓被杀和旧部反扑的主干材料。",
        "《三国志·魏书·吕布传》可补吕布参与诛董及后续流亡线索。",
        "《资治通鉴》卷六十对王允处置失当和李傕、郭汜攻长安有连续叙述。"
      ],
      uncertainty: [
        "吕布参与诛董的动机包含个人怨隙、政治机会和王允策动，不能单线解释。",
        "王允拒绝赦免旧部的细节带有后世评价色彩，需与政治结果分开看。"
      ]
    }
  },
  {
    id: "china-196-cao-cao-escorts-emperor",
    detail: {
      overview:
        "196 年曹操迎汉献帝至许，把流亡朝廷转化为自己的政治合法性资源。此后曹操能够以汉廷名义发布诏令，形成相对其他诸侯的制度优势。",
      background: [
        "董卓死后，献帝长期处在李傕、郭汜等军阀挟持和长安动荡中，朝廷名义仍在但实际权力极弱。",
        "曹操在兖州危机后重新稳住根据地，需要更高层级的政治合法性来压过地方诸侯竞争。",
        "荀彧、董昭等人推动迎奉天子，说明曹操集团已开始把朝廷作为长期战略资源。"
      ],
      process: [
        "献帝东归途中处境艰难，曹操迎接并护送其进入许。",
        "许成为新的朝廷所在，曹操以汉廷名义处理封拜、诏令和诸侯关系。",
        "曹操集团逐步把地方军事基础、朝廷名义和官僚制度结合起来。"
      ],
      result: [
        "献帝从长安军阀控制转入曹操集团控制，东汉朝廷形式上延续。",
        "曹操获得“奉天子”政治优势，对袁绍、袁术、刘备等势力形成合法性压力。",
        "许都体系成为曹魏政权形成前的制度基础。"
      ],
      impact: [
        "此事件是曹操从地方军阀转向全国政治中心的关键转折。",
        "“挟天子以令诸侯”并不只是口号，而是诏令、官爵和名义秩序的实际工具。",
        "220 年曹丕代汉的制度路径，建立在 196 年以后曹操长期掌控汉廷的基础上。"
      ],
      sourceNotes: [
        "《三国志·魏书·武帝纪》记录建安元年曹操迎帝至许的政治节点。",
        "《后汉书·孝献帝纪》提供献帝朝廷角度的纪年框架。",
        "《资治通鉴》卷六十二适合连接献帝东归、许都建立和曹操战略选择。"
      ],
      uncertainty: [
        "“挟天子以令诸侯”是后世概括，实际过程包含保护朝廷、控制朝廷和利用朝廷多重面向。",
        "荀彧、董昭等人具体建议的先后和分工，在不同叙述中需要谨慎处理。"
      ]
    }
  },
  {
    id: "china-207-longzhong-plan",
    detail: {
      overview:
        "207 年刘备延揽诸葛亮，隆中对为刘备集团提出据荆益、联孙抗曹、等待天下变化的战略框架。它的重要性在于把刘备早期流动状态转化为可执行的区域战略。",
      background: [
        "刘备在徐州、汝南等地多次受挫，依附刘表后暂居荆州，缺乏稳定独立根据地。",
        "曹操已控制北方和汉廷，孙权占据江东，刘备若继续流动作战难以长期生存。",
        "荆州、益州地理条件和政治格局为第三方势力提供了可能空间。"
      ],
      process: [
        "刘备三顾诸葛亮，诸葛亮分析曹操、孙权、荆州、益州和天下形势。",
        "诸葛亮提出先据荆州、益州，外结孙权，内修政理，再等待北方变化的方案。",
        "这一战略没有立即实现，但成为刘备集团后续赤壁、入蜀和蜀汉建国的路线参照。"
      ],
      result: [
        "诸葛亮进入刘备集团核心，刘备获得系统战略设计。",
        "刘备集团从依附刘表的客军，逐渐转向争取荆州和益州的长期计划。",
        "隆中对成为蜀汉政治叙事中解释其合法路线的重要文本。"
      ],
      impact: [
        "隆中对把三国格局的可能性提前概念化：曹操不可骤争，孙权可为援而不可图，荆益为根基。",
        "它连接 208 年赤壁、214 年入蜀、221 年称帝和诸葛亮北伐等后续主线。",
        "即使后续荆州丢失使原方案受挫，隆中对仍是理解蜀汉战略自我定位的核心材料。"
      ],
      sourceNotes: [
        "《三国志·蜀书·诸葛亮传》保存隆中对文本，是此事件核心史料。",
        "《三国志·蜀书·先主传》可补刘备当时依附荆州和延揽人才的背景。",
        "隆中对文本兼具战略分析和蜀汉后期政治记忆，适合放在史料证据面板重点展示。"
      ],
      uncertainty: [
        "隆中对现存文本可能经过陈寿和蜀汉政治记忆整理，不能完全等同现场逐字记录。",
        "后人常以结果倒推其预见性，实际应视为当时条件下的战略框架。"
      ]
    }
  },
  {
    id: "china-220-cao-pi-founds-wei",
    detail: {
      overview:
        "220 年曹丕接受汉献帝禅让，建立曹魏，东汉正式结束。它把曹操长期控制汉廷的事实转化为新王朝制度，三国从割据局面进入正式政权并立阶段。",
      background: [
        "196 年曹操迎献帝至许后，曹氏长期掌握汉廷军事、财政和任官方面实权。",
        "曹操去世后，曹丕继承魏王和丞相地位，需要把继承权、朝廷控制和新政权合法性整合起来。",
        "东汉名义虽仍存在，但中央权力已被曹氏政权结构吸收。"
      ],
      process: [
        "汉献帝以禅让形式移交皇位，曹丕受玺绶即皇帝位。",
        "曹魏沿用并改造汉末制度，设置新年号和国家礼仪，完成从魏王国到帝国的转化。",
        "魏廷通过禅让文本和群臣劝进叙事，把改朝换代包装为天命转移。"
      ],
      result: [
        "东汉灭亡，曹魏建立，洛阳成为曹魏政治中心。",
        "汉献帝退为山阳公，东汉皇帝不再拥有国家统治名义。",
        "刘备、孙权随后分别以不同方式回应曹魏称帝，三国并立制度化。"
      ],
      impact: [
        "曹丕称帝是三国正式政治格局形成的第一步。",
        "禅让模式成为后续司马炎代魏的重要制度范本。",
        "它也使蜀汉“继汉”叙事和孙吴独立称帝的政治压力同时上升。"
      ],
      sourceNotes: [
        "《三国志·魏书·文帝纪》保存曹丕受禅和建国的魏方纪年。",
        "《后汉书·孝献帝纪》从东汉终结角度记录禅让。",
        "《资治通鉴》卷六十九可对比禅让程序和政治语境。"
      ],
      uncertainty: [
        "禅让文本中的自愿与天命语言属于政治合法化话语，不应按字面理解为自由选择。",
        "曹魏建国的实际基础是长期军事和制度控制，而不是 220 年单次仪式。"
      ]
    }
  },
  {
    id: "china-221-liu-bei-founds-shu",
    detail: {
      overview:
        "221 年刘备在成都称帝，建立蜀汉，以继承汉室回应曹魏代汉。蜀汉建国把刘备集团从益州割据政权转化为以汉统为名的皇帝政权。",
      background: [
        "曹丕代汉后，刘备集团必须回应东汉灭亡带来的合法性断裂。",
        "刘备占据益州，并曾取得汉中王称号，已经具备相对完整的政权基础。",
        "关羽失荆州后，刘备集团战略空间收缩，更需要通过称帝凝聚内部和对外名义。"
      ],
      process: [
        "刘备在成都即皇帝位，改元章武，设置百官和宗庙。",
        "诸葛亮任丞相，成为蜀汉政权制度建设的核心人物。",
        "蜀汉以“汉”作为国号和政治名义，强调自身继承刘氏汉统。"
      ],
      result: [
        "蜀汉正式建立，魏蜀对立从政权事实上升为皇帝名义对立。",
        "刘备集团完成从军阀集团、益州政权到帝国名义政权的转化。",
        "称帝后不久，刘备发动伐吴，夷陵之战成为新政权早期重大挫折。"
      ],
      impact: [
        "蜀汉称帝使三国格局不再只是曹魏与地方势力关系，而是多个皇帝政权并存。",
        "“继汉”叙事成为蜀汉长期政治合法性的核心，也影响后世对三国正统的评价。",
        "章武政权的短期军事选择直接导向 222 年夷陵之战。"
      ],
      sourceNotes: [
        "《三国志·蜀书·先主传》记录刘备称帝、改元、置百官和任命诸葛亮。",
        "《资治通鉴》卷六十九提供称帝日期和政治流程。",
        "相关原文适合与曹丕 220 年受禅记录并列展示。"
      ],
      uncertainty: [
        "蜀汉自称继承汉室是政治立场，不等于各方共同承认其正统。",
        "称帝与伐吴之间的政治关系需谨慎处理，不能简单说称帝必然导致夷陵。"
      ]
    }
  },
  {
    id: "china-229-sun-quan-emperor",
    detail: {
      overview:
        "229 年孙权称帝，孙吴正式以皇帝政权身份出现。至此魏、蜀、吴三方都完成帝号建构，三国鼎立的制度形态最终成型。",
      background: [
        "孙权长期控制江东，并在赤壁后逐步扩展到荆州、交州等方向，具备独立政权基础。",
        "曹魏和蜀汉已先后称帝，孙权若继续只称王，政治名义上处于不对等位置。",
        "吴蜀联盟与魏吴对抗反复变化，孙权需要在外交和内部合法性之间取得平衡。"
      ],
      process: [
        "孙权称帝，国号吴，改元黄龙。",
        "孙吴随后迁都建业，强化长江下游作为政权中心的地位。",
        "吴国以江东士族、宗室将领和地方军事体系支撑皇帝政权。"
      ],
      result: [
        "孙吴正式建国，三国鼎立进入完整皇帝并立格局。",
        "建业成为吴国政治中心，江东政权的制度化程度提高。",
        "魏、蜀、吴之间的外交称谓和正统竞争更加明确。"
      ],
      impact: [
        "229 年是三国正式形态完成的节点，适合作为人物、地图和事件链共同锚点。",
        "孙吴称帝巩固了江东本位政权，也使其与蜀汉联盟关系更复杂。",
        "吴国长期存续到 280 年，成为西晋统一前最后一个对立政权。"
      ],
      sourceNotes: [
        "《三国志·吴书·吴主传》是孙权称帝和迁都建业的核心材料。",
        "《资治通鉴》卷七十一可补黄龙元年前后魏蜀吴关系。",
        "此事件应和 220 曹魏、221 蜀汉并列，形成三国建国链。"
      ],
      uncertainty: [
        "孙权称帝的内部推动过程在史料中没有曹魏受禅那样完整的制度文本。",
        "吴蜀关系在孙权称帝前后有外交称谓变化，后续可在事件链中细化。"
      ]
    }
  },
  {
    id: "sasanian-230-ardashir-roman-frontier",
    sourceRefs: [
      {
        sourceId: "deepseek-sasanian-source-history-of-the-empire-after-marcus-herodian-herodian-history-of-the-empi",
        locator: "6.2-6.6",
        note: "Herodian 对阿尔达希尔威胁罗马东方边境的叙述。"
      }
    ],
    personIds: ["sasanian-ardashir-i", "rome-alexander-severus"],
    relatedEvents: ["sasanian-224-ardashir-defeats-parthians", "sasanian-232-alexander-severus-expedition"],
    tags: ["frontier", "roman-sasanian", "mesopotamia"],
    detail: {
      overview:
        "230 年前后，阿尔达希尔一世在巩固萨珊王权后向罗马东方边境施压。它显示新兴萨珊国家很快把安息时代的边境问题转化为更主动的帝国竞争。",
      background: [
        "224 年萨珊取代安息后，阿尔达希尔需要以对外扩张巩固新王朝权威。",
        "美索不达米亚、叙利亚和亚美尼亚一直是罗马与伊朗高原政权竞争的边界地带。",
        "罗马在亚历山大·塞维鲁时期仍试图维持东方边防秩序。"
      ],
      process: [
        "Herodian 把阿尔达希尔描写为宣称恢复古波斯领土的人物，并强调其对罗马东方省份的威胁。",
        "萨珊压力迫使罗马准备更大规模的东方应对。",
        "这场压力不是一次孤立袭扰，而是萨珊-罗马长期对抗的开端。"
      ],
      result: [
        "罗马东方边防进入警戒状态，亚历山大·塞维鲁随后组织东征。",
        "萨珊在罗马视野中取代安息，成为更具意识形态和军事压力的新对手。",
        "边境争端延伸到 231-233 年罗马东征。"
      ],
      impact: [
        "此事件连接 224 年萨珊建国和 232 年罗马远征，是罗马-萨珊关系启动阶段的中间环节。",
        "阿尔达希尔的进攻姿态为沙普尔一世后续更大规模战争奠定模式。",
        "它说明 190-310 时间段不能只看罗马内部危机，也要看东方新帝国的形成。"
      ],
      sourceNotes: [
        "Herodian 是这一阶段罗马侧叙述的主要入口，尤其强调波斯新威胁。",
        "其叙述带有罗马东方恐慌和古波斯复兴框架，需要与萨珊钱币、后续铭文分开使用。"
      ],
      uncertainty: [
        "Herodian 对阿尔达希尔宣称古波斯领土的表述可能带有修辞化放大。",
        "具体进攻路线和占领范围不宜按单一文本精确复原。"
      ]
    }
  },
  {
    id: "sasanian-232-alexander-severus-expedition",
    sourceRefs: [
      {
        sourceId: "deepseek-sasanian-source-history-of-the-empire-after-marcus-herodian-herodian-history-of-the-empi",
        locator: "6.4-6.6",
        note: "Herodian 对亚历山大·塞维鲁东征的主叙述。"
      }
    ],
    personIds: ["rome-alexander-severus", "sasanian-ardashir-i"],
    relatedEvents: ["sasanian-230-ardashir-roman-frontier"],
    tags: ["campaign", "alexander-severus", "roman-sasanian"],
    detail: {
      overview:
        "231-233 年亚历山大·塞维鲁组织对萨珊波斯的东征，但战果有限。它反映罗马仍能动员大规模远征，却难以快速压制新兴萨珊边境压力。",
      background: [
        "阿尔达希尔对罗马东方边境的压力迫使罗马进行帝国级回应。",
        "亚历山大·塞维鲁政权需要通过东方军事行动维护皇帝威望。",
        "罗马和萨珊都处在新阶段：一方试图恢复边境安全，一方试图证明新王朝能力。"
      ],
      process: [
        "Herodian 叙述罗马军队分路进入东方战区，计划从多个方向牵制萨珊。",
        "远征推进并不顺利，分路行动带来协调和补给问题。",
        "双方都未取得决定性终局，罗马随后转向其他边境危机。"
      ],
      result: [
        "罗马没有彻底消除萨珊威胁。",
        "亚历山大·塞维鲁的东方威望有限，回到西部后仍面临军队不满。",
        "罗马-萨珊边境继续保持高压状态。"
      ],
      impact: [
        "这次远征预示三世纪罗马皇帝需要在多个边境之间来回应急。",
        "罗马未能解决萨珊问题，使 240-260 年代更严重冲突成为可能。",
        "它也帮助理解 235 年亚历山大·塞维鲁被军队杀害前的皇帝威望危机。"
      ],
      sourceNotes: [
        "Herodian 6.4-6.6 是主要叙述，但其对战果评价和行军细节存在修辞性。",
        "事件应作为边境战略节点，而非按精确战役复原处理。"
      ],
      uncertainty: [
        "罗马远征是否可称胜利存在争议，第一版按“战果有限”处理。",
        "三路进军的实际路线和损失数字不宜精确采用。"
      ]
    }
  },
  {
    id: "sasanian-244-battle-of-misiche",
    sourceRefs: [
      {
        sourceId: "deepseek-sasanian-source-s-kz-res-gestae-divi-saporis-shapur-i-kaba-ye-zardosht-trilingual-inscri",
        locator: "ŠKZ §6-9",
        note: "沙普尔一世铭文中的米西凯战役、戈尔迪安三世和腓力和约叙述。"
      }
    ],
    personIds: ["sasanian-shapur-i", "rome-gordian-iii", "rome-philip-the-arab"],
    relatedEvents: ["rome-sasanian-260-valerian-captured"],
    tags: ["war", "misiche", "shapur-i", "gordian-iii"],
    detail: {
      overview:
        "244 年米西凯会战是沙普尔一世早期对罗马战争的重要节点。ŠKZ 铭文宣称萨珊获胜，并把戈尔迪安三世之死和腓力阿拉伯人的和约纳入沙普尔胜利叙事。",
      background: [
        "沙普尔一世继承阿尔达希尔的对罗马扩张方向，需要通过战争塑造新王权威望。",
        "罗马戈尔迪安三世东征，试图恢复东方边境主动权。",
        "双方围绕美索不达米亚和叙利亚方向展开早期罗马-萨珊军事竞争。"
      ],
      process: [
        "ŠKZ 记载沙普尔在米西凯附近击败罗马军队。",
        "铭文把戈尔迪安三世之死与这场战役联系起来。",
        "腓力阿拉伯人随后成为皇帝，并与萨珊达成和约。"
      ],
      result: [
        "萨珊获得可用于王权宣传的重要胜利。",
        "罗马皇帝更替，东方战局以和约暂时收束。",
        "沙普尔一世的对罗马战争进入更具进攻性的阶段。"
      ],
      impact: [
        "米西凯为 260 年瓦勒良被俘前的罗马-萨珊冲突奠定叙事连续性。",
        "沙普尔铭文展示萨珊如何把对罗马胜利用于王权合法化。",
        "戈尔迪安之死在罗马和萨珊传统中解释不同，是史料证据面板的典型争议案例。"
      ],
      sourceNotes: [
        "ŠKZ 是核心萨珊侧材料，直接服务于沙普尔一世王权叙事。",
        "罗马传统对戈尔迪安三世死亡原因有不同解释，需要并列处理。"
      ],
      uncertainty: [
        "戈尔迪安三世究竟死于战败、疾病、兵变或政治谋杀，传统存在分歧。",
        "ŠKZ 是胜利铭文，战果和和约条件需与罗马材料互证。"
      ]
    }
  },
  {
    id: "sasanian-256-dura-europos",
    sourceRefs: [
      {
        sourceId: "deepseek-sasanian-source-s-kz-res-gestae-divi-saporis-dura-europos-excavation-reports-shapur-i-in",
        locator: "ŠKZ §14-15; Dura-Europos final reports",
        note: "铭文与杜拉欧罗普斯考古证据互证。"
      }
    ],
    personIds: ["sasanian-shapur-i"],
    relatedEvents: ["rome-sasanian-260-valerian-captured"],
    tags: ["siege", "dura-europos", "archaeology", "frontier"],
    detail: {
      overview:
        "256 年前后杜拉欧罗普斯陷落，是罗马幼发拉底河边境被萨珊突破的考古可见节点。它的重要性不只在文本记载，而在围城设施、坑道战和城市废弃层提供了具体物证。",
      background: [
        "杜拉欧罗普斯位于幼发拉底河中游，是罗马东方边境的重要城镇和军事据点。",
        "沙普尔一世中期攻势扩大，罗马东方边防在多点承压。",
        "该城保存条件特殊，使考古材料能够补足文本史料的空白。"
      ],
      process: [
        "萨珊军队围攻杜拉欧罗普斯，考古显示城墙、攻城坡道和坑道战痕迹。",
        "城内防御设施和建筑改造说明罗马守军曾进行紧急防御。",
        "城市最终陷落，并在此后不再作为正常城市持续存在。"
      ],
      result: [
        "杜拉欧罗普斯失守，罗马幼发拉底边境体系遭受打击。",
        "城市废弃层保存了宗教建筑、军事设施和攻城战遗迹。",
        "萨珊在 250 年代中期的进攻能力得到具体物证支持。"
      ],
      impact: [
        "杜拉欧罗普斯是罗马-萨珊战争中少见的考古锚点，可与铭文证据互证。",
        "它为解释 260 年瓦勒良被俘前罗马东方边防连续受压提供背景。",
        "后续地图和证据面板应把它作为“物证型事件”的范例。"
      ],
      sourceNotes: [
        "ŠKZ 提供沙普尔一世攻势的文本框架。",
        "杜拉欧罗普斯考古报告提供围城、坑道和城市陷落的物质证据。"
      ],
      uncertainty: [
        "具体陷落年份通常处理为约 256 年，可能存在小幅年代浮动。",
        "单一城市考古证据不能直接外推整个边境所有战况。"
      ]
    }
  },
  {
    id: "sasanian-262-odaenathus-counteroffensive",
    sourceRefs: [
      {
        sourceId: "deepseek-sasanian-source-zosimus-historia-nova-zosimus-zosimus-historia-nova-new-history",
        locator: "1.27-1.28",
        note: "Zosimus 对奥登纳图斯反击萨珊的后期希腊叙述。"
      }
    ],
    personIds: ["rome-odaenathus", "sasanian-shapur-i", "rome-valerian"],
    relatedEvents: ["rome-sasanian-260-valerian-captured", "rome-270-zenobia-and-the-palmyrene-empire-267-272"],
    tags: ["palmyra", "counteroffensive", "roman-east", "sasanian"],
    detail: {
      overview:
        "262 年前后，帕尔米拉的奥登纳图斯代表罗马东方对萨珊展开反击，缓解瓦勒良被俘后的危机。它是帕尔米拉从地方盟友走向东方强权的关键一步。",
      background: [
        "260 年瓦勒良被俘后，罗马东方权威严重受损，边防出现真空。",
        "帕尔米拉位于叙利亚沙漠贸易和军事通道上，具备动员地方力量的条件。",
        "奥登纳图斯以罗马盟友和东方防卫者身份崛起。"
      ],
      process: [
        "奥登纳图斯集结帕尔米拉力量，对萨珊在美索不达米亚方向进行反击。",
        "后期传统称其收复部分失地，并威胁萨珊控制区。",
        "罗马中央在危机中承认或利用奥登纳图斯的东方军事作用。"
      ],
      result: [
        "萨珊在瓦勒良被俘后的扩张势头受到遏制。",
        "奥登纳图斯在罗马东方获得突出地位。",
        "帕尔米拉权力上升，为芝诺比娅时期的帕尔米拉帝国埋下基础。"
      ],
      impact: [
        "此事件说明罗马危机中的地方代理力量可以暂时维持帝国边防。",
        "帕尔米拉从罗马盟友转向半独立强权的路径由此展开。",
        "它连接 260 年罗马惨败和 270-272 年奥勒良收复东方。"
      ],
      sourceNotes: [
        "Zosimus 保存较详细的后期希腊叙述，是奥登纳图斯反击的主要文本入口。",
        "相关叙述应和帕尔米拉铭文、罗马后期史料及现代研究互证。"
      ],
      uncertainty: [
        "奥登纳图斯反击的具体路线、战果和称号变化存在史料限制。",
        "后期叙述可能把帕尔米拉成就集中化，需要避免夸大其独立性。"
      ]
    }
  }
];

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeDetail(detail, summary) {
  return {
    overview: detail.overview ?? summary ?? "",
    background: detail.background ?? [],
    process: detail.process ?? [],
    result: detail.result ?? [],
    impact: detail.impact ?? [],
    sourceNotes: detail.sourceNotes ?? [],
    uncertainty: detail.uncertainty ?? [],
  };
}

function mergeRaw(raw, event, summary) {
  const detail = normalizeDetail(event.detail, summary ?? raw.summary ?? "");
  const sourceRefs = uniqueBy(
    [...(Array.isArray(raw.sourceRefs) ? raw.sourceRefs : []), ...(event.sourceRefs ?? [])],
    (ref) => `${ref.sourceId}:${ref.locator ?? ""}`
  );

  return {
    ...raw,
    detail,
    sourceRefs,
    relatedEvents: uniqueBy([...(Array.isArray(raw.relatedEvents) ? raw.relatedEvents : []), ...(event.relatedEvents ?? [])], (id) => id),
    personIds: uniqueBy([...(Array.isArray(raw.personIds) ? raw.personIds : []), ...(event.personIds ?? [])], (id) => id),
    tags: uniqueBy([...(Array.isArray(raw.tags) ? raw.tags : []), ...(event.tags ?? [])], (id) => id),
    reviewStatus: "reviewed",
    reviewedBy: batchId,
  };
}

const selectHistorical = db.prepare("SELECT summary, raw_json FROM historical_events WHERE id = ?");
const updateHistorical = db.prepare(`
  UPDATE historical_events
  SET detail_json = ?, raw_json = ?
  WHERE id = ?
`);
const selectEvent = db.prepare("SELECT summary, raw_json FROM events WHERE id = ?");
const updateEvent = db.prepare(`
  UPDATE events
  SET review_status = 'reviewed', raw_json = ?
  WHERE id = ?
`);

db.exec("BEGIN");
try {
  let historicalUpdated = 0;
  let eventUpdated = 0;

  for (const event of details) {
    const historical = selectHistorical.get(event.id);
    if (historical) {
      const raw = mergeRaw(parseJson(historical.raw_json), event, historical.summary);
      updateHistorical.run(JSON.stringify(raw.detail, null, 2), JSON.stringify(raw, null, 2), event.id);
      historicalUpdated += 1;
    }

    const futureEvent = selectEvent.get(event.id);
    if (futureEvent) {
      const raw = mergeRaw(parseJson(futureEvent.raw_json), event, futureEvent.summary);
      updateEvent.run(JSON.stringify(raw, null, 2), event.id);
      eventUpdated += 1;
    }
  }

  db.exec("COMMIT");
  console.log(`Seeded remaining China/Sasanian event details: historical=${historicalUpdated}, events=${eventUpdated}`);
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}
