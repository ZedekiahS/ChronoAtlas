import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleDot,
  MapPinned,
  Network,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import "./cao-family-atlas.css";

type FamilyYear = 190 | 200 | 208 | 220 | 226;

type FamilyMemberSnapshot = {
  name: string;
  place: string;
  office: string;
  basis: string;
  confidence: "高" | "中" | "低";
};

type FamilyPlaceSnapshot = {
  label: string;
  detail: string;
  status: "confirmed" | "continuous" | "uncertain" | "pending";
  x: number;
  y: number;
};

type FamilySnapshot = {
  members: FamilyMemberSnapshot[];
  places: FamilyPlaceSnapshot[];
  note: string;
};

type InfluenceRow = {
  id: string;
  label: string;
  description: string;
  evidence: number;
  confidence: "高" | "中";
};

type CaoFamilyAtlasProps = {
  year: number;
  onOpenPerson: (personId: string) => void;
  onOpenPeopleIndex: () => void;
  onOpenEvidence: () => void;
  onOpenGraph: () => void;
};

const familyYears: FamilyYear[] = [190, 200, 208, 220, 226];

const familySnapshots: Record<FamilyYear, FamilySnapshot> = {
  190: {
    members: [
      { name: "曹操", place: "陈留", office: "奋武将军", basis: "《三国志·武帝纪》", confidence: "高" },
      { name: "曹嵩", place: "琅邪", office: "太尉致仕", basis: "《后汉书》", confidence: "中" },
      { name: "曹昂", place: "待考", office: "宗子", basis: "家世旁证", confidence: "低" },
      { name: "曹丕", place: "谯县", office: "宗子", basis: "本传纪年", confidence: "中" },
    ],
    places: [
      { label: "陈留", detail: "曹操 · 190", status: "confirmed", x: 49, y: 54 },
      { label: "琅邪", detail: "曹嵩 · 存疑", status: "uncertain", x: 73, y: 58 },
      { label: "谯县", detail: "曹氏家籍", status: "confirmed", x: 55, y: 72 },
      { label: "待考", detail: "曹昂", status: "pending", x: 36, y: 68 },
    ],
    note: "讨董节点可定位曹操于陈留；其余成员仅保留离散旁证。",
  },
  200: {
    members: [
      { name: "曹操", place: "官渡", office: "司空 · 行车骑将军", basis: "《三国志·武帝纪》", confidence: "高" },
      { name: "曹丕", place: "许都", office: "司空府宗子", basis: "本传与纪年", confidence: "中" },
      { name: "曹彰", place: "待考", office: "宗子", basis: "无连续记载", confidence: "低" },
      { name: "曹植", place: "待考", office: "宗子", basis: "无连续记载", confidence: "低" },
    ],
    places: [
      { label: "官渡", detail: "曹操 · 200", status: "confirmed", x: 51, y: 45 },
      { label: "许都", detail: "朝廷中枢", status: "continuous", x: 45, y: 59 },
      { label: "邺城", detail: "战后进入", status: "uncertain", x: 53, y: 31 },
      { label: "待考", detail: "曹彰、曹植", status: "pending", x: 34, y: 71 },
    ],
    note: "官渡有明确纪年；曹氏诸子在该节点的位置不作连续推断。",
  },
  208: {
    members: [
      { name: "曹操", place: "江陵", office: "丞相", basis: "《三国志·武帝纪》", confidence: "高" },
      { name: "曹丕", place: "邺城", office: "宗子", basis: "家属驻地旁证", confidence: "中" },
      { name: "曹彰", place: "待考", office: "宗子", basis: "无直接纪年", confidence: "低" },
      { name: "曹植", place: "邺城", office: "宗子", basis: "邺下活动旁证", confidence: "中" },
    ],
    places: [
      { label: "江陵", detail: "曹操 · 208", status: "confirmed", x: 55, y: 69 },
      { label: "邺城", detail: "曹氏家属 · 存疑", status: "uncertain", x: 54, y: 31 },
      { label: "赤壁", detail: "战事节点", status: "confirmed", x: 65, y: 76 },
      { label: "待考", detail: "曹彰", status: "pending", x: 31, y: 62 },
    ],
    note: "仅标出南征与赤壁相关节点，不连接邺城、江陵与赤壁之间的移动路径。",
  },
  220: {
    members: [
      { name: "曹操", place: "洛阳", office: "魏王 · 丞相", basis: "《三国志》", confidence: "高" },
      { name: "曹丕", place: "邺城", office: "魏王世子", basis: "纪年条目", confidence: "高" },
      { name: "曹彰", place: "长安", office: "越骑将军", basis: "本传记载", confidence: "中" },
      { name: "曹植", place: "临淄", office: "临淄侯", basis: "封国记载", confidence: "中" },
    ],
    places: [
      { label: "洛阳", detail: "曹操 · 220", status: "confirmed", x: 43, y: 52 },
      { label: "邺城", detail: "213–220", status: "continuous", x: 54, y: 33 },
      { label: "长安", detail: "曹彰 · 存疑", status: "uncertain", x: 24, y: 51 },
      { label: "临淄", detail: "曹植 · 封国", status: "confirmed", x: 72, y: 45 },
    ],
    note: "邺城具连续史料区间；长安条目保留冲突提示，不补绘移动路线。",
  },
  226: {
    members: [
      { name: "曹丕", place: "洛阳", office: "魏帝", basis: "《三国志·文帝纪》", confidence: "高" },
      { name: "曹植", place: "雍丘", office: "雍丘王", basis: "《陈思王植传》", confidence: "高" },
      { name: "曹彰", place: "—", office: "已故（223）", basis: "《任城威王彰传》", confidence: "高" },
      { name: "曹操", place: "高陵", office: "魏武帝（追尊）", basis: "陵寝与追尊记载", confidence: "中" },
    ],
    places: [
      { label: "洛阳", detail: "曹丕 · 226", status: "confirmed", x: 43, y: 52 },
      { label: "雍丘", detail: "曹植 · 224–226", status: "continuous", x: 52, y: 61 },
      { label: "邺城", detail: "宗族旧基", status: "confirmed", x: 54, y: 33 },
      { label: "待考", detail: "其他支系", status: "pending", x: 31, y: 70 },
    ],
    note: "曹丕卒年节点与曹植封国区间可定位；其他支系未作插值。",
  },
};

