export const profileId = "china-western-han-jingdi--156--141-v1";
export const batchId = "auto-hanshu-western-han-jingdi--156--141-candidates";
export const periodId = "china-western-han--202--9";
export const generator = "official-history-candidate-repair:western-han-jingdi--156--141-v1";

export const canonicalPeople = [
  {
    "id": "han-liu-qi",
    "name": "刘启",
    "aliases": [
      "景帝"
    ],
    "primaryPolity": "西汉",
    "summary": "西汉第六位皇帝。"
  },
  {
    "id": "han-liu-rong",
    "name": "刘荣",
    "aliases": [
      "临江王荣"
    ],
    "primaryPolity": "西汉",
    "summary": "景帝长子，曾为皇太子。"
  },
  {
    "id": "han-zhou-yafu",
    "name": "周亚夫",
    "aliases": [
      "条侯"
    ],
    "primaryPolity": "西汉",
    "summary": "西汉将领与丞相，参与平定七国之乱。"
  },
  {
    "id": "han-wang-zhi",
    "name": "王娡",
    "aliases": [
      "王氏",
      "王皇后"
    ],
    "primaryPolity": "西汉",
    "summary": "景帝皇后，汉武帝生母。"
  }
];

export const decisions = [
  {
    "cardId": "card:hanshu-western-han-jingdi--156--141:981e16fe66742014f6d9b1db",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-jingdi--156--141:3ef7d6e92f883c17ee92fc54",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-jingdi--156--141:0dd9730fea7c2b8f5a37c2c9",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-jingdi--156--141:10896d78739e2612170cf3fd",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "七国之乱平定",
    "allowCollectiveEvent": true,
    "matchedEventId": "china-154-rebellion-seven-states",
    "personBindings": [
      {
        "personId": "han-liu-qi",
        "canonicalName": "刘启",
        "sourceNames": [
          "帝"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-jingdi--156--141:8e0e4213b2e977ff22b51154",
    "disposition": "reject",
    "reason": "The unnamed death notice is not Jingdi and cannot be promoted without a stable subject."
  },
  {
    "cardId": "card:hanshu-western-han-jingdi--156--141:1045930b4b8977b3623fd089",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "刘荣被立为皇太子",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-liu-rong",
        "canonicalName": "刘荣",
        "sourceNames": [
          "荣",
          "皇子荣"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-jingdi--156--141:c7cc116c981e516dd99279ce",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-jingdi--156--141:b3e1f53d6a4a33ab1dc34ec0",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "薄氏皇后被废",
    "allowCollectiveEvent": true
  },
  {
    "cardId": "card:hanshu-western-han-jingdi--156--141:8043cd740d465367b4ec5cab",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "梁国分为五国",
    "allowCollectiveEvent": true
  },
  {
    "cardId": "card:hanshu-western-han-jingdi--156--141:a0172a27a5234d38312e5b45",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "周亚夫下狱而死",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-zhou-yafu",
        "canonicalName": "周亚夫",
        "sourceNames": [
          "条侯周亚夫",
          "条侯"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-jingdi--156--141:34ecd1736f54ce4da3f5bd2d",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "刘荣被废为临江王",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-liu-rong",
        "canonicalName": "刘荣",
        "sourceNames": [
          "太子荣",
          "皇太子荣"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-jingdi--156--141:13157ebe8664e24aa773ef10",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "王娡被立为皇后",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-wang-zhi",
        "canonicalName": "王娡",
        "sourceNames": [
          "皇后王氏",
          "王氏"
        ]
      }
    ],
    "removePersonNames": [
      "宣帝王皇后",
      "孝平皇后王氏"
    ]
  },
  {
    "cardId": "card:hanshu-western-han-jingdi--156--141:62e3ba773defdb18225776ae",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "刘彻被立为皇太子",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-liu-che",
        "canonicalName": "刘彻",
        "sourceNames": [
          "胶东王彻",
          "彻"
        ]
      }
    ]
  }
];

export default { profileId, batchId, periodId, generator, coverageMode: "complete", canonicalPeople, decisions, batchNotes: "Adjudicated Jingdi annal candidates; false cross-era Wang aliases are replaced with Wang Zhi." };
