export const profileId = "china-western-han-gaozu--202--195-v1";
export const batchId = "auto-hanshu-western-han-gaozu--202--195-candidates";
export const periodId = "china-western-han--202--9";
export const generator = "official-history-candidate-repair:western-han-gaozu--202--195-v1";

export const canonicalPeople = [
  {
    "id": "han-liu-bang",
    "name": "刘邦",
    "aliases": [
      "高祖",
      "汉王"
    ],
    "primaryPolity": "西汉",
    "summary": "西汉开国皇帝。"
  },
  {
    "id": "han-xiang-yu",
    "name": "项羽",
    "aliases": [
      "羽"
    ],
    "primaryPolity": "楚",
    "summary": "楚汉战争时期的楚军领袖。"
  },
  {
    "id": "han-han-xin",
    "name": "韩信",
    "aliases": [
      "淮阴侯"
    ],
    "primaryPolity": "西汉",
    "summary": "西汉初年将领，后被诛。"
  },
  {
    "id": "han-zhang-ao",
    "name": "张敖",
    "aliases": [
      "赵王敖"
    ],
    "primaryPolity": "西汉",
    "summary": "西汉赵王，后被废。"
  },
  {
    "id": "han-liu-chang",
    "name": "刘长",
    "aliases": [
      "淮南王长"
    ],
    "primaryPolity": "西汉",
    "summary": "西汉淮南王。"
  },
  {
    "id": "han-ying-bu",
    "name": "英布",
    "aliases": [
      "淮南王布"
    ],
    "primaryPolity": "西汉",
    "summary": "西汉异姓诸侯王，后起兵反汉。"
  },
  {
    "id": "han-liu-bi",
    "name": "刘濞",
    "aliases": [
      "吴王濞"
    ],
    "primaryPolity": "西汉",
    "summary": "西汉吴王。"
  },
  {
    "id": "han-peng-yue",
    "name": "彭越",
    "aliases": [
      "梁王彭越"
    ],
    "primaryPolity": "西汉",
    "summary": "西汉异姓诸侯王，后被诛。"
  }
];

export const decisions = [
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:bb6c1fd04184d0c6900c81c4",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "垓下之战与项羽败亡",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-liu-bang",
        "canonicalName": "刘邦",
        "sourceNames": [
          "汉王"
        ]
      },
      {
        "personId": "han-xiang-yu",
        "canonicalName": "项羽",
        "sourceNames": [
          "羽"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:b6857a6d4520494bcf9aab39",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:9a31963320b5e3da4e09f87e",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:fca93805959124f844d4c854",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:7e5c4c8e4fb290071f79a0cc",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:ae4464f4430201cf1376e60d",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:3dc6918a630b47789b6cde14",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "刘邦即皇帝位，西汉建立",
    "allowCollectiveEvent": true,
    "matchedEventId": "china-202-han-founded",
    "personBindings": [
      {
        "personId": "han-liu-bang",
        "canonicalName": "刘邦",
        "sourceNames": [
          "汉王"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:bbc77d98ce120dd2a2854c09",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:67273fa6e3cd5577dbdcd616",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "楚王韩信被告谋反",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-han-xin",
        "canonicalName": "韩信",
        "sourceNames": [
          "楚王信",
          "信"
        ]
      }
    ],
    "removePersonNames": [
      "左右爭欲",
      "左右争欲"
    ]
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:699272e347ccafdf694303ae",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:23d2441a32d633909cd11841",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "刘邦征讨韩王信",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-liu-bang",
        "canonicalName": "刘邦",
        "sourceNames": [
          "上"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:5b9769c52e810a3ad8caf455",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:123f77d6aa0c62c499a0a516",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:6dc015388354f89bf24d5532",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:c25185d075454653fc1d3bd6",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "赵王张敖被废为宣平侯",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-zhang-ao",
        "canonicalName": "张敖",
        "sourceNames": [
          "赵王敖",
          "敖"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:f83fdaf3f021accc4a2d9212",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:b3b3bae1afd6e0b6d32768cd",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:848720128accc0e403660978",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:799c5056705528eddd7605f2",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "韩信谋反被诛",
    "allowCollectiveEvent": true,
    "matchedEventId": "china-196-han-xin-killed",
    "personBindings": [
      {
        "personId": "han-han-xin",
        "canonicalName": "韩信",
        "sourceNames": [
          "淮阴侯韩信"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:b24bde04d0b379c6483afa17",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:bf2e1ac7fe84d39bd269835e",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:c4fb016790b36b2f47ff8e14",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "彭越谋反被诛",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-peng-yue",
        "canonicalName": "彭越",
        "sourceNames": [
          "梁王彭越",
          "彭越"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:172c7299035af0dbc206ec57",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:c68dc3a6f69495a3a3d4497f",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "刘长被立为淮南王",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-liu-chang",
        "canonicalName": "刘长",
        "sourceNames": [
          "子长",
          "长"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:07306d9b9018d7521690c1ed",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "英布起兵反汉",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-ying-bu",
        "canonicalName": "英布",
        "sourceNames": [
          "布"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:ba0700aa3e3969a56fe4835f",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:b943d211ad584644b016331f",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "英布之乱平定",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-ying-bu",
        "canonicalName": "英布",
        "sourceNames": [
          "布"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:9a72d632e1397656740f1ed8",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:8983da67de6f5bcc61c65f3a",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "刘濞被立为吴王",
    "allowCollectiveEvent": true,
    "personBindings": [
      {
        "personId": "han-liu-bi",
        "canonicalName": "刘濞",
        "sourceNames": [
          "濞",
          "沛侯濞"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:3c1ff7a82e33e805d79a236b",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:2652d21e3a13102c68c6d99f",
    "disposition": "promote",
    "reason": "Explicit annal action with a stable event boundary and reviewed chronology.",
    "title": "高祖去世",
    "allowCollectiveEvent": true,
    "matchedEventId": "life:western-han-life:han-liu-bang:-195:death",
    "personBindings": [
      {
        "personId": "han-liu-bang",
        "canonicalName": "刘邦",
        "sourceNames": [
          "帝",
          "高祖"
        ]
      }
    ]
  },
  {
    "cardId": "card:hanshu-western-han-gaozu--202--195:98dabccf1180399698128c61",
    "disposition": "context",
    "reason": "Routine office, death notice, duplicate fragment, or insufficiently bounded context."
  }
];

export default { profileId, batchId, periodId, generator, coverageMode: "complete", canonicalPeople, decisions, batchNotes: "Adjudicated Gaozu annal candidates for 202-195 BCE; explicit political and military actions promoted." };