const influenceByYear: Record<FamilyYear, InfluenceRow[]> = {
  190: [
    { id: "court", label: "朝廷任职", description: "奋武将军起兵，尚未进入朝廷中枢", evidence: 4, confidence: "中" },
    { id: "military", label: "军事统辖", description: "陈留起兵与关东联军节点", evidence: 6, confidence: "高" },
    { id: "territory", label: "封国与地域", description: "谯县家籍，陈留为军事起点", evidence: 3, confidence: "中" },
    { id: "marriage", label: "婚姻继承", description: "宗子序列形成，继承格局未定", evidence: 2, confidence: "中" },
  ],
  200: [
    { id: "court", label: "朝廷任职", description: "司空府与许都朝廷相互嵌合", evidence: 8, confidence: "高" },
    { id: "military", label: "军事统辖", description: "官渡主力与兖豫军政体系", evidence: 10, confidence: "高" },
    { id: "territory", label: "封国与地域", description: "许都中枢，河北控制逐步扩张", evidence: 5, confidence: "中" },
    { id: "marriage", label: "婚姻继承", description: "诸子成长，尚无正式世子", evidence: 3, confidence: "中" },
  ],
  208: [
    { id: "court", label: "朝廷任职", description: "丞相府制度成形，权力集中", evidence: 10, confidence: "高" },
    { id: "military", label: "军事统辖", description: "荆州水陆军与北方主力南下", evidence: 13, confidence: "高" },
    { id: "territory", label: "封国与地域", description: "邺城为北方根基，荆州控制短暂", evidence: 7, confidence: "中" },
    { id: "marriage", label: "婚姻继承", description: "曹丕、曹植进入继承竞争前期", evidence: 4, confidence: "中" },
  ],
  220: [
    { id: "court", label: "朝廷任职", description: "丞相、魏公、魏王体系", evidence: 12, confidence: "高" },
    { id: "military", label: "军事统辖", description: "中军与诸州军务", evidence: 11, confidence: "高" },
    { id: "territory", label: "封国与地域", description: "邺城、临淄等封国线索", evidence: 8, confidence: "中" },
    { id: "marriage", label: "婚姻继承", description: "世子与宗亲继承脉络", evidence: 5, confidence: "中" },
  ],
  226: [
    { id: "court", label: "朝廷任职", description: "魏帝与宗室官爵体系完成代际转换", evidence: 14, confidence: "高" },
    { id: "military", label: "军事统辖", description: "宗亲都督与辅政集团接续", evidence: 12, confidence: "高" },
    { id: "territory", label: "封国与地域", description: "雍丘、邺城等宗室封国并存", evidence: 10, confidence: "中" },
    { id: "marriage", label: "婚姻继承", description: "曹叡继位，曹植支系受封约束", evidence: 8, confidence: "中" },
  ],
};

