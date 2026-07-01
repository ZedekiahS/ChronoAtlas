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
  ["rome-julia-domna", "尤利娅·多姆娜", "Julia Domna", 160, 217, "塞维鲁王朝", "塞普蒂米乌斯·塞维鲁之妻，卡拉卡拉与盖塔之母，是塞维鲁王朝宫廷政治的重要核心。", ["Julia Domna Augusta"], "rome-source-roman-history-cassius-dio", "78.2-78.24"],
  ["rome-julia-maesa", "尤利娅·玛伊萨", "Julia Maesa", 165, 224, "塞维鲁王朝", "尤利娅·多姆娜之妹，推动埃拉伽巴路斯和亚历山大·塞维鲁进入皇位继承。", ["Julia Maesa Augusta"], "rome-source-history-of-the-empire-after-marcus-herodian", "5.3-5.8"],
  ["rome-julia-soaemias", "尤利娅·索艾米亚斯", "Julia Soaemias", 180, 222, "塞维鲁王朝", "埃拉伽巴路斯之母，随其进入罗马政治核心，222 年与其一同被杀。", ["Julia Soaemias Bassiana"], "rome-source-history-of-the-empire-after-marcus-herodian", "5.3-5.8"],
  ["rome-julia-mamaea", "尤利娅·玛迈亚", "Julia Mamaea", 180, 235, "塞维鲁王朝", "亚历山大·塞维鲁之母，在其统治中长期掌握宫廷影响，235 年与其一同被军队杀害。", ["Julia Avita Mamaea"], "rome-source-history-of-the-empire-after-marcus-herodian", "6.1-6.9"],
  ["rome-tetricus", "提特里库斯", "Tetricus I", null, null, "高卢帝国", "高卢帝国后期统治者，274 年向奥勒良投降，高卢割据由此结束。", ["Gaius Pius Esuvius Tetricus", "Tetricus"], "rome-source-breviarium-ab-urbe-condita-eutropius", "9.13"],
  ["rome-macrianus", "马克里亚努斯", "Macrianus", null, 261, "东方割据势力", "瓦勒良被俘后东方军政网络中的竞争者，其集团挑战加里恩努斯但迅速失败。", ["Fulvius Macrianus"], "rome-source-historia-nova-zosimus", "1.39-1.40"],
  ["rome-quietus", "奎埃图斯", "Quietus", null, 261, "东方割据势力", "马克里亚努斯集团成员，瓦勒良被俘后的东方割据竞争中败亡。", ["Titus Fulvius Junius Quietus"], "rome-source-historia-nova-zosimus", "1.39-1.40"],
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
  ["rome-septimius-severus", 194, "war", "击败尼格尔", "塞维鲁东进击败佩斯凯尼乌斯·尼格尔，掌握东方行省承认。", "rome-source-history-of-the-empire-after-marcus-herodian", "3.1-3.4"],
  ["rome-septimius-severus", 202, "reign", "王朝继承安排成形", "塞维鲁把皇权与军队、家族继承绑定，卡拉卡拉和盖塔的继承地位更加明确。", "rome-source-roman-history-cassius-dio", "76.15-76.17"],
  ["rome-caracalla", 213, "war", "莱茵与日耳曼战事", "卡拉卡拉在北方边境展开军事行动，强化其军人皇帝形象。", "rome-source-roman-history-cassius-dio", "78.13-78.14"],
  ["rome-caracalla", 217, "death", "东方行军途中遇刺", "卡拉卡拉在对帕提亚方向行动期间遇刺，马克里努斯随后取得皇位。", "rome-source-history-of-the-empire-after-marcus-herodian", "4.12-4.13"],
  ["rome-elagabalus", 221, "reign", "宗教与宫廷冲突加深", "埃拉伽巴路斯把埃梅萨神祇崇拜带入罗马政治核心，引发元老院和禁卫军反感。", "rome-source-history-of-the-empire-after-marcus-herodian", "5.5-5.7"],
  ["rome-gordian-i", 238, "death", "起义失败后自尽", "非洲起义迅速失败后，戈尔迪安一世自尽，六帝之年的动荡继续扩大。", "rome-source-history-of-the-empire-after-marcus-herodian", "7.9"],
  ["rome-pupienus", 238, "death", "被禁卫军杀害", "普皮恩努斯与巴尔比努斯共治关系紧张，最终同被禁卫军杀害。", "rome-source-history-of-the-empire-after-marcus-herodian", "8.8"],
  ["rome-balbinus", 238, "death", "与普皮恩努斯同死", "巴尔比努斯在罗马城内权力冲突中被禁卫军杀害，戈尔迪安三世成为唯一皇帝。", "rome-source-history-of-the-empire-after-marcus-herodian", "8.8"],
  ["rome-gordian-iii", 242, "war", "东方远征开始", "戈尔迪安三世在近臣和军队辅佐下发动东方远征，应对萨珊压力。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.2"],
  ["rome-philip-the-arab", 249, "death", "败于德西乌斯", "腓力在与德西乌斯的冲突中败亡，罗马再次进入军队拥立的新一轮更替。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.4"],
  ["rome-gallienus", 262, "reform", "依赖骑兵与机动军力", "加里恩努斯时期的军事调整强化机动反应能力，是三世纪危机后期恢复的一部分。", "rome-source-de-caesaribus-aurelius-victor", "33"],
  ["rome-claudius-ii", 270, "death", "疫病中去世", "克劳狄二世在短暂恢复军威后去世，奥勒良随后进入核心竞争。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.11"],
  ["rome-aurelian", 271, "war", "稳住多瑙河与意大利", "奥勒良先处理北方入侵和意大利安全问题，为随后东征和西征创造条件。", "rome-source-historia-augusta-scriptores-historiae-augustae", "Aurelian 18-22"],
  ["rome-aurelian", 274, "reform", "太阳神崇拜与帝国整合", "奥勒良用宗教和胜利仪式强调帝国重新统一后的中心权威。", "rome-source-historia-augusta-scriptores-historiae-augustae", "Aurelian 35"],
  ["rome-aurelian", 275, "death", "东方行军前遇害", "奥勒良在筹备新一轮东方行动时被近臣和军人谋杀。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.15"],
  ["rome-tacitus", 275, "accession", "奥勒良死后被推为皇帝", "塔西佗在奥勒良遇害后的权力空档中取得皇位。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.16"],
  ["rome-tacitus", 276, "death", "短暂在位后去世", "塔西佗统治时间很短，死后普罗布斯成为新的核心军人皇帝。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.16-9.17"],
  ["rome-probus", 277, "war", "清理高卢与莱茵压力", "普罗布斯在西方边境继续清理外部入侵和地方混乱。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.17"],
  ["rome-probus", 282, "death", "被军队杀害", "普罗布斯在军队不满中被杀，卡鲁斯随后称帝。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.17-9.18"],
  ["rome-carus", 283, "death", "东方远征途中死亡", "卡鲁斯东征取得进展后突然死亡，继承局势转向努梅里安和卡里努斯。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.18"],
  ["rome-numerian", 283, "accession", "随父东方远征后继位", "卡鲁斯死后，努梅里安在东方军队中继承皇位。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.18-9.20"],
  ["rome-numerian", 284, "death", "撤军途中死亡", "努梅里安在东方撤军途中死亡，军队随后拥立戴克里先。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.20"],
  ["rome-carinus", 283, "accession", "统治西部", "卡里努斯作为卡鲁斯之子在西部维持统治，与东方军队拥立的戴克里先对峙。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.19-9.20"],
  ["rome-carinus", 285, "death", "败于戴克里先阵营", "卡里努斯与戴克里先竞争失败，戴克里先成为帝国唯一奥古斯都。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.20"],
  ["rome-diocletian", 285, "war", "击败卡里努斯", "戴克里先击败卡里努斯后结束卡鲁斯家族的继承竞争。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.20"],
  ["rome-diocletian", 286, "reform", "任命马克西米安分担西部", "戴克里先把马克西米安提升为共治者，帝国东西分担治理开始制度化。", "rome-source-de-mortibus-persecutorum-lactantius", "7-8"],
  ["rome-diocletian", 301, "reform", "价格敕令", "戴克里先晚期用最高价格敕令尝试管控通货、军费和市场压力。", "rome-source-de-mortibus-persecutorum-lactantius", "7"],
  ["rome-maximian", 293, "reform", "成为西部奥古斯都核心", "四帝共治形成后，马克西米安负责西部军事和政治压力。", "rome-source-de-mortibus-persecutorum-lactantius", "7-8"],
  ["rome-maximian", 310, "death", "复出失败后死亡", "马克西米安退位后多次试图重返权力，最终在君士坦丁阵营压力下死亡。", "rome-source-de-mortibus-persecutorum-lactantius", "29-30"],
  ["rome-galerius", 311, "death", "临终宽容敕令后去世", "伽列里乌斯在晚年病重时发布宽容敕令，随后去世。", "rome-source-de-mortibus-persecutorum-lactantius", "33-35"],
  ["rome-severus-ii", 305, "accession", "成为西部凯撒", "戴克里先和马克西米安退位后，塞维鲁二世按四帝共治安排成为西部凯撒。", "rome-source-de-mortibus-persecutorum-lactantius", "18-19"],
  ["rome-severus-ii", 306, "war", "卷入马克森提乌斯危机", "马克森提乌斯起事后，塞维鲁二世受命压制罗马局势，但西部军队忠诚发生动摇。", "rome-source-de-mortibus-persecutorum-lactantius", "24-26"],
  ["rome-severus-ii", 307, "death", "被迫投降后死亡", "塞维鲁二世在对马克森提乌斯行动失败后被迫投降，随后死亡。", "rome-source-de-mortibus-persecutorum-lactantius", "26"],
  ["rome-maximinus-daia", 305, "accession", "成为东部凯撒", "马克西米努斯·达扎在 305 年继承安排中成为东部凯撒。", "rome-source-de-mortibus-persecutorum-lactantius", "18-19"],
  ["rome-maximinus-daia", 310, "reign", "争取奥古斯都地位", "四帝共治秩序破裂后，马克西米努斯·达扎要求更高名位并扩张东部权力。", "rome-source-de-mortibus-persecutorum-lactantius", "32"],
  ["rome-constantine", 307, "reign", "巩固高卢与不列颠基础", "君士坦丁被拥立后先稳住西北行省基础，与四帝共治旧秩序保持紧张关系。", "rome-source-de-mortibus-persecutorum-lactantius", "24-26"],
  ["rome-constantine", 310, "reign", "与马克西米安决裂", "君士坦丁镇压马克西米安复出企图，进一步巩固自己的西部权力。", "rome-source-de-mortibus-persecutorum-lactantius", "29-30"],
  ["rome-maxentius", 307, "war", "击退塞维鲁二世", "马克森提乌斯依靠罗马和意大利军政网络击退塞维鲁二世，四帝共治继承安排进一步崩解。", "rome-source-de-mortibus-persecutorum-lactantius", "24-26"],
  ["rome-maxentius", 308, "reign", "卡农图姆会议后仍据罗马", "卡农图姆会议试图重排合法名位，但马克森提乌斯仍控制罗马和意大利。", "rome-source-de-mortibus-persecutorum-lactantius", "29-30"],
  ["rome-julia-domna", 193, "reign", "成为塞维鲁王朝皇后", "塞维鲁夺取皇位后，尤利娅·多姆娜成为王朝宫廷的核心女性成员。", "rome-source-roman-history-cassius-dio", "76.15-76.17"],
  ["rome-julia-domna", 211, "crisis", "调停卡拉卡拉与盖塔失败", "塞维鲁死后，尤利娅·多姆娜处于两子共治冲突中心，兄弟共治很快破裂。", "rome-source-roman-history-cassius-dio", "78.2-78.4"],
  ["rome-julia-domna", 217, "death", "卡拉卡拉死后去世", "卡拉卡拉遇刺和马克里努斯上台后，尤利娅·多姆娜失去政治基础并去世。", "rome-source-roman-history-cassius-dio", "78.23-78.24"],
  ["rome-julia-maesa", 218, "accession", "推动埃拉伽巴路斯称帝", "尤利娅·玛伊萨利用塞维鲁家族声望和东方军队网络推动埃拉伽巴路斯取代马克里努斯。", "rome-source-history-of-the-empire-after-marcus-herodian", "5.3-5.4"],
  ["rome-julia-maesa", 221, "reign", "转向扶持亚历山大", "埃拉伽巴路斯失去支持后，尤利娅·玛伊萨推动亚历山大·塞维鲁成为继承选择。", "rome-source-history-of-the-empire-after-marcus-herodian", "5.7-5.8"],
  ["rome-julia-soaemias", 218, "accession", "随埃拉伽巴路斯入主罗马", "尤利娅·索艾米亚斯作为埃拉伽巴路斯之母进入皇权核心。", "rome-source-history-of-the-empire-after-marcus-herodian", "5.3-5.5"],
  ["rome-julia-soaemias", 222, "death", "与埃拉伽巴路斯同死", "222 年禁卫军杀死埃拉伽巴路斯，尤利娅·索艾米亚斯也一同遇害。", "rome-source-history-of-the-empire-after-marcus-herodian", "5.8"],
  ["rome-julia-mamaea", 222, "accession", "辅佐亚历山大·塞维鲁上台", "亚历山大·塞维鲁即位后，尤利娅·玛迈亚成为宫廷和政策运作中的关键人物。", "rome-source-history-of-the-empire-after-marcus-herodian", "5.8"],
  ["rome-julia-mamaea", 231, "war", "参与东方战争决策环境", "亚历山大·塞维鲁东征萨珊时，玛迈亚仍深度影响皇帝和宫廷决策。", "rome-source-history-of-the-empire-after-marcus-herodian", "6.2-6.6"],
  ["rome-julia-mamaea", 235, "death", "莱茵军营中被杀", "莱茵前线军队不满亚历山大和玛迈亚的统治方式，母子二人一同被杀。", "rome-source-history-of-the-empire-after-marcus-herodian", "6.8-6.9"],
  ["rome-macrianus", 260, "accession", "瓦勒良被俘后争夺东方", "瓦勒良被俘后，马克里亚努斯集团在东方军政真空中挑战加里恩努斯。", "rome-source-historia-nova-zosimus", "1.39-1.40"],
  ["rome-macrianus", 261, "death", "向西进攻失败", "马克里亚努斯势力向西挑战加里恩努斯失败，集团迅速瓦解。", "rome-source-historia-nova-zosimus", "1.40"],
  ["rome-quietus", 260, "accession", "东方割据称号", "奎埃图斯在瓦勒良被俘后的东方割据中获得皇帝称号。", "rome-source-historia-nova-zosimus", "1.39-1.40"],
  ["rome-quietus", 261, "death", "在东方失败身亡", "马克里亚努斯集团失败后，奎埃图斯也在东方局势中败亡。", "rome-source-historia-nova-zosimus", "1.40"],
  ["rome-tetricus", 271, "accession", "成为高卢帝国统治者", "维多利努斯之后，提特里库斯成为高卢帝国后期核心统治者。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.13"],
  ["rome-tetricus", 274, "deposition", "向奥勒良投降", "274 年奥勒良收复高卢时，提特里库斯投降，西部割据结束。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.13"],
  ["palmyra-odaenathus", 260, "reign", "东方危机中的罗马盟友", "瓦勒良被俘后，奥登纳图斯成为罗马东方秩序恢复的重要地方强人。", "rome-source-historia-nova-zosimus", "1.39-1.40"],
  ["palmyra-odaenathus", 267, "death", "被刺杀", "奥登纳图斯被刺杀后，帕尔米拉权力转入芝诺比娅和瓦巴拉图斯体系。", "rome-source-historia-nova-zosimus", "1.39-1.40"],
  ["palmyra-zenobia", 267, "accession", "掌握帕尔米拉权力", "奥登纳图斯死后，芝诺比娅以摄政和王权保护者身份控制帕尔米拉政权。", "rome-source-historia-augusta-scriptores-historiae-augustae", "Aurelian 24-26"],
  ["palmyra-zenobia", 270, "war", "扩张至埃及和东方", "芝诺比娅政权向埃及和叙利亚周边扩张，成为奥勒良必须处理的东方割据力量。", "rome-source-historia-nova-zosimus", "1.50-1.51"],
  ["rome-postumus", 261, "reign", "建立高卢政权制度", "波斯图穆斯在高卢建立独立的皇帝、执政官和军政体系，维持西部防务。", "rome-source-de-caesaribus-aurelius-victor", "33"],
  ["rome-postumus", 269, "death", "军队骚乱中被杀", "波斯图穆斯在西部割据政权内部军队冲突中被杀，高卢帝国进入继承动荡。", "rome-source-de-caesaribus-aurelius-victor", "33"],
  ["rome-carausius", 287, "reign", "控制海峡与不列颠", "卡劳修斯利用舰队和不列颠资源维持割据，使西部海防成为戴克里先体系的难题。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.21"],
  ["rome-carausius", 293, "death", "被阿莱克图斯杀害", "卡劳修斯被部下阿莱克图斯杀害，不列颠割据政权继续存在到 296 年。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.22"],
];

