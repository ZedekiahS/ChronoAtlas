const entries = [];

function assign(personId, role, eventIds) {
  eventIds.forEach((eventId) => entries.push({ personId, eventId, role }));
}

assign("han-xiandi", "affected", [
  "china-189-dong-zhuo-enters-luoyang",
  "china-192-dong-zhuo-killed",
  "china-196-cao-cao-escorts-emperor",
  "china-220-cao-pi-founds-wei",
]);
assign("han-xiandi", "subject", ["china-220-cao-pi-accepts-abdication"]);

assign("cao-pi", "subject", [
  "china-220-cao-pi-accepts-abdication",
  "china-220-cao-pi-founds-wei",
]);

assign("liu-bei", "participant", [
  "china-194-tao-qian-yields-xuzhou",
  "china-199-lu-bu-defeated",
  "china-208-red-cliffs",
  "china-208-sun-liu-alliance-formed",
  "china-208-zhuge-liang-envoy-to-sun-quan",
  "china-214-liu-zhang-surrenders-yizhou",
  "china-222-yiling",
]);
assign("liu-bei", "affected", [
  "china-196-lu-bu-seizes-xuzhou",
  "china-208-liu-cong-surrenders-jingzhou",
  "china-222-lu-xun-fire-attack-yiling",
]);
assign("liu-bei", "subject", [
  "china-207-longzhong-plan",
  "china-214-liu-bei-takes-yi",
  "china-219-hanzhong-and-jingzhou-crisis",
  "china-219-liu-bei-king-of-hanzhong",
  "china-221-liu-bei-founds-shu",
]);
assign("liu-bei", "mentioned-source", ["china-215-cao-cao-takes-hanzhong"]);

assign("sun-quan", "ruler", [
  "china-208-red-cliffs",
  "china-208-sun-liu-alliance-formed",
  "china-222-lu-xun-fire-attack-yiling",
  "china-222-yiling",
  "china-226-jiaozhou-incorporated-by-wu",
]);
assign("sun-quan", "recipient", ["china-208-zhuge-liang-envoy-to-sun-quan"]);
assign("sun-quan", "ordered-by", ["china-219-guan-yu-defeated-by-sun-quan"]);
assign("sun-quan", "participant", ["china-219-hanzhong-and-jingzhou-crisis"]);
assign("sun-quan", "subject", ["china-229-sun-quan-emperor"]);
assign("sun-quan", "mentioned-source", ["china-215-cao-cao-takes-hanzhong"]);

assign("cao-cao", "participant", [
  "china-190-coalition-against-dong-zhuo",
  "china-190-yuan-shao-coalition-leader",
  "china-200-guan-yu-slays-yan-liang",
  "china-219-hanzhong-and-jingzhou-crisis",
]);
assign("cao-cao", "affected", ["china-194-lu-bu-seizes-yan"]);
assign("cao-cao", "subject", [
  "china-196-cao-cao-escorts-emperor",
  "china-215-cao-cao-takes-hanzhong",
]);
assign("cao-cao", "victor", ["china-199-lu-bu-defeated"]);
assign("cao-cao", "commander", [
  "china-200-cao-cao-raids-wuchao",
  "china-200-guandu",
  "china-208-red-cliffs",
]);
assign("cao-cao", "recipient", [
  "china-208-liu-cong-surrenders-jingzhou",
  "china-215-zhang-lu-surrenders-hanzhong",
]);
assign("cao-cao", "mentioned-source", [
  "china-199-yuan-shu-collapse",
  "china-219-liu-bei-king-of-hanzhong",
  "china-220-cao-pi-founds-wei",
]);

assign("zhuge-liang", "subject", [
  "china-207-longzhong-plan",
  "china-208-zhuge-liang-envoy-to-sun-quan",
  "china-234-wuzhang-plains",
]);
assign("zhuge-liang", "participant", [
  "china-208-red-cliffs",
  "china-208-sun-liu-alliance-formed",
  "china-214-liu-bei-takes-yi",
  "china-221-liu-bei-founds-shu",
]);

assign("sima-yi", "commander", ["china-234-wuzhang-plains"]);
assign("sima-yi", "mentioned-source", ["china-265-jin-replaces-wei"]);

assign("shi-le", "participant", ["china-309-han-zhao-attacks-luoyang"]);
assign("shi-le", "commander", [
  "official-history-event:95e17726f9114da1f306",
  "official-history-event:d1f64d24c6f82686db92",
  "official-history-event:fdef77fb53584e68cbbb",
]);
assign("shi-le", "defeated", [
  "official-history-event:16da2c507e1101982c81",
  "official-history-event:320f2a3e5a85aa67b2b3",
]);
assign("shi-le", "recipient", ["official-history-event:da84fcb2b65be8ece7bb"]);
assign("shi-le", "subject", ["china-312-shi-le-occupies-xiangguo"]);
assign("shi-le", "victor", [
  "china-311-ningping-disaster",
  "official-history-event:b6977baf97c78cb8e062",
  "china-329-later-zhao-destroys-former-zhao",
]);
assign("shi-le", "ordered-by", ["official-history-event:c632510fdf76b9bd7c61"]);

export const pilotPersonIds = [
  "han-xiandi",
  "cao-pi",
  "liu-bei",
  "sun-quan",
  "cao-cao",
  "zhuge-liang",
  "sima-yi",
  "shi-le",
];

export const personAnnualPilotRoleDecisions = entries;