const familyNodes = [
  { id: "cao-ang", name: "曹昂", courtesy: "子脩", life: "?–197" },
  { id: "cao-pi", name: "曹丕", courtesy: "子桓", life: "187–226" },
  { id: "cao-zhang", name: "曹彰", courtesy: "子文", life: "?–223" },
  { id: "cao-zhi", name: "曹植", courtesy: "子建", life: "192–232" },
];

function ConfidenceBadge({ value }: { value: "高" | "中" | "低" }) {
  return <span className={`cao-confidence confidence-${value}`}>{value}</span>;
}

export function CaoFamilyAtlas({
  year,
  onOpenPerson,
  onOpenPeopleIndex,
  onOpenEvidence,
  onOpenGraph,
}: CaoFamilyAtlasProps) {
  const [panoramaOpen, setPanoramaOpen] = useState(false);
  const [activeYear, setActiveYear] = useState<FamilyYear>(() =>
    familyYears.includes(year as FamilyYear) ? year as FamilyYear : 220,
  );
  const snapshot = familySnapshots[activeYear];
  const influenceRows = influenceByYear[activeYear];

  return (
    <section className="cao-family-atlas" data-testid="cao-family-atlas" aria-label="曹操家族谱系与史料定位">
      <header className="cao-family-profile">
        <div className="cao-family-profile-copy">
          <div className="cao-family-eyebrow">
            <UsersRound size={15} aria-hidden="true" />
            <span>人物详情</span>
            <i aria-hidden="true" />
            <span>曹氏家族档案</span>
          </div>
          <h2>曹操 · 孟德</h2>
          <p>东汉末年政治家、军事家，魏政权奠基者。</p>
          <div className="cao-family-tags" aria-label="人物身份">
            <span>东汉丞相</span>
            <span>魏公</span>
            <span>魏王</span>
            <span>武平侯</span>
          </div>
        </div>
        <div className="cao-family-profile-side">
          <strong>155–220</strong>
          <div className="cao-family-profile-actions">
            <button type="button" onClick={onOpenPeopleIndex}>
              <UsersRound size={14} aria-hidden="true" />
              人物索引
            </button>
            <button type="button" onClick={onOpenEvidence}>
              <BookOpen size={14} aria-hidden="true" />
              史料
            </button>
            <button type="button" onClick={onOpenGraph}>
              <Network size={14} aria-hidden="true" />
              图谱
            </button>
          </div>
        </div>
      </header>

      <nav className="cao-family-tabs" aria-label="人物详情模块">
        <span>人物史料提及</span>
        <span>生平年表</span>
        <span className="selected">
          <Network size={14} aria-hidden="true" />
          时空家族图
        </span>
        <small>家族成员与势力分布随史料节点更新</small>
      </nav>

      <div className="cao-family-toolbar">
        <div>
          <span>当前史料节点</span>
          <strong>{activeYear} 年</strong>
          <small>{activeYear === 220 ? "建安二十五年 / 延康元年" : snapshot.note}</small>
        </div>
        <div className="cao-family-toolbar-legend" aria-label="定位状态图例">
          <span><i className="confirmed" />在证</span>
          <span><i className="continuous" />连续区间</span>
          <span><i className="uncertain" />存疑</span>
          <span><i className="pending" />待考</span>
        </div>
      </div>

      <div className="cao-family-core">
        <article className="cao-family-genealogy" aria-labelledby="cao-family-genealogy-title">
          <header className="cao-family-section-heading">
            <div>
              <Network size={15} aria-hidden="true" />
              <h3 id="cao-family-genealogy-title">家族谱系 · 曹氏</h3>
            </div>
            <span>两代</span>
          </header>

          <div className="cao-family-tree">
            <div className="cao-family-generation generation-parent">
              <span className="generation-label">父辈</span>
              <button className="family-person-node node-parent" type="button" aria-label="曹嵩，曹操父亲">
                <strong>曹嵩</strong>
                <small>巨高 · 太尉</small>
                <em>?–193</em>
              </button>
              <div className="family-adoption-note">
                <i aria-hidden="true" />
                <span>曹腾养子 · 收养关系见载</span>
              </div>
            </div>

            <div className="family-confirmed-trunk" aria-hidden="true" />

            <div className="cao-family-generation generation-focus">
              <span className="generation-label">本支</span>
              <button className="family-person-node node-focus" type="button" onClick={() => onOpenPerson("cao-cao")}>
                <strong>曹操</strong>
                <small>孟德 · 魏王</small>
                <em>155–220</em>
              </button>
              <div className="family-collateral-note">
                <i aria-hidden="true" />
                <span>曹真 · 宗室旁系</span>
              </div>
              <div className="family-uncertain-note">
                <i aria-hidden="true" />
                <span>夏侯氏远祖说 · 后代附会 · 存疑</span>
              </div>
            </div>

            <div className="family-descendant-trunk" aria-hidden="true" />

            <div className="cao-family-generation generation-children">
              <span className="generation-label">子辈</span>
              <div className="family-children-row">
                {familyNodes.map((person) => (
                  <button
                    className="family-person-node node-child"
                    key={person.id}
                    type="button"
                    onClick={() => onOpenPerson(person.id)}
                  >
                    <strong>{person.name}</strong>
                    <small>{person.courtesy}</small>
                    <em>{person.life}</em>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="cao-family-line-legend" aria-label="谱系线型说明">
            <span><i className="line-confirmed" />已确认血缘</span>
            <span><i className="line-adoption" />收养关系</span>
            <span><i className="line-collateral" />旁系关系</span>
            <span><i className="line-uncertain" />存疑关系</span>
          </div>
        </article>

        <aside className="cao-family-spacetime">
          <section className="cao-family-members" aria-labelledby="current-family-members-title">
            <header className="cao-family-section-heading">
              <div>
                <UsersRound size={15} aria-hidden="true" />
                <h3 id="current-family-members-title">当前成员</h3>
              </div>
              <span>{activeYear} 年</span>
            </header>
            <div className="cao-family-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>人物</th>
                    <th>所在地</th>
                    <th>身份与职任</th>
                    <th>定位依据</th>
                    <th>可信度</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.members.map((member) => (
                    <tr key={`${activeYear}-${member.name}`}>
                      <td>{member.name}</td>
                      <td className={member.place === "待考" ? "is-pending" : ""}>{member.place}</td>
                      <td>{member.office}</td>
                      <td>{member.basis}</td>
                      <td><ConfidenceBadge value={member.confidence} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="cao-family-map-panel" aria-labelledby="cao-family-map-title">
            <header className="cao-family-section-heading">
              <div>
                <MapPinned size={15} aria-hidden="true" />
                <h3 id="cao-family-map-title">位置快照</h3>
              </div>
              <span>离散史料点</span>
            </header>
            <div className="cao-family-map" role="img" aria-label={`${activeYear} 年曹氏成员史料定位快照`}>
              {snapshot.places.map((place) => (
                <div
                  className={`family-map-marker marker-${place.status}`}
                  key={`${activeYear}-${place.label}-${place.detail}`}
                  style={{ "--marker-x": `${place.x}%`, "--marker-y": `${place.y}%` } as React.CSSProperties}
                >
                  <i aria-hidden="true" />
                  <span>
                    <strong>{place.label}</strong>
                    <small>{place.detail}</small>
                  </span>
                </div>
              ))}
              <div className="cao-family-map-note">
                仅在史料定位节点更新，不对未知年份插值
              </div>
            </div>
          </section>

          <section className="cao-family-evidence-timeline" aria-labelledby="cao-family-timeline-title">
            <header>
              <CalendarDays size={14} aria-hidden="true" />
              <h3 id="cao-family-timeline-title">史料定位时间轴</h3>
            </header>
            <div className="family-year-track" role="group" aria-label="选择史料定位年份">
              {familyYears.map((item) => (
                <button
                  className={activeYear === item ? "selected" : ""}
                  key={item}
                  type="button"
                  aria-pressed={activeYear === item}
                  onClick={() => setActiveYear(item)}
                >
                  <i aria-hidden="true" />
                  <span>{item}</span>
                </button>
              ))}
            </div>
            <div className="family-timeline-status">
              <span>连续史料：邺城 · 213–220</span>
              <span>待考</span>
              <span>存疑</span>
            </div>
          </section>
        </aside>
      </div>

      <section className="cao-family-influence" aria-labelledby="cao-family-influence-title">
        <header>
          <div>
            <CircleDot size={15} aria-hidden="true" />
            <h3 id="cao-family-influence-title">家族影响力</h3>
            <span>基于 {activeYear} 年及此前史料节点</span>
          </div>
          <small>不计算综合影响力分数</small>
        </header>
        <div className="cao-family-influence-rows">
          {influenceRows.map((row) => (
            <div className="cao-family-influence-row" key={`${activeYear}-${row.id}`}>
              <strong>{row.label}</strong>
              <span>{row.description}</span>
              <small>史料 {row.evidence} 条</small>
              <em>可信度 {row.confidence}</em>
            </div>
          ))}
        </div>
      </section>

      <footer className="cao-family-footer">
        <button type="button" onClick={() => setPanoramaOpen(true)}>
          进入家族全景
          <ChevronRight size={17} aria-hidden="true" />
        </button>
        <span>查看更多代际、支系与联姻关系</span>
      </footer>

      {panoramaOpen && (
        <div className="cao-family-panorama-backdrop" role="presentation">
          <section className="cao-family-panorama" role="dialog" aria-modal="true" aria-labelledby="cao-family-panorama-title">
            <header>
              <div>
                <Network size={18} aria-hidden="true" />
                <span>
                  <small>家族全景</small>
                  <strong id="cao-family-panorama-title">曹氏 · 代际与支系</strong>
                </span>
              </div>
              <button type="button" aria-label="关闭家族全景" onClick={() => setPanoramaOpen(false)}>
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="cao-family-panorama-grid">
              <article>
                <ShieldCheck size={20} aria-hidden="true" />
                <strong>主继承线</strong>
                <p>曹嵩 → 曹操 → 曹丕，220 年由魏王国继承转入曹魏皇帝体系。</p>
              </article>
              <article>
                <UsersRound size={20} aria-hidden="true" />
                <strong>宗室支系</strong>
                <p>曹彰、曹植等支系以军职与封国维系宗室秩序，位置仅随史料节点更新。</p>
              </article>
              <article>
                <BookOpen size={20} aria-hidden="true" />
                <strong>证据边界</strong>
                <p>收养、旁系与后代附会分别保留线型和可信度，不混入确认血缘。</p>
              </article>
            </div>
            <button className="cao-family-panorama-graph" type="button" onClick={onOpenGraph}>
              打开证据图谱
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
