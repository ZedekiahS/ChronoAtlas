import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("db/chronoatlas.sqlite");
const batchId = "manual-rome-persons-190-310";

const people = [
  ["rome-septimius-severus", "塞普蒂米乌斯·塞维鲁", "Septimius Severus", 145, 211, "罗马帝国", "塞维鲁王朝建立者，193 年内战后重塑军队与皇权。", ["Lucius Septimius Severus", "塞维鲁"], "rome-source-history-of-the-empire-after-marcus-herodian", "2.9-2.12"],
  ["rome-caracalla", "卡拉卡拉", "Caracalla", 188, 217, "罗马帝国", "塞维鲁之子，杀盖塔后独掌帝国，212 年颁布安东尼努斯敕令。", ["Marcus Aurelius Antoninus", "Antoninus"], "rome-source-roman-history-cassius-dio", "78.2-78.9"],
  ["rome-geta", "盖塔", "Geta", 189, 211, "罗马帝国", "塞维鲁之子，与卡拉卡拉短暂共治，211 年被杀。", ["Publius Septimius Geta"], "rome-source-roman-history-cassius-dio", "78.2-78.4"],
  ["rome-macrinus", "马克里努斯", "Macrinus", 164, 218, "罗马帝国", "禁卫军长官出身，217 年刺杀卡拉卡拉后称帝，218 年被埃拉伽巴路斯取代。", ["Marcus Opellius Macrinus"], "rome-source-history-of-the-empire-after-marcus-herodian", "4.12-5.4"],
  ["rome-elagabalus", "埃拉伽巴路斯", "Elagabalus", 204, 222, "罗马帝国", "叙利亚埃梅萨祭司出身的塞维鲁王朝皇帝，218-222 年在位。", ["Heliogabalus", "Varius Avitus Bassianus"], "rome-source-history-of-the-empire-after-marcus-herodian", "5.3-5.8"],
  ["rome-alexander-severus", "亚历山大·塞维鲁", "Alexander Severus", 208, 235, "罗马帝国", "塞维鲁王朝末代皇帝，面对萨珊和莱茵压力，235 年被军队杀害。", ["Severus Alexander"], "rome-source-history-of-the-empire-after-marcus-herodian", "6.2-6.9"],
  ["rome-maximinus-thrax", "马克西米努斯·色雷克斯", "Maximinus Thrax", 173, 238, "罗马帝国", "235 年由军队拥立，通常被视为三世纪危机开端的军人皇帝。", ["Maximinus"], "rome-source-history-of-the-empire-after-marcus-herodian", "6.8-7.8"],
  ["rome-gordian-i", "戈尔迪安一世", "Gordian I", 159, 238, "罗马帝国", "238 年非洲起义中被拥立，与戈尔迪安二世共同反对马克西米努斯。", ["Gordianus I"], "rome-source-history-of-the-empire-after-marcus-herodian", "7.5-7.9"],
  ["rome-gordian-ii", "戈尔迪安二世", "Gordian II", 192, 238, "罗马帝国", "戈尔迪安一世之子，238 年非洲起义中共同称帝并迅速败亡。", ["Gordianus II"], "rome-source-history-of-the-empire-after-marcus-herodian", "7.5-7.9"],
  ["rome-pupienus", "普皮恩努斯", "Pupienus", 165, 238, "罗马帝国", "238 年元老院拥立的皇帝之一，与巴尔比努斯共治并被禁卫军杀害。", ["Pupienus Maximus"], "rome-source-history-of-the-empire-after-marcus-herodian", "7.10-8.8"],
  ["rome-balbinus", "巴尔比努斯", "Balbinus", 178, 238, "罗马帝国", "238 年元老院拥立的皇帝之一，与普皮恩努斯共治并被杀。", ["Decimus Caelius Calvinus Balbinus"], "rome-source-history-of-the-empire-after-marcus-herodian", "7.10-8.8"],
  ["rome-gordian-iii", "戈尔迪安三世", "Gordian III", 225, 244, "罗马帝国", "238 年后成为皇帝，244 年东方战争中死亡。", ["Gordianus III"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.2-9.3"],
  ["rome-philip-the-arab", "腓力阿拉伯人", "Philip the Arab", 204, 249, "罗马帝国", "244 年戈尔迪安三世死后称帝，248 年庆祝罗马建城千年。", ["Marcus Julius Philippus", "Philip"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.3-9.4"],
  ["rome-decius", "德西乌斯", "Decius", 201, 251, "罗马帝国", "249 年称帝，推动帝国祭祀忠诚测试，251 年死于阿布里图斯。", ["Trajan Decius"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.4"],
  ["rome-valerian", "瓦勒良", "Valerian", 200, 260, "罗马帝国", "253 年称帝，260 年在东方战争中被沙普尔一世俘虏。", ["Publius Licinius Valerianus"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.7"],
  ["rome-gallienus", "加里恩努斯", "Gallienus", 218, 268, "罗马帝国", "瓦勒良之子，253-268 年共治及独治，面对帝国分裂和多线入侵。", ["Publius Licinius Egnatius Gallienus"], "rome-source-historia-nova-zosimus", "1.40-1.41"],
  ["rome-claudius-ii", "克劳狄二世", "Claudius II Gothicus", 214, 270, "罗马帝国", "268 年即位，因击败哥特人获得 Gothicus 称号。", ["Claudius Gothicus"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.11"],
  ["rome-aurelian", "奥勒良", "Aurelian", 214, 275, "罗马帝国", "270-275 年在位，击败帕尔米拉和高卢割据，重新统一帝国。", ["Lucius Domitius Aurelianus"], "rome-source-historia-augusta-scriptores-historiae-augustae", "Aurelian 24-34"],
  ["rome-tacitus", "塔西佗", "Tacitus", 200, 276, "罗马帝国", "奥勒良死后短暂在位的元老皇帝。", ["Marcus Claudius Tacitus"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.16"],
  ["rome-probus", "普罗布斯", "Probus", 232, 282, "罗马帝国", "276-282 年在位，继续恢复边境秩序。", ["Marcus Aurelius Probus"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.17"],
  ["rome-carus", "卡鲁斯", "Carus", 222, 283, "罗马帝国", "282 年称帝，发动东方远征并死于途中。", ["Marcus Aurelius Carus"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.18"],
  ["rome-numerian", "努梅里安", "Numerian", 253, 284, "罗马帝国", "卡鲁斯之子，东方撤军途中死亡，戴克里先由此入局。", ["Numerianus"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.19-9.20"],
  ["rome-carinus", "卡里努斯", "Carinus", 250, 285, "罗马帝国", "卡鲁斯之子，在西部统治并与戴克里先竞争。", ["Carinus"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.20"],
  ["rome-diocletian", "戴克里先", "Diocletian", 244, 311, "罗马帝国", "284 年即位，建立四帝共治并重组帝国制度。", ["Diocles", "Gaius Aurelius Valerius Diocletianus"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.20-9.25"],
  ["rome-maximian", "马克西米安", "Maximian", 250, 310, "罗马帝国", "戴克里先的西部共治奥古斯都，286 年升为奥古斯都。", ["Marcus Aurelius Valerius Maximianus"], "rome-source-de-mortibus-persecutorum-lactantius", "7-8"],
  ["rome-galerius", "伽列里乌斯", "Galerius", 260, 311, "罗马帝国", "293 年成为凯撒，298 年击败纳尔塞赫，305 年升为奥古斯都。", ["Gaius Galerius Valerius Maximianus"], "rome-source-de-mortibus-persecutorum-lactantius", "18-19"],
  ["rome-constantius-chlorus", "君士坦提乌斯一世", "Constantius Chlorus", 250, 306, "罗马帝国", "293 年成为西部凯撒，296 年收复不列颠，305 年升为奥古斯都。", ["Constantius I", "Constantius"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.22"],
  ["rome-severus-ii", "塞维鲁二世", "Severus II", null, 307, "罗马帝国", "305 年成为凯撒，306 年后卷入马克森提乌斯危机。", ["Flavius Valerius Severus"], "rome-source-de-mortibus-persecutorum-lactantius", "18-26"],
  ["rome-maximinus-daia", "马克西米努斯·达扎", "Maximinus Daia", 270, 313, "罗马帝国", "305 年成为凯撒，四帝共治崩解后成为东部竞争者。", ["Maximinus Daza"], "rome-source-de-mortibus-persecutorum-lactantius", "18-19"],
  ["rome-constantine", "君士坦丁", "Constantine", 272, 337, "罗马帝国", "306 年在不列颠被拥立，后成为四帝共治崩解后的核心竞争者。", ["Constantine I", "Constantine the Great"], "rome-source-de-mortibus-persecutorum-lactantius", "24-26"],
  ["rome-maxentius", "马克森提乌斯", "Maxentius", 278, 312, "罗马帝国", "306 年在罗马起事，挑战四帝共治继承安排。", ["Marcus Aurelius Valerius Maxentius"], "rome-source-de-mortibus-persecutorum-lactantius", "24-26"],
  ["palmyra-odaenathus", "奥登纳图斯", "Odaenathus", null, 267, "帕尔米拉 / 罗马东方", "瓦勒良被俘后代表罗马反击沙普尔，维持东方秩序。", ["Septimius Odaenathus"], "rome-source-historia-nova-zosimus", "1.39-1.40"],
  ["palmyra-zenobia", "芝诺比娅", "Zenobia", 240, null, "帕尔米拉", "奥登纳图斯死后执掌帕尔米拉政权，与奥勒良对抗。", ["Septimia Zenobia"], "rome-source-historia-augusta-scriptores-historiae-augustae", "Aurelian 24-30"],
  ["rome-postumus", "波斯图穆斯", "Postumus", null, 269, "高卢帝国", "260 年后在高卢自立，建立西部割据政权。", ["Marcus Cassianius Latinius Postumus"], "rome-source-de-caesaribus-aurelius-victor", "33"],
  ["rome-carausius", "卡劳修斯", "Carausius", null, 293, "不列颠割据政权", "286 年在不列颠割据，挑战戴克里先和马克西米安。", ["Marcus Aurelius Mausaeus Carausius"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.21"],
  ["rome-allectus", "阿莱克图斯", "Allectus", null, 296, "不列颠割据政权", "杀卡劳修斯后继续割据不列颠，296 年被击败。", ["Allectus"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.22"],
];

const lifeEvents = [
  ["rome-septimius-severus", 193, "accession", "潘诺尼亚军队拥立", "193 年塞维鲁被潘诺尼亚军团拥立，并迅速进军罗马。", "rome-source-history-of-the-empire-after-marcus-herodian", "2.9-2.12"],
  ["rome-septimius-severus", 197, "war", "击败阿尔比努斯", "197 年里昂战役后，塞维鲁消灭西方竞争者。", "rome-source-roman-history-cassius-dio", "76.6-76.7"],
  ["rome-septimius-severus", 208, "war", "不列颠远征", "208 年后塞维鲁亲征不列颠，最终死于约克。", "rome-source-history-of-the-empire-after-marcus-herodian", "3.14-3.15"],
  ["rome-caracalla", 211, "accession", "与盖塔共同继位", "塞维鲁死后，卡拉卡拉与盖塔共同继位。", "rome-source-roman-history-cassius-dio", "78.1-78.4"],
  ["rome-caracalla", 212, "reform", "颁布安东尼努斯敕令", "212 年卡拉卡拉授予帝国内自由民罗马公民权。", "rome-source-roman-history-cassius-dio", "78.9"],
  ["rome-geta", 211, "death", "被卡拉卡拉杀害", "兄弟共治迅速失败，盖塔在宫廷冲突中被杀。", "rome-source-roman-history-cassius-dio", "78.2-78.4"],
  ["rome-macrinus", 217, "accession", "刺杀卡拉卡拉后称帝", "马克里努斯以禁卫军长官身份参与卡拉卡拉遇刺后称帝。", "rome-source-history-of-the-empire-after-marcus-herodian", "4.12-5.1"],
  ["rome-macrinus", 218, "deposition", "败于埃拉伽巴路斯势力", "218 年东方军队转向塞维鲁家族候选人埃拉伽巴路斯，马克里努斯败亡。", "rome-source-history-of-the-empire-after-marcus-herodian", "5.3-5.4"],
  ["rome-elagabalus", 218, "accession", "叙利亚军队拥立", "埃拉伽巴路斯在尤利娅·玛伊萨推动下被东方军队拥立。", "rome-source-history-of-the-empire-after-marcus-herodian", "5.3-5.4"],
  ["rome-elagabalus", 222, "deposition", "被禁卫军杀害", "222 年埃拉伽巴路斯和其母被杀，亚历山大·塞维鲁上台。", "rome-source-history-of-the-empire-after-marcus-herodian", "5.8"],
  ["rome-alexander-severus", 222, "accession", "成为皇帝", "222 年亚历山大·塞维鲁被拥立为皇帝，玛迈亚影响显著。", "rome-source-history-of-the-empire-after-marcus-herodian", "5.8"],
  ["rome-alexander-severus", 231, "war", "东方对萨珊战争", "亚历山大·塞维鲁组织对阿尔达希尔一世的东方战争。", "rome-source-history-of-the-empire-after-marcus-herodian", "6.2-6.6"],
  ["rome-alexander-severus", 235, "death", "莱茵前线被杀", "235 年亚历山大·塞维鲁和玛迈亚在军队不满中被杀。", "rome-source-history-of-the-empire-after-marcus-herodian", "6.8-6.9"],
  ["rome-maximinus-thrax", 235, "accession", "军队拥立", "马克西米努斯在亚历山大遇害后由军队拥立。", "rome-source-history-of-the-empire-after-marcus-herodian", "6.8-6.9"],
  ["rome-maximinus-thrax", 238, "deposition", "阿奎莱亚围城中败亡", "238 年元老院和地方起义反对马克西米努斯，他在阿奎莱亚围城期间被杀。", "rome-source-history-of-the-empire-after-marcus-herodian", "8.5-8.6"],
  ["rome-gordian-i", 238, "accession", "非洲起义中被拥立", "238 年非洲地方反抗马克西米努斯，戈尔迪安一世被拥立。", "rome-source-history-of-the-empire-after-marcus-herodian", "7.5-7.9"],
  ["rome-gordian-ii", 238, "death", "非洲起义失败身亡", "戈尔迪安二世在非洲起义军事失败中死亡。", "rome-source-history-of-the-empire-after-marcus-herodian", "7.9"],
  ["rome-pupienus", 238, "accession", "元老院拥立共治", "元老院拥立普皮恩努斯和巴尔比努斯共同对抗马克西米努斯。", "rome-source-history-of-the-empire-after-marcus-herodian", "7.10-8.8"],
  ["rome-balbinus", 238, "accession", "元老院拥立共治", "巴尔比努斯与普皮恩努斯共同被元老院拥立。", "rome-source-history-of-the-empire-after-marcus-herodian", "7.10-8.8"],
  ["rome-gordian-iii", 238, "accession", "六帝之年后成为皇帝", "238 年动荡结束后，年轻的戈尔迪安三世成为皇帝。", "rome-source-history-of-the-empire-after-marcus-herodian", "8.8"],
  ["rome-gordian-iii", 244, "death", "东方战争中死亡", "244 年戈尔迪安三世在东方战争背景下死亡，腓力继位。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.2-9.3"],
  ["rome-philip-the-arab", 244, "accession", "戈尔迪安死后继位", "腓力在戈尔迪安三世死后继位并与波斯议和。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.2-9.3"],
  ["rome-philip-the-arab", 248, "reign", "罗马建城千年庆典", "248 年腓力统治下庆祝罗马建城千年。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.3"],
  ["rome-decius", 249, "accession", "取代腓力", "德西乌斯在军队政治中取代腓力称帝。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.4"],
  ["rome-decius", 250, "reign", "祭祀忠诚测试与迫害", "德西乌斯时期推动帝国祭祀忠诚测试，引发教会史中的迫害记忆。", "rome-source-ecclesiastical-history-eusebius", "6.39-6.41"],
  ["rome-decius", 251, "death", "阿布里图斯战死", "251 年德西乌斯在对哥特战争中死亡。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.4"],
  ["rome-valerian", 253, "accession", "与加里恩努斯共治", "253 年瓦勒良称帝，并与其子加里恩努斯形成东西分担格局。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.7"],
  ["rome-valerian", 257, "reign", "迫害基督徒", "257 年前后瓦勒良政策转向压迫教会领袖和集会。", "rome-source-ecclesiastical-history-eusebius", "7.10-7.11"],
  ["rome-valerian", 260, "deposition", "被沙普尔俘虏", "260 年瓦勒良在东方战争中被沙普尔一世俘虏。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.7"],
  ["rome-gallienus", 253, "accession", "成为共治皇帝", "加里恩努斯与父亲瓦勒良共同统治，主要负责西部压力。", "rome-source-de-caesaribus-aurelius-victor", "33"],
  ["rome-gallienus", 260, "crisis", "独自面对帝国分裂", "瓦勒良被俘后，加里恩努斯面对高卢帝国、帕尔米拉和多线边境危机。", "rome-source-de-caesaribus-aurelius-victor", "33"],
  ["rome-gallienus", 268, "death", "米兰战局中遇害", "268 年加里恩努斯在西部军事危机中被杀。", "rome-source-historia-nova-zosimus", "1.40-1.41"],
  ["rome-claudius-ii", 268, "accession", "加里恩努斯死后即位", "克劳狄二世在加里恩努斯遇害后取得皇位。", "rome-source-historia-nova-zosimus", "1.40-1.41"],
  ["rome-claudius-ii", 269, "war", "击败哥特人", "克劳狄二世因击败哥特人获得 Gothicus 名号。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.11"],
  ["rome-aurelian", 270, "accession", "成为皇帝", "270 年奥勒良在危机后期成为皇帝。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.13"],
  ["rome-aurelian", 272, "war", "击败芝诺比娅", "奥勒良东征击败帕尔米拉政权，恢复东方。", "rome-source-historia-nova-zosimus", "1.50-1.61"],
  ["rome-aurelian", 274, "reign", "重新统一帝国", "274 年奥勒良收复高卢割据，象征东西两端重新归入罗马。", "rome-source-historia-augusta-scriptores-historiae-augustae", "Aurelian 32-34"],
  ["rome-probus", 276, "accession", "成为皇帝", "普罗布斯在奥勒良和塔西佗后成为皇帝。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.17"],
  ["rome-probus", 276, "war", "恢复边防秩序", "普罗布斯继续恢复莱茵和多瑙河方向边防秩序。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.17"],
  ["rome-carus", 282, "accession", "成为皇帝", "卡鲁斯在普罗布斯死后称帝。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.18"],
  ["rome-carus", 283, "war", "东方远征", "卡鲁斯发动东方远征，途中死亡。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.18"],
  ["rome-diocletian", 284, "accession", "即位", "284 年戴克里先在努梅里安死亡后取得皇位。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.20-9.21"],
  ["rome-diocletian", 293, "reform", "形成四帝共治", "293 年两奥古斯都和两凯撒的四帝共治正式形成。", "rome-source-de-mortibus-persecutorum-lactantius", "7-8"],
  ["rome-diocletian", 303, "reign", "大迫害开始", "303 年戴克里先统治后期的大迫害开始。", "rome-source-ecclesiastical-history-eusebius", "8.2-8.6"],
  ["rome-diocletian", 305, "abdication", "退位", "305 年戴克里先与马克西米安同时退位。", "rome-source-de-mortibus-persecutorum-lactantius", "18-19"],
  ["rome-maximian", 286, "accession", "升为奥古斯都", "286 年马克西米安成为西部奥古斯都。", "rome-source-de-mortibus-persecutorum-lactantius", "7-8"],
  ["rome-maximian", 305, "abdication", "与戴克里先共同退位", "305 年马克西米安按四帝共治安排退位。", "rome-source-de-mortibus-persecutorum-lactantius", "18-19"],
  ["rome-galerius", 293, "accession", "成为凯撒", "293 年伽列里乌斯成为东部凯撒。", "rome-source-de-mortibus-persecutorum-lactantius", "7-8"],
  ["rome-galerius", 298, "war", "击败纳尔塞赫", "伽列里乌斯击败萨珊纳尔塞赫，促成有利于罗马的边界安排。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.24-9.25"],
  ["rome-galerius", 305, "accession", "升为奥古斯都", "305 年戴克里先退位后，伽列里乌斯升为奥古斯都。", "rome-source-de-mortibus-persecutorum-lactantius", "18-19"],
  ["rome-constantius-chlorus", 293, "accession", "成为凯撒", "293 年君士坦提乌斯成为西部凯撒。", "rome-source-de-mortibus-persecutorum-lactantius", "7-8"],
  ["rome-constantius-chlorus", 296, "war", "收复不列颠", "296 年君士坦提乌斯击败阿莱克图斯，收复不列颠。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.22"],
  ["rome-constantius-chlorus", 306, "death", "约克去世", "306 年君士坦提乌斯在不列颠去世，君士坦丁被拥立。", "rome-source-de-mortibus-persecutorum-lactantius", "24-26"],
  ["rome-constantine", 306, "accession", "在不列颠被拥立", "君士坦提乌斯死后，军队在不列颠拥立君士坦丁。", "rome-source-de-mortibus-persecutorum-lactantius", "24-26"],
  ["rome-maxentius", 306, "accession", "在罗马起事", "306 年马克森提乌斯在罗马取得权力，挑战四帝共治安排。", "rome-source-de-mortibus-persecutorum-lactantius", "24-26"],
  ["palmyra-odaenathus", 262, "war", "反击沙普尔", "瓦勒良被俘后，奥登纳图斯代表罗马反击波斯军。", "rome-source-historia-nova-zosimus", "1.39-1.40"],
  ["palmyra-zenobia", 272, "war", "与奥勒良对抗", "芝诺比娅执掌帕尔米拉政权后与奥勒良东征发生冲突。", "rome-source-historia-augusta-scriptores-historiae-augustae", "Aurelian 24-30"],
  ["rome-postumus", 260, "accession", "在高卢自立", "260 年后波斯图穆斯控制高卢、不列颠和西班牙方向。", "rome-source-de-caesaribus-aurelius-victor", "33"],
  ["rome-carausius", 286, "accession", "割据不列颠", "卡劳修斯在不列颠割据，形成西部海防危机。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.21"],
  ["rome-allectus", 293, "accession", "取代卡劳修斯", "阿莱克图斯杀卡劳修斯后继续控制不列颠。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.22"],
  ["rome-allectus", 296, "death", "被君士坦提乌斯击败", "296 年阿莱克图斯被击败，不列颠重新归入帝国。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.22"],
];

function lifeLabel(birth, death) {
  return `${birth ?? "?"}-${death ?? "?"}`;
}

function json(value) {
  return JSON.stringify(value);
}

try {
  db.exec("PRAGMA foreign_keys = ON;");
  const insertPerson = db.prepare(`
    INSERT INTO persons (id, region, name, courtesy_name, life, birth_year, death_year, life_confidence, primary_polity, summary, coverage_status, raw_json)
    VALUES (?, 'rome', ?, NULL, ?, ?, ?, 'medium', ?, ?, 'partial', ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, life=excluded.life, birth_year=excluded.birth_year, death_year=excluded.death_year,
      primary_polity=excluded.primary_polity, summary=excluded.summary, coverage_status=excluded.coverage_status, raw_json=excluded.raw_json
  `);
  const insertEntity = db.prepare(`
    INSERT INTO entities (id, entity_type, primary_label, civilization_id, region_id, time_start, time_end, summary, confidence, review_status, raw_json)
    VALUES (?, 'person', ?, 'rome-imperial', 'rome', ?, ?, ?, 'medium', 'reviewed', ?)
    ON CONFLICT(id) DO UPDATE SET
      primary_label=excluded.primary_label, time_start=excluded.time_start, time_end=excluded.time_end,
      summary=excluded.summary, review_status=excluded.review_status, raw_json=excluded.raw_json
  `);
  const insertAlias = db.prepare(`
    INSERT INTO entity_aliases (id, entity_id, value, alias_type, language, raw_json)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET value=excluded.value, alias_type=excluded.alias_type, language=excluded.language, raw_json=excluded.raw_json
  `);
  const insertLife = db.prepare(`
    INSERT INTO person_life_events (id, person_id, year, end_year, display_year, type, title, summary, confidence, approximate, raw_json)
    VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET year=excluded.year, display_year=excluded.display_year, title=excluded.title, summary=excluded.summary, confidence=excluded.confidence, approximate=excluded.approximate, raw_json=excluded.raw_json
  `);
  const insertRef = db.prepare(`
    INSERT INTO person_life_event_source_refs (life_event_id, source_id, locator, quote, raw_json)
    VALUES (?, ?, ?, NULL, ?)
    ON CONFLICT(life_event_id, source_id, locator) DO UPDATE SET raw_json=excluded.raw_json
  `);
  const deleteLife = db.prepare("DELETE FROM person_life_events WHERE id LIKE 'rome-life:%'");
  const deleteRefs = db.prepare("DELETE FROM person_life_event_source_refs WHERE life_event_id LIKE 'rome-life:%'");
  const insertChunkEntity = db.prepare(`
    INSERT INTO document_chunk_entities (chunk_id, entity_id, link_role, sort_order)
    VALUES (?, ?, 'mentioned', ?)
    ON CONFLICT(chunk_id, entity_id, link_role) DO UPDATE SET sort_order=excluded.sort_order
  `);

  db.exec("BEGIN;");
  deleteRefs.run();
  deleteLife.run();
  for (const [id, zh, en, birth, death, polity, summary, aliases, sourceId, locator] of people) {
    const entityId = `person:${id}`;
    const raw = { batchId, id, zh, en, aliases, sourceRefs: [{ sourceId, locator }] };
    insertPerson.run(id, zh, lifeLabel(birth, death), birth, death, polity, summary, json(raw));
    insertEntity.run(entityId, zh, birth, death, summary, json(raw));
    [[zh, "zh-Hans", "primary"], [en, "en", "primary"], ...aliases.map((a) => [a, /[\u4e00-\u9fff]/.test(a) ? "zh-Hans" : "en", "alias"])].forEach(([value, lang, type], index) => {
      insertAlias.run(`${entityId}:alias:${index}`, entityId, value, type, lang, json({ batchId }));
    });
    if (birth !== null) {
      const lifeId = `${id}-birth`;
      insertLife.run(lifeId, id, birth, String(birth), "birth", `${zh}出生`, `${zh}约于 ${birth} 年出生。`, "medium", 1, json({ batchId, sourceRefs: [{ sourceId, locator }] }));
      insertRef.run(lifeId, sourceId, locator, json({ batchId }));
    }
    if (death !== null) {
      const lifeId = `${id}-death`;
      insertLife.run(lifeId, id, death, String(death), "death", `${zh}去世`, `${zh}约于 ${death} 年去世或败亡。`, "medium", 1, json({ batchId, sourceRefs: [{ sourceId, locator }] }));
      insertRef.run(lifeId, sourceId, locator, json({ batchId }));
    }
  }

  for (const [personId, year, type, title, summary, sourceId, locator] of lifeEvents) {
    const lifeId = `rome-life:${personId}:${year}:${type}`;
    insertLife.run(lifeId, personId, year, String(year), type, title, summary, "medium", 0, json({ batchId, personId, year, type, title, summary, sourceRefs: [{ sourceId, locator }] }));
    insertRef.run(lifeId, sourceId, locator, json({ batchId }));
  }

  db.prepare("DELETE FROM document_chunk_entities WHERE entity_id LIKE 'person:rome-%' OR entity_id LIKE 'person:palmyra-%'").run();
  const chunks = db.prepare("SELECT id, raw_json, title, body FROM document_chunks WHERE region_id='rome'").all();
  people.forEach(([id, zh, en, , , , , aliases], personIndex) => {
    const entityId = `person:${id}`;
    const terms = [zh, en, ...aliases].filter(Boolean);
    chunks.forEach((chunk) => {
      const haystack = `${chunk.title}\n${chunk.body}\n${chunk.raw_json}`;
      if (terms.some((term) => haystack.includes(term))) {
        insertChunkEntity.run(chunk.id, entityId, personIndex);
      }
    });
  });
  db.exec("COMMIT;");
  console.log(`Seeded ${people.length} Roman person records and linked document chunks.`);
} catch (error) {
  db.exec("ROLLBACK;");
  throw error;
} finally {
  db.close();
}