const personRelations = [
  ["rome-septimius-severus", "rome-julia-domna", "spouse", 187, 211, "塞普蒂米乌斯·塞维鲁与尤利娅·多姆娜的婚姻把叙利亚埃梅萨精英网络带入塞维鲁王朝核心。", "rome-source-roman-history-cassius-dio", "76.15-76.17"],
  ["rome-septimius-severus", "rome-caracalla", "family-successor", 188, 211, "卡拉卡拉为塞维鲁之子，塞维鲁晚年安排其进入继承结构并与盖塔共同继承。", "rome-source-roman-history-cassius-dio", "78.1-78.4"],
  ["rome-septimius-severus", "rome-geta", "family-successor", 189, 211, "盖塔为塞维鲁之子，与卡拉卡拉同为王朝继承安排的一部分。", "rome-source-roman-history-cassius-dio", "78.1-78.4"],
  ["rome-julia-domna", "rome-caracalla", "mother", 188, 217, "尤利娅·多姆娜是卡拉卡拉之母，塞维鲁死后仍处在王朝权力核心。", "rome-source-roman-history-cassius-dio", "78.2-78.24"],
  ["rome-julia-domna", "rome-geta", "mother", 189, 211, "尤利娅·多姆娜是盖塔之母，曾被卷入卡拉卡拉与盖塔的共治冲突。", "rome-source-roman-history-cassius-dio", "78.2-78.4"],
  ["rome-caracalla", "rome-geta", "succession-rival", 211, 211, "卡拉卡拉与盖塔短暂共治后迅速转为继承竞争，盖塔被杀。", "rome-source-roman-history-cassius-dio", "78.2-78.4"],
  ["rome-caracalla", "rome-macrinus", "assassination-succession", 217, 217, "卡拉卡拉遇刺后，禁卫军长官马克里努斯取得皇位。", "rome-source-history-of-the-empire-after-marcus-herodian", "4.12-5.1"],
  ["rome-julia-maesa", "rome-elagabalus", "dynastic-sponsor", 218, 222, "尤利娅·玛伊萨利用塞维鲁家族声望和东方军队网络推动埃拉伽巴路斯上台。", "rome-source-history-of-the-empire-after-marcus-herodian", "5.3-5.4"],
  ["rome-julia-soaemias", "rome-elagabalus", "mother", 204, 222, "尤利娅·索艾米亚斯是埃拉伽巴路斯之母，并随其进入罗马政治核心。", "rome-source-history-of-the-empire-after-marcus-herodian", "5.3-5.8"],
  ["rome-julia-maesa", "rome-alexander-severus", "dynastic-sponsor", 221, 224, "埃拉伽巴路斯失去支持后，尤利娅·玛伊萨转向扶持亚历山大·塞维鲁。", "rome-source-history-of-the-empire-after-marcus-herodian", "5.7-5.8"],
  ["rome-julia-mamaea", "rome-alexander-severus", "mother-regent", 208, 235, "尤利娅·玛迈亚是亚历山大·塞维鲁之母，在其统治中长期影响宫廷与政策。", "rome-source-history-of-the-empire-after-marcus-herodian", "6.1-6.9"],
  ["rome-alexander-severus", "rome-maximinus-thrax", "military-overthrow", 235, 235, "亚历山大·塞维鲁被军队杀害后，马克西米努斯·色雷克斯被拥立，三世纪危机进入新阶段。", "rome-source-history-of-the-empire-after-marcus-herodian", "6.8-6.9"],
  ["rome-maximinus-thrax", "rome-gordian-i", "civil-war-opponent", 238, 238, "非洲起义拥立戈尔迪安一世反对马克西米努斯，六帝之年由此展开。", "rome-source-history-of-the-empire-after-marcus-herodian", "7.5-7.9"],
  ["rome-gordian-i", "rome-gordian-ii", "father-son-co-ruler", 238, 238, "戈尔迪安二世为戈尔迪安一世之子，非洲起义中父子共同称帝。", "rome-source-history-of-the-empire-after-marcus-herodian", "7.5-7.9"],
  ["rome-pupienus", "rome-balbinus", "senatorial-co-ruler", 238, 238, "元老院拥立普皮恩努斯与巴尔比努斯共治，以对抗马克西米努斯。", "rome-source-history-of-the-empire-after-marcus-herodian", "7.10-8.8"],
  ["rome-pupienus", "rome-gordian-iii", "co-ruler-successor", 238, 238, "戈尔迪安三世在六帝之年成为年轻的继承中心，普皮恩努斯和巴尔比努斯死后独掌帝位。", "rome-source-history-of-the-empire-after-marcus-herodian", "8.8"],
  ["rome-balbinus", "rome-gordian-iii", "co-ruler-successor", 238, 238, "巴尔比努斯与普皮恩努斯共治失败后，戈尔迪安三世成为唯一皇帝。", "rome-source-history-of-the-empire-after-marcus-herodian", "8.8"],
  ["rome-gordian-iii", "rome-philip-the-arab", "succession", 244, 244, "戈尔迪安三世在东方战争背景下死亡后，腓力继位并与波斯议和。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.2-9.3"],
  ["rome-philip-the-arab", "rome-decius", "civil-war-opponent", 249, 249, "德西乌斯在军队政治中取代腓力，成为三世纪危机中又一次军队拥立的皇帝。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.4"],
  ["rome-valerian", "rome-gallienus", "father-son-co-ruler", 253, 260, "瓦勒良与其子加里恩努斯共治，分别面对东方和西方压力。", "rome-source-de-caesaribus-aurelius-victor", "33"],
  ["rome-valerian", "palmyra-odaenathus", "eastern-ally-after-capture", 260, 267, "瓦勒良被俘后，奥登纳图斯作为东方强人帮助罗马反击波斯并维持局势。", "rome-source-historia-nova-zosimus", "1.39-1.40"],
  ["rome-gallienus", "rome-postumus", "breakaway-rival", 260, 268, "加里恩努斯独自面对帝国分裂时，波斯图穆斯在高卢建立西部割据政权。", "rome-source-de-caesaribus-aurelius-victor", "33"],
  ["rome-gallienus", "rome-macrianus", "breakaway-rival", 260, 261, "瓦勒良被俘后，马克里亚努斯集团在东方挑战加里恩努斯。", "rome-source-historia-nova-zosimus", "1.39-1.40"],
  ["rome-macrianus", "rome-quietus", "breakaway-co-ruler", 260, 261, "马克里亚努斯与奎埃图斯同属瓦勒良被俘后的东方割据集团。", "rome-source-historia-nova-zosimus", "1.39-1.40"],
  ["rome-gallienus", "rome-claudius-ii", "succession", 268, 268, "加里恩努斯遇害后，克劳狄二世取得皇位并继续处理帝国危机。", "rome-source-historia-nova-zosimus", "1.40-1.41"],
  ["rome-claudius-ii", "rome-aurelian", "succession", 270, 270, "克劳狄二世死后，奥勒良进入皇位竞争并成为危机后期的恢复者。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.11-9.13"],
  ["palmyra-odaenathus", "palmyra-zenobia", "spouse-successor", 267, 272, "奥登纳图斯死后，芝诺比娅执掌帕尔米拉权力并扩大东方割据。", "rome-source-historia-augusta-scriptores-historiae-augustae", "Aurelian 24-30"],
  ["rome-aurelian", "palmyra-zenobia", "campaign-opponent", 272, 272, "奥勒良东征击败芝诺比娅，恢复罗马东方控制。", "rome-source-historia-nova-zosimus", "1.50-1.61"],
  ["rome-aurelian", "rome-tetricus", "campaign-opponent", 274, 274, "奥勒良收复高卢时，提特里库斯投降，西部割据结束。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.13"],
  ["rome-aurelian", "rome-tacitus", "succession", 275, 275, "奥勒良遇害后，塔西佗在权力空档中取得皇位。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.15-9.16"],
  ["rome-tacitus", "rome-probus", "succession", 276, 276, "塔西佗短暂在位后，普罗布斯成为新的核心军人皇帝。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.16-9.17"],
  ["rome-probus", "rome-carus", "succession", 282, 282, "普罗布斯被军队杀害后，卡鲁斯称帝并发动东方远征。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.17-9.18"],
  ["rome-carus", "rome-numerian", "father-son-successor", 253, 284, "努梅里安为卡鲁斯之子，卡鲁斯死后在东方继承皇位。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.18-9.20"],
  ["rome-carus", "rome-carinus", "father-son-successor", 250, 285, "卡里努斯为卡鲁斯之子，在西部继承并与戴克里先竞争。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.19-9.20"],
  ["rome-numerian", "rome-diocletian", "succession-crisis", 284, 284, "努梅里安死亡后，东方军队拥立戴克里先，继承危机转向与卡里努斯的竞争。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.20"],
  ["rome-diocletian", "rome-carinus", "civil-war-opponent", 285, 285, "戴克里先击败卡里努斯后成为帝国唯一奥古斯都。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.20"],
  ["rome-diocletian", "rome-maximian", "tetrarchic-co-ruler", 286, 305, "戴克里先提升马克西米安分担西部压力，四帝共治的双奥古斯都基础形成。", "rome-source-de-mortibus-persecutorum-lactantius", "7-8"],
  ["rome-diocletian", "rome-galerius", "tetrarchic-caesar", 293, 305, "伽列里乌斯成为东部凯撒，构成戴克里先体系下的继承与军政分担结构。", "rome-source-de-mortibus-persecutorum-lactantius", "18-19"],
  ["rome-maximian", "rome-constantius-chlorus", "tetrarchic-caesar", 293, 305, "君士坦提乌斯成为西部凯撒，名义上服务于马克西米安的西部奥古斯都体系。", "rome-source-de-mortibus-persecutorum-lactantius", "7-8"],
  ["rome-constantius-chlorus", "rome-constantine", "father-son-successor", 272, 306, "君士坦提乌斯死于不列颠后，军队拥立其子君士坦丁。", "rome-source-de-mortibus-persecutorum-lactantius", "24-26"],
  ["rome-galerius", "rome-maximinus-daia", "tetrarchic-caesar", 305, 311, "305 年后马克西米努斯·达扎成为东部凯撒，并在四帝共治崩解中追求更高名位。", "rome-source-de-mortibus-persecutorum-lactantius", "18-19"],
  ["rome-galerius", "rome-severus-ii", "tetrarchic-colleague", 305, 307, "塞维鲁二世按 305 年继承安排成为西部凯撒，伽列里乌斯在新体系中居于关键地位。", "rome-source-de-mortibus-persecutorum-lactantius", "18-26"],
  ["rome-severus-ii", "rome-maxentius", "succession-conflict", 306, 307, "马克森提乌斯起事后，塞维鲁二世奉命压制但失败，西部继承秩序进一步崩解。", "rome-source-de-mortibus-persecutorum-lactantius", "24-26"],
  ["rome-maximian", "rome-maxentius", "father-son-ally", 306, 308, "马克西米安退位后卷入其子马克森提乌斯的罗马政权，使四帝共治合法性更复杂。", "rome-source-de-mortibus-persecutorum-lactantius", "24-30"],
  ["rome-constantine", "rome-maximian", "ally-to-rival", 307, 310, "君士坦丁曾借助马克西米安的政治声望，后在马克西米安复出失败中与其决裂。", "rome-source-de-mortibus-persecutorum-lactantius", "29-30"],
  ["rome-carausius", "rome-allectus", "usurpation-successor", 293, 293, "阿莱克图斯杀卡劳修斯后继续控制不列颠割据政权。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.22"],
  ["rome-constantius-chlorus", "rome-allectus", "campaign-opponent", 296, 296, "君士坦提乌斯击败阿莱克图斯，收复不列颠。", "rome-source-breviarium-ab-urbe-condita-eutropius", "9.22"],
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
  const insertRelation = db.prepare(`
    INSERT INTO person_relations (id, source_person_id, target_person_id, type, start_year, end_year, summary, confidence, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'medium', ?)
    ON CONFLICT(id) DO UPDATE SET
      source_person_id=excluded.source_person_id, target_person_id=excluded.target_person_id, type=excluded.type,
      start_year=excluded.start_year, end_year=excluded.end_year, summary=excluded.summary, confidence=excluded.confidence,
      raw_json=excluded.raw_json
  `);
  const insertRelationRef = db.prepare(`
    INSERT INTO person_relation_source_refs (relation_id, source_id, locator, raw_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(relation_id, source_id, locator) DO UPDATE SET raw_json=excluded.raw_json
  `);
  const deleteLife = db.prepare("DELETE FROM person_life_events WHERE id LIKE 'rome-life:%'");
  const deleteRefs = db.prepare("DELETE FROM person_life_event_source_refs WHERE life_event_id LIKE 'rome-life:%'");
  const deleteRelationRefs = db.prepare("DELETE FROM person_relation_source_refs WHERE relation_id LIKE 'rome-relation:%'");
  const deleteRelations = db.prepare("DELETE FROM person_relations WHERE id LIKE 'rome-relation:%'");
  const insertChunkEntity = db.prepare(`
    INSERT INTO document_chunk_entities (chunk_id, entity_id, link_role, sort_order)
    VALUES (?, ?, 'mentioned', ?)
    ON CONFLICT(chunk_id, entity_id, link_role) DO UPDATE SET sort_order=excluded.sort_order
  `);

  db.exec("BEGIN;");
  deleteRefs.run();
  deleteLife.run();
  deleteRelationRefs.run();
  deleteRelations.run();
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

  for (const [sourcePersonId, targetPersonId, type, startYear, endYear, summary, sourceId, locator] of personRelations) {
    const relationId = `rome-relation:${sourcePersonId}:${targetPersonId}:${type}`;
    insertRelation.run(
      relationId,
      sourcePersonId,
      targetPersonId,
      type,
      startYear,
      endYear,
      summary,
      json({ batchId, id: relationId, sourcePersonId, targetPersonId, type, startYear, endYear, summary, sourceRefs: [{ sourceId, locator }] }),
    );
    insertRelationRef.run(relationId, sourceId, locator, json({ batchId }));
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
