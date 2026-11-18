/* 동부산 역사교사모임 아카이브 — 자료는 data/*.json, 그림은 art.js */
const SUBJ = { world:'세계사', korea:'한국사', etc:'기타자료', books:'독서 모임' };
const UNITS = {
  world:[['01','문명의 발생과 고대 세계의 형성'],['02','세계 종교의 확산과 지역 문화의 발전'],['03','지역 세계의 교류와 변화'],['04','제국주의와 국민 국가 건설 운동'],['05','세계 대전과 사회 변동'],['06','현대 세계의 전개와 과제'],['기타','기타']],
  korea:[['01','고조선과 삼국시대'],['02','통일 신라와 발해'],['03','고려'],['04','조선 전기'],['05','조선 후기'],['06','근현대사'],['기타','기타']],
  etc:[]
};
const TYPES = ['학습지','피피티','바이브코딩','수행평가','보드게임'];
const DB = { materials:[], books:[], about:null, gyegi:{} };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = d => String(d).replaceAll('-', '.');
const view = $('#view');
const ucode = c => c === '기타' ? 'x' : c;
const udec = c => c === 'x' ? '기타' : c;
const unitTitle = (s, c) => { const u = UNITS[s].find(x => x[0] === c); return !u ? '' : (c === '기타' ? '단원 외 자료' : u[1]); };
const unitLabel = c => c === '기타' ? '단원 외' : c + '단원';
const byNew = (a, b) => b.date.localeCompare(a.date);
const inSubj = (m, s) => m.subject === s || (m.also || []).includes(s);
const subjOf = m => [m.subject, ...(m.also || [])].map(k => SUBJ[k]).join('·');
const countOf = (s, c) => DB.materials.filter(m => inSubj(m, s) && (c == null || m.unit === c)).length;
if (matchMedia('(hover:none)').matches) document.documentElement.classList.add('touch');

const artKey = m => m.subject === 'etc' ? 'etc-x' : m.subject === 'books' ? 'tile-books' : `${m.subject}-${ucode(m.unit)}`;
const art = k => ART[k] || '';
/* images/ 폴더에 같은 이름의 사진이 있으면 그림 위에 덮어서 보여 줘요 */
const unitImg = k => /^(world|korea)-/.test(k) ? `<img class="ov" src="images/units/${k}.webp" alt="" loading="lazy" onerror="this.remove()">` : '';
/* 페이지 맨 위 띠의 오른쪽 그림: 단원 그림이 없으면 과목 그림, 그것도 없으면 그림 없이 보여요 */
const bandImg = (src, fb) => `<div class="band-img"><img src="${src}" alt="" onerror="${fb ? `if(!this.dataset.f){this.dataset.f=1;this.src='${fb}'}else{this.parentNode.remove()}` : 'this.parentNode.remove()'}"></div>`;
const pic = k => art(k) + unitImg(k);

/* ---------- 자료 한 줄 ---------- */
function rowHTML(m, i, meta){
  const top = meta ?? [subjOf(m), m.subject === 'etc' ? '' : unitLabel(m.unit)].filter(Boolean).join(' · ');
  const tags = (m.tags || []).length ? `<span class="tags">${m.tags.map(t => `<i>#${esc(t)}</i>`).join('')}</span>` : '';
  const sub = [m.author, fmt(esc(m.date))].filter(Boolean).join(' · ');
  const go = m.link ? `<a class="r-btn" href="${esc(m.link)}" target="_blank" rel="noopener">자료 보기<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg></a>` : `<span class="r-go" aria-hidden="true">→</span>`;
  const inner = `${m.thumb ? `<span class="r-th"><img src="${esc(m.thumb)}" alt="" draggable="false" loading="lazy"></span>` : ''}
    <span class="r-main"><span class="kind k${TYPES.indexOf(m.type) + 1}">${esc(m.type)}</span><strong>${esc(m.title)}</strong><small>${esc(m.desc)}</small>${tags}</span>
    <span class="r-meta">${esc(top)}<br>${sub}</span>
    ${go}`;
  const st = `style="--i:${Math.min(i, 12)}"`, cls = `row s-${m.subject}${m.thumb ? ' th' : ''}${m.link ? ' lk' : ''}`;
  return m.file && !m.link ? `<a class="${cls}" ${st} href="${esc(m.file)}" download>${inner}</a>` : `<div class="${cls}" ${st}>${inner}</div>`;
}
let listHash = '';
const TCOL = { '학습지':'#4a6a9b', '피피티':'#d9a021', '바이브코딩':'#5d8068' };
function posterImg(m){
  return m.thumb ? `<img src="${esc(m.thumb)}" alt="${esc(m.title)}" draggable="false" loading="lazy">` : `<span class="ph" style="--tc:${TCOL[m.type] || '#999'}"><b>${esc(m.type)}</b><em>${esc(m.title)}</em></span>`;
}
const FMT = { '시뮬레이션':'f1', '보드게임':'f2', '복습 퀴즈':'f3' };
const pills = m => `<span class="pills"><span class="kind k${TYPES.indexOf(m.type) + 1}">${esc(m.type)}</span>${m.format ? `<span class="kind fmt ${FMT[m.format] || 'f1'}">${esc(m.format)}</span>` : ''}</span>`;
function posterHTML(m, i, meta){
  const top = [meta ?? [subjOf(m), m.subject === 'etc' ? (m.group || '') : unitLabel(m.unit)].filter(Boolean).join(' · '), m.topic].filter(Boolean).join(' · ');
  return `<a class="pst" style="--i:${Math.min(i, 14)}" href="#material-${m.id}"><span class="pst-img">${posterImg(m)}${m.author ? `<em class="by">${esc(m.author)}</em>` : ''}</span>${pills(m)}<strong>${esc(m.title)}</strong><small>${esc(top)}</small></a>`;
}
function renderMaterial(m){
  const home = '<a href="#home">홈</a>';
  const unitLink = m.subject === 'etc' ? '' : ` › <a href="#${m.subject}-${ucode(m.unit)}">${unitLabel(m.unit)}</a>`;
  const un = m.subject === 'etc' ? '' : unitTitle(m.subject, m.unit);
  const go = m.link ? `<a class="notebtn" href="${esc(m.link)}" target="_blank" rel="noopener">자료 보기 <span>↗</span></a>`
    : m.file ? `<a class="notebtn" href="${esc(m.file)}" download>자료 내려받기 <span>↓</span></a>` : `<div class="notebtn off">자료 파일을 준비 중이에요</div>`;
  const back = '#' + (listHash || (m.subject + (m.subject === 'etc' ? '' : '-' + ucode(m.unit))));
  const same = DB.materials.filter(x => x.subject === m.subject && x.unit === m.unit).sort(byNew), i = same.indexOf(m), pv = same[i - 1], nx = same[i + 1];
  const dl = rows => `<dl>${rows.filter(r => r[1]).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  const card = (t, body, cls = '') => `<section class="mc ${cls}"><h3>${t}</h3>${body}</section>`;
  const cards = [
    (m.how || []).length ? card('진행 방식', `<ol>${m.how.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`, 'wide') : '',
    (m.learn || []).length ? card('다루는 내용', `<ul>${m.learn.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`) : '',
    (m.play || []).length ? card('플레이 정보', dl(m.play)) : '',
    card('자료 정보', dl([['과목', subjOf(m)], ['단원', m.subject === 'etc' ? '' : `${unitLabel(m.unit)}${un ? ' · ' + esc(un) : ''}`], ['다룬 내용', esc(m.topic || '')], ['유형', esc(m.type)], ['형식', esc(m.format || '')], ['만든 사람', esc(m.author || '')], ['등록일', fmt(esc(m.date))]])),
    (m.tags || []).length ? card('키워드', `<div class="tags big">${m.tags.map(t => `<i>#${esc(t)}</i>`).join('')}</div>`, 'wide') : ''
  ].join('');
  view.innerHTML = `
  <div class="wrap s-${m.subject}"><div class="mdetail">
    <div class="m-poster">${posterImg(m)}${m.author ? `<em class="by">${esc(m.author)}</em>` : ''}</div>
    <div class="m-main">
      <div class="crumb" style="color:var(--sub)">${home} › ${m.also ? [m.subject, ...m.also].map(k => `<a href="#${k}">${SUBJ[k]}</a>`).join(' · ') : `<a href="#${m.subject}">${SUBJ[m.subject]}</a>${unitLink}`}</div>
      ${pills(m)}
      <h1>${esc(m.title)}</h1>
      <p class="m-lead">${esc(m.overview || m.desc)}</p>
      <div class="go-row">${go}<a class="backbtn" href="${back}">← 목록으로</a></div>
    </div>
  </div>
  ${m.preview ? `<section class="pv" id="pv"><div class="pv-h"><h3>자료 미리보기</h3><span id="pv-n">1 / ${m.preview.pages}</span></div>
    <div class="pv-main"><div class="pv-load" id="pv-load" role="status"><div class="ring"></div><p>미리보기를 불러오는 중… <b id="pv-pct">0%</b></p></div><button class="pv-b" id="pv-prev" type="button" aria-label="이전 쪽">‹</button><img id="pv-img" src="${esc(m.preview.dir)}/p-1.webp" alt="${esc(m.title)} 1쪽" draggable="false"><button class="pv-b" id="pv-next" type="button" aria-label="다음 쪽">›</button></div>
    <div class="pv-th">${Array.from({ length: m.preview.pages }, (_, k) => `<button type="button" class="${k ? '' : 'on'}" data-k="${k + 1}"><img src="${esc(m.preview.dir)}/p-${k + 1}.webp" alt="" draggable="false" loading="lazy"></button>`).join('')}</div></section>` : ''}
  <div class="mcards">${cards}</div>
  <div class="pnrow m-pn">${pv ? `<a class="pnbtn" href="#material-${pv.id}">← ${esc(pv.title)}</a>` : '<span class="pnbtn off">.</span>'}${nx ? `<a class="pnbtn" href="#material-${nx.id}">${esc(nx.title)} →</a>` : '<span class="pnbtn off">.</span>'}</div>
  </div>`;
}
function initPreview(m){
  const pv = $('#pv'); if (!pv) return;
  const N = m.preview.pages, img = $('#pv-img'); let cur = 1;
  pv.classList.add('loading'); let done = 0;
  const fin = () => { pv.classList.remove('loading'); const l = $('#pv-load'); if (l) setTimeout(() => l.remove(), 400); };
  const tm = setTimeout(fin, 60000);
  Array.from({ length: N }, (_, k) => { const i = new Image(); i.onload = i.onerror = () => { done++; const p = $('#pv-pct'); if (p) p.textContent = Math.round(done / N * 100) + '%'; if (done >= N) { clearTimeout(tm); fin(); } }; i.src = `${m.preview.dir}/p-${k + 1}.webp`; });
  const go = n => { cur = Math.min(N, Math.max(1, n)); img.src = `${m.preview.dir}/p-${cur}.webp`; img.alt = `${m.title} ${cur}쪽`; $('#pv-n').textContent = `${cur} / ${N}`; $$('.pv-th button', pv).forEach(b => b.classList.toggle('on', +b.dataset.k === cur)); };
  $('#pv-prev').addEventListener('click', () => go(cur - 1)); $('#pv-next').addEventListener('click', () => go(cur + 1));
  const open = () => {
    const lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog');
    lb.innerHTML = `<div class="lb-top"><span id="lb-n"></span><button type="button" id="lb-x" aria-label="닫기">×</button></div><div class="lb-stage" id="lb-stage"><img id="lb-img" alt="" draggable="false"></div><button class="lb-b" id="lb-p" type="button" aria-label="이전 쪽">‹</button><button class="lb-b" id="lb-nx" type="button" aria-label="다음 쪽">›</button><p class="lb-hint">이미지를 누르면 크게 볼 수 있어요</p>`;
    document.body.appendChild(lb); document.body.classList.add('lb-open');
    const li = $('#lb-img', lb), st = $('#lb-stage', lb);
    const show = () => { li.src = `${m.preview.dir}/p-${cur}.webp`; $('#lb-n', lb).textContent = `${m.title} · ${cur} / ${N}`; st.classList.remove('zoom'); st.scrollTo(0, 0); go(cur); };
    const close = () => { lb.remove(); document.body.classList.remove('lb-open'); document.removeEventListener('keydown', key); };
    const key = e => { if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft' && cur > 1) { cur--; show(); } else if (e.key === 'ArrowRight' && cur < N) { cur++; show(); } };
    document.addEventListener('keydown', key);
    $('#lb-x', lb).addEventListener('click', close);
    $('#lb-p', lb).addEventListener('click', () => { if (cur > 1) { cur--; show(); } });
    $('#lb-nx', lb).addEventListener('click', () => { if (cur < N) { cur++; show(); } });
    st.addEventListener('click', e => { if (e.target === st && !st.classList.contains('zoom')) close(); else if (e.target === li) st.classList.toggle('zoom'); });
    show();
  };
  img.addEventListener('click', open);
  $('.pv-th', pv).addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(+b.dataset.k); });
}
function moveInd(box){
  const ind = $('.ind', box), on = $('.on', box);
  if (!ind || !on) return;
  ind.style.width = on.offsetWidth + 'px';
  ind.style.transform = `translateX(${on.offsetLeft}px)`;
}
/* 섹션 배너 배경: images/banners/{about,world,korea,books,etc}.webp */
function bannerBg(){
  const b = $('.band'); if (!b) return;
  const k = b.dataset.k; if (!k) return;
  const i = new Image();
  i.onload = () => { b.style.setProperty('--bnr', `url(images/banners/${k}.webp)`); b.classList.add('own'); };
  i.src = `images/banners/${k}.webp`;
}
function band({ cls, crumb, title, desc, img }){
  const k = (cls.match(/s-(\w+)/) || [])[1] || '';
  return `<section class="band ${cls}" data-k="${k}">
    <div class="wrap"><div class="band-t"><div class="crumb">${crumb}</div><h1><span>${esc(title)}</span></h1>${desc ? `<p>${esc(desc)}</p>` : ''}</div>${img || ''}</div>
  </section>`;
}
/* 필터 + 목록 (검색 · 유형 · 형식 · 만든 사람 · 정렬) */
function mountList(items, metaFn, grp, defSort){
  const box = $('#lib');
  if (!items.length) { box.innerHTML = `<div class="empty">${MS}아직 올라온 자료가 없어요.<br><small>곧 채워질 예정이에요.</small></div>`; return; }
  const st = { q:'', type:'all', fmt:'all', by:'all', sort: defSort || (grp ? 'unit' : 'new') };
  const norm = t => String(t).toLowerCase().replace(/[\s.·,\-_]/g, '');
  const uniq = k => [...new Set(items.map(m => m[k]).filter(Boolean))];
  const groups = [['type', '유형', TYPES.filter(t => uniq('type').includes(t))], ['fmt', '형식', ['시뮬레이션', '보드게임', '복습 퀴즈'].filter(t => uniq('format').includes(t))]].filter(g => g[2].length > 1 || (g[0] === 'fmt' && g[2].length));
  const field = { type:'type', fmt:'format', by:'author' };
  const ord = u => UNITS[grp || 'world'].findIndex(x => x[0] === u);
  const SORTS = [...(grp ? [['unit', '단원순']] : []), ['new', '최신순'], ['old', '오래된순'], ['name', '이름순']];
  box.innerHTML = `<div class="lib-bar"><label class="lib-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="lq" type="search" placeholder="이 목록에서 검색" autocomplete="off"></label>
    <span class="lib-count" id="lc"></span>
    <select id="ls" aria-label="정렬">${SORTS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
    <div class="lib-groups" id="lg"></div><div id="lib-list"></div>`;
  $('#ls').value = st.sort;
  const list = $('#lib-list');
  const base = m => !st.q || norm([m.title, m.desc, m.author, (m.tags || []).join(' '), m.format || '', m.topic || '', m.group || ''].join(' ')).includes(norm(st.q));
  const pass = (m, skip) => base(m) && groups.every(([k]) => k === skip || st[k] === 'all' || m[field[k]] === st[k]);
  const draw = animate => {
    $('#lg').innerHTML = groups.map(([k, l, vals]) => `<div class="group" data-g="${k}"><span>${l}</span><button class="chip${st[k] === 'all' ? ' on' : ''}" data-v="all">전체 <i>${items.filter(m => pass(m, k)).length}</i></button>${vals.map(v => `<button class="chip${st[k] === v ? ' on' : ''}" data-v="${esc(v)}">${esc(v)} <i>${items.filter(m => pass(m, k) && m[field[k]] === v).length}</i></button>`).join('')}</div>`).join('');
    const shown = items.filter(m => pass(m)).sort((x, y) => st.sort === 'name' ? x.title.localeCompare(y.title, 'ko') : st.sort === 'old' ? -byNew(x, y) : st.sort === 'unit' ? ord(x.unit) - ord(y.unit) || byNew(x, y) : byNew(x, y));
    $('#lc').textContent = `전체 ${items.length}개` + (shown.length !== items.length ? ` · 표시 ${shown.length}개` : '');
    list.classList.toggle('still', !animate);
    list.className = shown.length ? 'pgrid' : 'list';
    list.innerHTML = shown.length ? shown.map((m, i) => posterHTML(m, i, grp ? `${SUBJ[grp]} · ${unitLabel(m.unit)}` : (metaFn ? metaFn(m) : undefined))).join('') : `<div class="empty">${MS}조건에 맞는 자료가 없어요. 검색어나 필터를 바꿔 보세요.</div>`;
  };
  draw(true);
  $('#lg').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; st[b.closest('.group').dataset.g] = b.dataset.v; draw(true); });
  $('#lq').addEventListener('input', e => { st.q = e.target.value; draw(false); });
  $('#ls').addEventListener('change', e => { st.sort = e.target.value; draw(true); });
}

/* ---------- 목차 (하위 목차 드롭다운) ---------- */
function navDef(){
  const units = s => [[s, '·', '전체 자료'], ...UNITS[s].map(u => [`${s}-${ucode(u[0])}`, u[0] === '기타' ? '·' : u[0], unitTitle(s, u[0])])];
  return [
    ['home', '홈', null, ''],
    ['about', '소개', null, 's-about'],
    ['world', '세계사', units('world'), 's-world'],
    ['korea', '한국사', units('korea'), 's-korea'],
    ['books', '독서 모임', null, 's-books'],
    ['etc', '기타자료', [['etc-busan', '01', '부산역사교사모임'], ['etc-gyegi', '02', '계기 교육']], 's-etc']
  ];
}
function buildNav(){
  $('#nav').innerHTML = navDef().map(([k, l, sub, cls]) => `
    <li class="${sub ? 'has-sub' : ''} ${cls}" data-k="${k}">
      <a href="#${k}" data-k="${k}">${l}</a>
      ${sub ? `<div class="sub">${sub.map(([h, n, t]) => `<a href="#${h}" data-h="${h}"><b>${esc(n)}</b><span>${esc(t)}</span></a>`).join('')}</div>` : ''}
    </li>`).join('');
  const nav = $('#nav');
  nav.addEventListener('click', e => {
    const li = e.target.closest('li.has-sub'), top = e.target.closest('li > a');
    if (li && top && document.documentElement.classList.contains('touch') && !li.classList.contains('open')) {
      e.preventDefault(); $$('.has-sub.open', nav).forEach(x => x.classList.remove('open')); li.classList.add('open'); return;
    }
    if (e.target.closest('.sub a') && li) { li.classList.remove('open'); li.classList.add('shut'); }
  });
  nav.addEventListener('mouseout', e => { const li = e.target.closest('li.has-sub'); if (li && !li.contains(e.relatedTarget)) li.classList.remove('shut'); });
  document.addEventListener('click', e => { if (!e.target.closest('#nav')) $$('.has-sub.open').forEach(x => x.classList.remove('open')); });
}
function markNav(key, hash){
  $$('#nav > li > a').forEach(a => a.classList.toggle('on', a.dataset.k === key));
  $$('#nav .sub a').forEach(a => a.classList.toggle('on', a.dataset.h === hash));
}

/* ---------- 홈 ---------- */
const hs = { q:'', subj:'all', type:'all', unit:'all' };
const unitName = m => unitTitle(m.subject, m.unit) || '';
function homeActive(){ return !!hs.q.trim(); }
function homeList(animate){
  const norm = t => String(t).toLowerCase().replace(/[\s.·,\-_]/g, ''), q = norm(hs.q);
  const items = DB.materials.filter(m =>
    (hs.subj === 'all' || inSubj(m, hs.subj)) && (hs.type === 'all' || m.type === hs.type) && (hs.unit === 'all' || m.unit === hs.unit) &&
    (!q || norm([m.title, m.desc, m.author, (m.tags || []).join(' '), m.format || '', m.topic || '', subjOf(m), unitName(m)].join(' ')).includes(q))
  ).sort(byNew);
  const active = homeActive();
  const hero = $('#hero'); if (hero) hero.classList.toggle('compact', !!active);
  $('#res-sec').hidden = !active;
  $('#board-sec').hidden = !!active;
  const fw = active && hs.type === 'all' && hs.unit === 'all' ? wsFind(t => norm(t).includes(q), hs.subj) : { ws: [], cmp: [] };
  const wsn = fw.ws.length + fw.cmp.length;
  $('#res-count').textContent = `${items.length + wsn}개`;
  $('#home-ws').innerHTML = wsn ? (fw.cmp.length ? `<h3>단원별 비교<i>${fw.cmp.length}</i></h3><div class="hws-g">${fw.cmp.slice(0, 12).map(({ e, href }) => `<a class="hws-r" href="${href}"><b>${esc(e.u.t)}</b><small>${e.tn}명의 학습지를 나란히 보기</small></a>`).join('')}</div>` : '')
    + (fw.ws.length ? `<h3>학습지<i>${fw.ws.length}</i></h3><div class="hws-g">${fw.ws.slice(0, 18).map(({ w, c, href, p, sn }) => `<a class="hws-r" href="${href}" data-w="${w.id}" data-p="${p}"><b>${esc(c.n)} · ${esc(c.title)}</b><small>${esc(w.teacher)} · ${esc(w.term)} · ${p}쪽</small>${sn ? `<em>${esc(sn)}</em>` : ''}</a>`).join('')}</div>` : '') : '';
  const mh = $('#home-mh'); mh.hidden = !items.length; mh.innerHTML = `수업·평가 자료<i>${items.length}</i>`;
  const list = $('#home-list');
  list.classList.toggle('still', !animate);
  list.className = items.length ? 'pgrid' : 'list';
  list.innerHTML = items.length ? items.map((m, i) => posterHTML(m, i)).join('') : wsn ? '' : `<div class="empty">${MS}조건에 맞는 자료가 없어요. 검색어나 필터를 바꿔 보세요.</div>`;
}
function homeUnitOptions(){
  const sel = $('#unit-sel');
  const units = hs.subj === 'all' || hs.subj === 'etc' ? [] : UNITS[hs.subj];
  sel.hidden = !units.length;
  sel.innerHTML = '<option value="all">전체 단원</option>' + units.map(u => `<option value="${u[0]}">${u[0] === '기타' ? '기타' : u[0] + '. ' + esc(u[1])}</option>`).join('');
  sel.value = hs.unit;
}
function bitem(m){
  const meta = [subjOf(m), m.subject === 'etc' ? '' : unitLabel(m.unit)].filter(Boolean).join(' · ');
  return `<a class="bitem${m.thumb ? ' th' : ''}" href="#material-${m.id}">${m.thumb ? `<span class="bi-th"><img src="${esc(m.thumb)}" alt="" draggable="false" loading="lazy"></span>` : ''}<span class="bi-t"><strong>${esc(m.title)}</strong><small>${esc(meta)}</small></span></a>`;
}
const SPARKS = [[58.6,86.5,30,2.6],[56,90,18,3.4],[61.5,53.5,22,3],[65,59,28,2.2],[57.5,57,16,3.8],[67,63,20,2.9],[20.5,60,22,3.3]];
function motes(){
  return Array.from({ length: 34 }, (_, i) => {
    const sz = (3 + Math.random() * 7).toFixed(1), x = (Math.random() * 100).toFixed(1), d = (14 + Math.random() * 16).toFixed(1), dl = (-Math.random() * 30).toFixed(1), dx = ((Math.random() - .5) * 120).toFixed(0), o = (.6 + Math.random() * .4).toFixed(2);
    return `<i style="left:${x}%;--s:${sz}px;--d:${d}s;--dl:${dl}s;--dx:${dx}px;--o:${o}"></i>`;
  }).join('');
}
/* 아래로 내려가면 목록이 차례로 나타나요 */
let _io;
function heroFx(){
  _io?.disconnect();
  _io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); _io.unobserve(en.target); } }), { threshold: .15 });
  $$('.rv').forEach(el => _io.observe(el));
}
function revealAll(){
  $$('.ab-s,.ab-tl li,.ab-q,.ab-rows,.mc,.pnrow,.ubar,.lib-bar,.m-lead,.ab-top').forEach(el => el.classList.add('rv'));
  heroFx();
}
/* 스크롤 진행 막대 · 포스터 기울기 */
(() => {
  const bar = document.createElement('div'); bar.id = 'prog'; document.body.appendChild(bar);
  const up = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%'; };
  addEventListener('scroll', up, { passive:true }); addEventListener('resize', up);
  document.addEventListener('mousemove', e => {
    const p = e.target.closest?.('.pst'); if (!p) return;
    const im = p.querySelector('.pst-img'), r = im.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    im.style.setProperty('--ry', ((x - .5) * 10).toFixed(2) + 'deg'); im.style.setProperty('--rx', ((.5 - y) * 10).toFixed(2) + 'deg');
    im.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); im.style.setProperty('--my', (y * 100).toFixed(1) + '%');
  }, { passive:true });
  document.addEventListener('mouseout', e => { const p = e.target.closest?.('.pst'); if (p && !p.contains(e.relatedTarget)) { const im = p.querySelector('.pst-img'); im.style.setProperty('--rx', '0deg'); im.style.setProperty('--ry', '0deg'); } });
})();
function setNavH(){ const n = $('.nav'); if (n) document.documentElement.style.setProperty('--nh', n.offsetHeight + 'px'); }
const ARCHIVE_SVG = '<svg viewBox="-30 -870 3130 966" aria-hidden="true"><g transform="scale(1,-1)"><path class="g" style="--k:0" pathLength="1" transform="translate(0 0)" d="M146 -76Q98 -62 79.5 -48.0Q61 -34 61 -13Q61 3 70.0 32.0Q79 61 96.5 100.5Q114 140 138.5 188.0Q163 236 194 291Q168 292 147.5 292.5Q127 293 114 293Q120 308 148.0 319.0Q176 330 222 338Q261 403 305.5 462.0Q350 521 395.0 570.5Q440 620 485.0 657.5Q530 695 571 717Q572 724 572.5 729.0Q573 734 573 736Q587 736 610.5 729.0Q634 722 656.5 712.0Q679 702 696.5 691.5Q714 681 716 674Q683 616 651.0 500.5Q619 385 598 224Q593 184 589.5 133.0Q586 82 586 19Q586 -3 586.0 -26.0Q586 -49 588 -74Q586 -75 584.0 -75.0Q582 -75 576 -75Q562 -75 543.5 -70.5Q525 -66 507.5 -59.5Q490 -53 477.5 -45.0Q465 -37 462 -31Q461 -18 461.0 -5.5Q461 7 461 21Q461 83 465.5 147.0Q470 211 481 279Q467 280 444.0 281.5Q421 283 392.5 284.0Q364 285 331.5 286.5Q299 288 268 289Q244 244 223.0 199.5Q202 155 187 110Q170 62 159.5 14.0Q149 -34 146 -76ZM532 525Q536 539 541.5 563.5Q547 588 552 615Q527 606 496.5 582.0Q466 558 433.5 522.5Q401 487 367.5 442.5Q334 398 303 348Q387 355 494 357Q502 399 511.5 440.5Q521 482 532 525Z"/><path class="g" style="--k:1" pathLength="1" transform="translate(642 0)" d="M73 20Q78 49 90.5 96.5Q103 144 120.0 197.5Q137 251 156.0 305.0Q175 359 193 402Q206 433 216.0 450.5Q226 468 238 480Q252 478 267.0 473.0Q282 468 296.0 461.0Q310 454 321.0 446.5Q332 439 338 432Q311 400 290.5 359.0Q270 318 249 254Q303 302 344.5 346.0Q386 390 422 444Q428 449 443 449Q457 449 470.0 444.5Q483 440 488 432Q470 384 470 337Q470 293 483 271Q482 265 469.5 248.0Q457 231 442 216Q415 230 394.0 254.5Q373 279 363 308Q316 275 283.0 243.5Q250 212 226.5 173.5Q203 135 186.5 85.0Q170 35 155 -34Q146 -33 133.5 -27.5Q121 -22 108.5 -14.0Q96 -6 86.0 3.0Q76 12 73 20Z"/><path class="g" style="--k:2" pathLength="1" transform="translate(1045 0)" d="M103 176Q103 233 126.5 286.5Q150 340 188.5 381.5Q227 423 276.5 448.5Q326 474 379 474Q431 474 459.0 448.0Q487 422 487 374Q487 351 480.5 329.5Q474 308 463.5 291.0Q453 274 439.0 263.5Q425 253 411 253Q399 253 386.5 260.5Q374 268 366 280Q433 341 433 391Q433 420 410 420Q390 420 360.0 401.0Q330 382 302 351Q259 303 236.5 244.5Q214 186 214 122Q214 41 250 25Q265 27 285.0 34.0Q305 41 328.0 52.5Q351 64 375.5 79.0Q400 94 423 111Q427 108 430.0 102.0Q433 96 433 91Q416 70 394.0 50.0Q372 30 348.0 13.5Q324 -3 301.5 -14.5Q279 -26 262 -29Q229 -26 200.0 -8.5Q171 9 149.5 37.0Q128 65 115.5 101.0Q103 137 103 176Z"/><path class="g" style="--k:3" pathLength="1" transform="translate(1465 0)" d="M96 17Q96 52 103.0 99.5Q110 147 123.5 201.0Q137 255 155.5 314.0Q174 373 197 432Q217 485 243.5 539.0Q270 593 301.0 645.0Q332 697 365.5 744.0Q399 791 433 830Q449 830 467.5 826.0Q486 822 503.5 815.5Q521 809 535.5 800.0Q550 791 559 782Q484 705 424.0 626.5Q364 548 329 479Q310 441 294.5 408.0Q279 375 266.0 342.5Q253 310 242.5 277.5Q232 245 223 209Q415 454 508 454Q534 454 564.0 437.0Q594 420 617 391Q586 357 553.0 309.0Q520 261 492.5 212.5Q465 164 447.5 122.5Q430 81 430 61Q430 51 433.0 47.5Q436 44 446 44Q461 44 470.0 48.0Q479 52 481 52Q486 44 487.0 41.0Q488 38 488 36Q488 32 476.0 24.5Q464 17 447.5 9.5Q431 2 415.0 -4.0Q399 -10 391 -10Q381 -10 371.0 -4.5Q361 1 353.5 10.0Q346 19 341.5 30.0Q337 41 337 53Q337 68 345.5 97.5Q354 127 369.0 166.5Q384 206 405.0 253.0Q426 300 450 349Q450 353 446 353Q443 353 430.5 345.0Q418 337 407 329Q371 302 334.5 262.5Q298 223 263.5 176.0Q229 129 198.5 76.5Q168 24 146 -29Q143 -36 137.0 -42.0Q131 -48 127 -48Q124 -48 118.5 -41.0Q113 -34 108.5 -23.5Q104 -13 100.0 -2.0Q96 9 96 17Z"/><path class="g" style="--k:4" pathLength="1" transform="translate(1982 0)" d="M98 67Q98 76 99.5 89.5Q101 103 105.0 125.5Q109 148 115.5 180.0Q122 212 132 257Q134 267 141.0 289.0Q148 311 159.5 335.5Q171 360 187.5 383.0Q204 406 227 417Q244 413 272.0 396.5Q300 380 320 351Q297 325 281.5 299.0Q266 273 253.5 245.0Q241 217 230.5 187.0Q220 157 207 124Q196 96 187.0 66.5Q178 37 177 15Q177 -3 176.5 -10.5Q176 -18 171 -18Q167 -18 155.0 -13.0Q143 -8 130.5 2.5Q118 13 108.0 29.0Q98 45 98 67ZM289 501Q289 507 292 519Q287 524 283.5 534.0Q280 544 280 552Q280 561 282.5 576.5Q285 592 289.0 610.0Q293 628 299.0 647.5Q305 667 311 683Q323 683 340.5 676.5Q358 670 376.0 659.5Q394 649 409.0 636.5Q424 624 432 613Q421 602 403.0 582.5Q385 563 368.0 541.5Q351 520 337.0 501.0Q323 482 319 474Q307 476 298.0 484.5Q289 493 289 501Z"/><path class="g" style="--k:5" pathLength="1" transform="translate(2218 0)" d="M152 354Q152 372 154.5 388.0Q157 404 165.0 415.5Q173 427 187.0 433.5Q201 440 224 440Q238 440 255.5 437.0Q273 434 281 426Q277 409 274.5 396.0Q272 383 270.5 367.5Q269 352 268.0 330.5Q267 309 266 275Q264 207 259.5 153.5Q255 100 239 47Q239 43 242 43Q257 54 276.0 75.0Q295 96 316.0 122.5Q337 149 358.0 179.0Q379 209 397 238Q421 280 450.0 343.0Q479 406 498 478Q504 478 513.5 475.5Q523 473 532.5 469.5Q542 466 549.5 462.0Q557 458 560 455Q558 412 539.5 367.0Q521 322 495.0 280.0Q469 238 440.0 201.0Q411 164 387 137Q339 81 290.5 37.0Q242 -7 175 -48Q149 -38 134.0 -21.5Q119 -5 119 13Q119 25 124.5 40.5Q130 56 137.0 80.5Q144 105 149.5 142.0Q155 179 155 236Q155 269 153.5 302.5Q152 336 152 354Z"/><path class="g" style="--k:6" pathLength="1" transform="translate(2666 0)" d="M455 414Q451 352 433.0 307.5Q415 263 381.5 229.5Q348 196 300.0 169.0Q252 142 188 117Q188 111 187.5 104.5Q187 98 187 91Q187 78 189.0 64.0Q191 50 196.0 38.0Q201 26 210.0 18.5Q219 11 233 11Q260 11 286.0 23.0Q312 35 335.5 52.5Q359 70 379.5 90.5Q400 111 416 128Q426 119 433 111Q388 51 334.5 11.5Q281 -28 233 -39Q164 -31 125.5 11.5Q87 54 87 114Q87 155 98.5 197.5Q110 240 130.5 279.5Q151 319 178.5 354.0Q206 389 237.5 415.0Q269 441 302.5 456.0Q336 471 369 471Q415 465 455 414ZM386 381Q359 377 330.0 359.0Q301 341 275.5 311.0Q250 281 229.0 241.0Q208 201 196 155Q276 195 329.0 253.5Q382 312 386 381Z"/></g></svg>';
function renderHome(){
  const picks = DB.materials.filter(m => m.pick).sort((x, y) => x.pick - y.pick);
  const latest = (picks.length ? picks : [...DB.materials].sort(byNew)).slice(0, 3);
  const cols = latest.length ? `<div class="pgrid home-pg rv">${latest.map((m, i) => posterHTML(m, i)).join('')}</div>` : '<p class="bempty">아직 올라온 자료가 없어요.</p>';
  view.innerHTML = `
  <section class="hero" id="hero">
    <button class="fx-btn" id="fxbtn" type="button" aria-pressed="false"></button>
    <div class="hbg">
      <div class="stage"><div class="zoom">
        <img class="heroimg" src="images/hero.webp" alt="" fetchpriority="high">
        <i class="glow"></i><i class="beam"></i>
        ${SPARKS.map(([x, y, sz, d]) => `<i class="sp" style="left:${x}%;top:${y}%;--s:${sz}px;--d:${d}s"></i>`).join('')}
      </div></div>
      <div class="motes" aria-hidden="true">${motes()}</div>
    </div>
    <div class="wrap hin">
      <h1 class="ttl" aria-label="동부산 역사교사모임 Archive">${[['l1', '동부산 역사교사모임', 0]].map(([c, t, o]) => `<span class="${c}" aria-hidden="true">${[...t].map((ch, i) => ch === ' ' ? '<b class="sp"></b>' : `<b style="--k:${i + o}">${ch}</b>`).join('')}</span>`).join('')}<span class="l2" aria-hidden="true"><span class="wr">${ARCHIVE_SVG}</span></span></h1>
      <div class="sw">
        <label class="search" id="sbox">
          <svg class="si" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input id="q" type="search" placeholder="자료 제목, 설명, 선생님 이름으로 검색" autocomplete="off" value="${esc(hs.q)}" aria-label="자료 검색">
          <button class="clr" id="clr" type="button" aria-label="검색어 지우기" hidden>×</button>
          <button class="fbtn" id="fbtn" type="button" aria-expanded="false">필터<i></i></button>
        </label>
        <div class="filters" id="fpanel" hidden>
          <div class="group" id="g-subj"><span>과목</span>${[['all','전체'],['world','세계사'],['korea','한국사'],['etc','기타자료']].map(([k,l]) => `<button class="chip${hs.subj===k?' on':''}" data-k="${k}">${l}</button>`).join('')}</div>
          <div class="group" id="g-type"><span>유형</span>${[['all','전체'],...TYPES.map(t => [t,t])].map(([k,l]) => `<button class="chip${hs.type===k?' on':''}" data-k="${k}">${l}</button>`).join('')}</div>
          <select class="sel" id="unit-sel" aria-label="단원 선택"></select>
        </div>
      </div>
    </div>
    <nav class="hq" aria-label="바로가기">${[['world', '세계사'], ['korea', '한국사'], ['books', '독서 모임']].map(([k, t]) => `<a href="#${k}"><span>${t}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></a>`).join('')}</nav>
    <button class="more-hint" id="hint" type="button" aria-label="추천 자료 보기"><svg class="tu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>추천 자료<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
  </section>
  <div class="wrap">
    <section class="sec" id="board-sec"><span id="latest"></span><div class="sec-h rv"><h2><svg class="tu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>추천 자료</h2></div>
      ${cols}
    </section>
    <section class="sec" id="res-sec" hidden><div class="sec-h"><h2>검색 결과</h2><span id="res-count"></span></div><div class="hws" id="home-ws"></div><h3 class="hws-hd" id="home-mh" hidden></h3><div class="list" id="home-list"></div></section>
  </div>`;
  homeUnitOptions(); homeList(true);
  $('#home-ws').addEventListener('click', e => { const a = e.target.closest('[data-w]'); if (a) { try { sessionStorage.setItem('wj', JSON.stringify({ id: a.dataset.w, p: +a.dataset.p })); } catch (x) {} } });
  setNavH(); heroFx();
  { const hh = () => { const h = $('#hero'); if (h) h.style.setProperty('--hh', Math.max(540, innerHeight - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nh')) || 61)) + 'px'); };
    hh(); addEventListener('orientationchange', () => setTimeout(hh, 300)); if (innerWidth > 1100) addEventListener('resize', hh); }
  const fxb = $('#fxbtn'), fxs = () => { const off = document.body.classList.contains('no-anim'); fxb.setAttribute('aria-pressed', off); fxb.innerHTML = off ? '<i></i>효과 켜기' : '<i></i>효과 끄기'; };
  fxs(); fxb.addEventListener('click', () => { const off = document.body.classList.toggle('no-anim'); try { localStorage.setItem('noanim', off ? '1' : ''); } catch (e) {} fxs(); });
  $('#hint').addEventListener('click', () => $('#board-sec').scrollIntoView({ behavior:'smooth', block:'start' }));
  const qi = $('#q'), clr = $('#clr'), fb = $('#fbtn'), fp = $('#fpanel');
  const sync = () => { clr.hidden = !qi.value; fb.classList.toggle('dot', hs.subj !== 'all' || hs.type !== 'all' || hs.unit !== 'all'); };
  qi.addEventListener('input', e => { hs.q = e.target.value; sync(); homeList(false); });
  clr.addEventListener('click', () => { qi.value = ''; hs.q = ''; sync(); homeList(false); qi.focus(); });
  fb.addEventListener('click', e => { e.preventDefault(); const o = fp.hidden; fp.hidden = !o; fb.setAttribute('aria-expanded', o); fb.classList.toggle('open', o); });
  document.addEventListener('click', e => { if (!e.target.closest('.sw') && !fp.hidden) { fp.hidden = true; fb.classList.remove('open'); } });
  sync();
  $('#g-subj').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; hs.subj = b.dataset.k; hs.unit = 'all'; sync(); $$('#g-subj .chip').forEach(c => c.classList.toggle('on', c === b)); homeUnitOptions(); homeList(true); });
  $('#g-type').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; hs.type = b.dataset.k; sync(); $$('#g-type .chip').forEach(c => c.classList.toggle('on', c === b)); homeList(true); });
  $('#unit-sel').addEventListener('change', e => { hs.unit = e.target.value; sync(); homeList(true); });
}

/* ---------- 과목 / 단원 ---------- */
const ETC_TAB = '<a href="#etc-gyegi"><b>02</b><span style="display:inline">계기 교육</span></a>';
const ytId = u => (String(u).match(/youtu\.be\/([\w-]+)/) || [])[1];
const thumbOf = u => ytId(u) ? `https://i.ytimg.com/vi/${ytId(u)}/mqdefault.jpg` : '';
function renderGyegi(sub){
  const G = DB.gyegi, key = G[sub] ? sub : 'jeju43', d = G[key];
  const ub = '';
  const tabs = `<div class="gy-tabs" role="tablist">${['jeju43', 'korean-war'].map(k => `<a role="tab" aria-selected="${k === key}" class="${k === key ? 'on' : ''}" href="#etc-gyegi-${k}">${esc(G[k].title)}</a>`).join('')}</div>`;
  const ext = `<span>↗</span>`;
  const thumb = u => thumbOf(u) ? `<img src="${thumbOf(u)}" alt="" loading="lazy" draggable="false" onerror="if(!this.dataset.f){this.dataset.f=1;this.src='https://img.youtube.com/vi/${ytId(u)}/mqdefault.jpg'}else{this.parentNode.classList.add('nt');this.remove()}">` : '';
  const R = {
    sites: s => `<div class="gy-sites">${s.items.map(it => it.url ? `<a class="gy-site" href="${esc(it.url)}" target="_blank" rel="noopener"><small>${esc(it.meta)}</small><strong>${esc(it.title)}</strong><em>바로가기 ${ext}</em></a>` : `<div class="gy-site off"><small>${esc(it.meta)}</small><strong>${esc(it.title)}</strong></div>`).join('')}</div>`,
    videos: s => `<div class="gy-vgrid">${s.items.map(it => it.url ? `<a class="gy-v" href="${esc(it.url)}" target="_blank" rel="noopener"><span class="gy-th">${thumb(it.url)}<i class="pl"></i></span><strong>${esc(it.title)}</strong>${it.meta ? `<small>${esc(it.meta)}</small>` : ''}</a>` : `<div class="gy-v off"><span class="gy-th nt"></span><strong>${esc(it.title)}</strong>${it.meta ? `<small>${esc(it.meta)}</small>` : ''}<small class="soon">링크 준비 중</small></div>`).join('')}</div>`,
    films: s => `<div class="gy-films">${s.items.map(f => `<article class="gy-f"><header><strong>${esc(f.title)}</strong>${f.meta ? `<small>${esc(f.meta)}</small>` : ''}</header>${f.note ? `<p>${esc(f.note)}</p>` : ''}<ul>${f.clips.map(c => `<li><a href="${esc(c.url)}" target="_blank" rel="noopener"><span class="gy-th sm">${thumb(c.url)}<i class="pl"></i></span><span class="ct"><b>${esc(c.title)}</b>${c.meta ? `<small>${esc(c.meta)}</small>` : ''}</span>${ext}</a></li>`).join('')}</ul></article>`).join('')}</div>`,
    songs: s => `<div class="gy-songs">${s.items.map(it => `<a class="gy-song" href="${esc(it.url)}" target="_blank" rel="noopener"><span class="gy-th sm">${thumb(it.url)}<i class="pl"></i></span><span class="ct"><strong>${esc(it.title)}</strong>${it.meta ? `<small>${esc(it.meta)}</small>` : ''}</span>${ext}</a>`).join('')}</div>`,
    books: s => `<div class="gy-books">${s.items.map((b, i) => `<div class="gy-book c${i % 5}"><em>${esc(b.tag || '')}</em><strong>${esc(b.title)}</strong>${b.meta ? `<small>${esc(b.meta)}</small>` : ''}</div>`).join('')}</div>${s.items.filter(b => b.excerpt).map(b => `<details class="gy-ex"><summary>『${esc(b.title)}』 수업 발췌문 보기</summary>${b.excerpt.map(p => `<p>${esc(p)}</p>`).join('')}<small>— ${esc(b.meta)}, 『${esc(b.title)}』</small></details>`).join('')}`
  };
  const nav = [['topic', '탐구 주제'], ...d.sections.map(s => [s.id, s.title])];
  const body = `<nav class="gy-nav" id="gy-nav">${nav.map(([id, t]) => `<a href="#" data-t="gy-${id}">${t}</a>`).join('')}</nav>
    <section class="gy-s" id="gy-topic"><h2>탐구 주제</h2><ol class="gy-topics">${d.topics.map(t => `<li>${esc(t)}</li>`).join('')}</ol>${(d.extra || []).length ? `<div class="gy-extra"><span>함께 다룰 주제</span>${d.extra.map(x => `<i>${esc(x)}</i>`).join('')}</div>` : ''}</section>
    ${d.sections.map(s => `<section class="gy-s" id="gy-${s.id}"><h2>${esc(s.title)}<i>${s.items.length}</i></h2>${R[s.kind](s)}</section>`).join('')}`;
  view.innerHTML = band({ cls:'s-etc', crumb:`<a href="#home">홈</a> › <a href="#etc">기타자료</a> › 계기 교육`, title:'계기 교육', desc:'', img: bandImg('images/sections/etc.webp') }) + `<div class="wrap s-etc gy">${ub}${tabs}${body}</div>`;
  $('#gy-nav').addEventListener('click', e => { const a = e.target.closest('a'); if (!a) return; e.preventDefault(); const t = $('#' + a.dataset.t); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nh')) || 64) - 18, behavior:'smooth' }); });
}

/* ===== 교과 수업 학습지 아카이브 (토글 → 선생님 탭 → 학습지 페이지) ===== */
const TEACHERS = [['jaehoon', '노재훈T'], ['yeseul', '오예슬T'], ['hyunji', '주현지T']];
const wsSets = (subj, slug) => (DB.worksheets || []).filter(w => w.subject === subj && (!slug || w.slug === slug));
function wsHTML(subj){
  let open = false; try { open = localStorage.getItem('wsopen') === '1'; } catch (e) {}
  const n = wsSets(subj).length;
  return `<section class="ws${open ? ' open' : ''}" id="ws"><button type="button" class="ws-t" id="ws-t" aria-expanded="${open}"><span><b>교과 수업 학습지 아카이브</b><small>${n ? `${n}개 학습지 묶음` : '준비 중'}</small></span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
    <div class="ws-w"><div class="ws-in"><div class="ws-tabs">${TEACHERS.map(([k, t]) => { const c = wsSets(subj, k).length; return c ? `<a href="#${subj}-ws-${k}">${esc(t)}<i>${c}</i></a>` : `<span class="off">${esc(t)}<i>준비 중</i></span>`; }).join('')}${wsCmpOk(subj) ? `<a class="cmpb" href="#${subj}-ws-compare">단원별 비교</a>` : ''}</div></div></div></section>`;
}
const wsUnitList = subj => (DB.wsUnits && DB.wsUnits[subj]) || [];
function wsUnitRows(subj){
  const m = new Map(wsUnitList(subj).map(u => [u.id, { u, rows: [] }]));
  wsSets(subj).forEach(w => w.chapters.forEach((c, i) => { const e = c.u && m.get(c.u); if (e) e.rows.push({ w, c, from: c.from, to: w.chapters[i + 1] ? w.chapters[i + 1].from - 1 : w.pages }); }));
  m.forEach(e => { e.tn = new Set(e.rows.map(r => r.w.slug)).size; });
  return m;
}
const nsp = t => String(t).toLowerCase().replace(/[\s.·,\-_:;()\[\]「」『』“”‘’'"?!~]/g, '');
function openLbx(list, i) {
  const z = document.createElement('div'); z.className = 'lbx'; let cur = i;
  z.innerHTML = '<img alt="" draggable="false"><button class="lbx-b lbx-p" aria-label="이전">‹</button><button class="lbx-b lbx-n" aria-label="다음">›</button><span class="lbx-c"></span><button class="lbx-x" aria-label="닫기">✕</button>';
  const im = z.querySelector('img'), ct = z.querySelector('.lbx-c');
  const show = k => { if (k < 0 || k >= list.length) return; cur = k; im.src = list[k].src; ct.textContent = (k + 1) + ' / ' + list.length; z.scrollTop = 0; z.querySelector('.lbx-p').disabled = k === 0; z.querySelector('.lbx-n').disabled = k === list.length - 1; };
  const off = () => { z.remove(); removeEventListener('keydown', kk); document.documentElement.style.overflow = ''; };
  const kk = ev => { if (ev.key === 'Escape') off(); else if (ev.key === 'ArrowLeft') show(cur - 1); else if (ev.key === 'ArrowRight') show(cur + 1); };
  let sx = null;
  z.addEventListener('touchstart', e => { sx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
  z.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 60) show(cur + (dx < 0 ? 1 : -1)); });
  z.addEventListener('click', e => { if (e.target.closest('.lbx-p')) show(cur - 1); else if (e.target.closest('.lbx-n')) show(cur + 1); else if (e.target.tagName !== 'IMG') off(); });
  addEventListener('keydown', kk); document.documentElement.style.overflow = 'hidden'; document.body.appendChild(z); show(i);
}
function wL(w, p) { return w.land === 'all' || (Array.isArray(w.land) && w.land.includes(p)); }
function wsFind(test, subj){
  const ws = [], cmp = [], UM = {};
  Object.keys(DB.wsUnits || {}).forEach(sj => DB.wsUnits[sj].forEach(u => { UM[u.id] = u; }));
  (DB.worksheets || []).forEach(w => { if (subj && subj !== 'all' && w.subject !== subj) return;
    const sets = wsSets(w.subject, w.slug), si = sets.indexOf(w), href = `#${w.subject}-ws-${w.slug}${sets.length > 1 ? '-' + (si + 1) : ''}`;
    w.chapters.forEach(c => {
      const u = c.u && UM[c.u], ti = test(c.n + ' ' + c.title), meta = test([w.teacher, w.term, w.title, w.sub || '', c.n, c.title].join(' '));
      const hit = u ? (u.k || []).filter(k => test(k)) : [], kw = !hit.length && u && (u.k || []).length ? test((u.k || []).join(' ')) : false;
      if (meta || hit.length || kw) ws.push({ w, c, href, p: c.from, rank: ti ? 0 : meta ? 1 : 2, sn: ti || meta ? '' : hit.length ? hit.slice(0, 4).join(' · ') : '' });
    }); });
  ws.sort((a, b) => a.rank - b.rank);
  (!subj || subj === 'all' ? Object.keys(DB.wsUnits || {}) : [subj]).forEach(sj => wsUnitRows(sj).forEach(e => { if (e.rows.length && e.tn > 1 && test(e.u.t + ' ' + e.u.g + ' 단원별 비교 ' + (e.u.k || []).join(' '))) cmp.push({ e, sj, href: `#${sj}-ws-compare-${e.u.id}` }); }));
  return { ws, cmp };
}
const wsCmpOk = subj => { let ok = false; wsUnitRows(subj).forEach(e => { if (e.tn > 1) ok = true; }); return ok; };
function initWs(){
  const b = $('#ws-t'); if (!b) return;
  b.addEventListener('click', () => { const s = $('#ws'), o = !s.classList.contains('open'); s.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); try { localStorage.setItem('wsopen', o ? '1' : '0'); } catch (e) {} });
}
function renderWs(subj, arg){
  if (/^ws-compare/.test(arg)) { renderWsCmp(subj, arg); return; }
  const m = arg.match(/^ws-([a-z]+)(?:-(\d+))?$/), slug = m && m[1], sets = m ? wsSets(subj, slug) : [];
  if (!sets.length) { location.hash = subj; return; }
  const si = Math.min(sets.length - 1, Math.max(0, (m[2] ? +m[2] : 1) - 1)), w = sets[si], CH = w.chapters, teacher = sets[0].teacher;
  const UR = wsUnitRows(subj);
  view.innerHTML = `<div class="wrap"><div class="notes wsp">
    <div class="crumb" style="color:var(--sub)"><a href="#home">홈</a> › <a href="#${subj}">${SUBJ[subj]}</a> › 학습지 아카이브 › ${esc(teacher)}</div>
    <h1>${esc(teacher)} <small>학습지</small></h1>
    ${sets.length > 1 ? `<div class="wsp-sets">${sets.map((x, i) => `<a class="${i === si ? 'on' : ''}" href="#${subj}-ws-${slug}-${i + 1}">${esc(x.term)}</a>`).join('')}</div>` : ''}
    <div class="wsp-head"><div><h2>${esc(w.title)}</h2><p>${esc(w.sub || '')}${w.sub ? ' · ' : ''}${w.pages}쪽</p></div>${w.file ? `<a class="notebtn" href="${esc(w.file)}" download>${w.file.split(".").pop().toUpperCase()} 다운로드 <span>↓</span></a>` : ''}</div>
    <div class="nload" id="nload"><div class="ring"></div><p>학습지를 불러오는 중… <b id="nl-pct">0%</b></p><div class="ld-bar"><i id="nl-bar"></i></div></div>
    <div id="nbody" hidden>
      <div class="jumpbar" id="jumpbar">
        <div class="jb-top"><button type="button" class="jb-arr" id="jb-prev" aria-label="이전">‹</button>
          <button type="button" class="jb-now" id="jb-now" aria-expanded="false"><span class="jb-lb">목차</span><span class="jb-t" id="jb-t"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
          <button type="button" class="jb-arr" id="jb-next" aria-label="다음">›</button></div>
        <div class="jumps" id="jumps">${CH.map((c, i) => `<button type="button" class="cj" data-i="${i}"><b>${esc(c.n)}</b><span>${esc(c.title)}</span></button>`).join('')}</div>
        <div class="jb-all" id="jb-all" hidden>${CH.map((c, i) => `<button type="button" class="ja" data-i="${i}"><b>${esc(c.n)}</b><span>${esc(c.title)}</span><i>${c.from}쪽</i></button>`).join('')}</div>
      </div>
      <div class="pgs" id="pgs"></div>
      <div class="pnrow"><a class="pnbtn" href="#${subj}">← ${SUBJ[subj]} 자료로</a><a class="pnbtn" href="#" id="totop">맨 위로 ↑</a></div>
    </div></div></div>`;
  let cur = -1, lock = 0;
  const bar = $('#jumpbar'), jumps = $('#jumps'), all = $('#jb-all'), nowBtn = $('#jb-now');
  const barH = () => (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nh')) || 64) + bar.offsetHeight + 16;
  const anchor = i => $('#pg' + CH[i].from);
  const setCur = (i, center) => {
    if (i === cur) return; cur = i;
    $$('.cj', jumps).forEach((x, k) => x.classList.toggle('on', k === i));
    $$('.ja', all).forEach((x, k) => x.classList.toggle('on', k === i));
    $('#jb-t').textContent = `${CH[i].n} · ${CH[i].title}`;
    $('#jb-prev').disabled = i === 0; $('#jb-next').disabled = i === CH.length - 1;
    const c = $$('.cj', jumps)[i]; if (c) jumps.scrollTo({ left: c.offsetLeft - (jumps.clientWidth - c.offsetWidth) / 2, behavior: center === false ? 'auto' : 'smooth' });
  };
  const go = i => { i = Math.max(0, Math.min(CH.length - 1, i)); const t = anchor(i); if (!t) return; setCur(i); lock = Date.now() + 900; window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - barH(), behavior: 'smooth' }); all.hidden = true; nowBtn.setAttribute('aria-expanded', 'false'); };
  const spy = () => { if (Date.now() < lock) return; if (!document.body.contains(bar)) { removeEventListener('scroll', spy); return; } const line = barH() + 8; let k = 0; CH.forEach((c, i) => { const t = anchor(i); if (t && t.getBoundingClientRect().top <= line) k = i; }); setCur(k); };
  addEventListener('scroll', spy, { passive: true });
  jumps.addEventListener('click', e => { const c = e.target.closest('.cj'); if (c) go(+c.dataset.i); });
  all.addEventListener('click', e => { const c = e.target.closest('.ja'); if (c) go(+c.dataset.i); });
  nowBtn.addEventListener('click', () => { all.hidden = !all.hidden; nowBtn.setAttribute('aria-expanded', String(!all.hidden)); });
  $('#jb-prev').addEventListener('click', () => go(cur - 1)); $('#jb-next').addEventListener('click', () => go(cur + 1));
  $('#totop').addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  /* 들어올 때마다 이미지를 모두 받아 오며 로딩 표시 */
  const t0 = Date.now(), pct = $('#nl-pct'), pb = $('#nl-bar'); let d = 0; const tot = w.pages;
  const fin = () => setTimeout(() => {
    const body = $('#nbody'); if (!body) return;
    $('#pgs').innerHTML = Array.from({ length: tot }, (_, i) => { const p = i + 1, st = CH.find(c => c.from === p);
      return `<figure class="pgf" id="pg${p}">${st ? `<figcaption class="pgc"><span>${esc(st.n)} · ${esc(st.title)}</span>${st.u && (UR.get(st.u) || {}).tn > 1 ? `<a class="pgc-c" href="#${subj}-ws-compare-${st.u}">다른 선생님과 비교 ›</a>` : ''}</figcaption>` : ''}<div class="pgw"><img src="${w.dir}/p-${p}.webp" alt="${esc(w.title)} ${p}쪽" draggable="false" width="${wL(w,p) ? w.h : w.w}" height="${wL(w,p) ? w.w : w.h}"></div></figure>`; }).join('');
    $('#pgs').onclick = e => { const im = e.target.closest('img'); if (!im) return; const l = [...$$('#pgs img')]; openLbx(l, l.indexOf(im)); };
    body.hidden = false; const l = $('#nload'); if (l) l.remove(); setCur(0, false);
    let wj = null; try { wj = JSON.parse(sessionStorage.getItem('wj') || 'null'); sessionStorage.removeItem('wj'); } catch (e) {}
    if (wj && wj.id === w.id) { const t = $('#pg' + wj.p); if (t) { const ci = CH.reduce((a, c, i) => c.from <= wj.p ? i : a, 0); setCur(ci, false); window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - barH() }); } }
  }, Math.max(0, 500 - (Date.now() - t0)));
  for (let p = 1; p <= tot; p++) { const im = new Image(); im.onload = im.onerror = () => { d++; if (pct) pct.textContent = Math.round(d / tot * 100) + '%'; if (pb) pb.style.width = (d / tot * 100) + '%'; if (d === tot) fin(); }; im.src = `${w.dir}/p-${p}.webp`; }
}
/* ===== 단원별 비교 ===== */
let cmpSel = null;
function renderWsCmp(subj, arg){
  const UR = wsUnitRows(subj), list = [...UR.values()].filter(e => e.rows.length);
  if (!list.length) { location.hash = subj; return; }
  const mu = arg.match(/^ws-compare-(u\d+)$/);
  const cur = (mu && UR.get(mu[1]) && UR.get(mu[1]).rows.length ? UR.get(mu[1]) : list.find(e => e.tn > 1) || list[0]);
  const idx = list.indexOf(cur), tn = new Map(); cur.rows.forEach(r => { if (!tn.has(r.w.slug)) tn.set(r.w.slug, r.w.teacher); });
  const teachers = TEACHERS.filter(([k]) => tn.has(k)).map(([k]) => [k, tn.get(k)]);
  const mob = matchMedia('(max-width:760px)').matches;
  let sel = (cmpSel || []).filter(k => tn.has(k)); if (!sel.length || mob) sel = mob ? [(sel[0] || teachers[0][0])] : teachers.map(t => t[0]);
  const groups = []; list.forEach(e => { let g = groups.find(x => x.g === e.u.g); if (!g) groups.push(g = { g: e.u.g, items: [] }); g.items.push(e); });
  const pgs = r => r.from === r.to ? `${r.from}쪽` : `${r.from}~${r.to}쪽`;
  view.innerHTML = `<div class="wrap"><div class="notes wsp cmp">
    <div class="crumb" style="color:var(--sub)"><a href="#home">홈</a> › <a href="#${subj}">${SUBJ[subj]}</a> › 학습지 아카이브 › 단원별 비교</div>
    <h1>단원별 비교 <small>학습지</small></h1>
    <div class="cmp-pick"><button type="button" class="jb-arr" id="cp-prev" aria-label="이전 단원"${idx === 0 ? ' disabled' : ''}>‹</button>
      <div class="cmp-sel"><select id="cp-sel" aria-label="단원 선택">${groups.map(g => `<optgroup label="${esc(g.g)}">${g.items.map(e => `<option value="${e.u.id}"${e === cur ? ' selected' : ''}>${esc(e.u.t)}${e.tn > 1 ? ` · ${e.tn}명` : ''}</option>`).join('')}</optgroup>`).join('')}</select><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></div>
      <button type="button" class="jb-arr" id="cp-next" aria-label="다음 단원"${idx === list.length - 1 ? ' disabled' : ''}>›</button></div>
    <p class="cmp-note">${cur.tn > 1 ? `${cur.tn}명의 학습지를 나란히 볼 수 있어요.` : `이 단원은 ${esc(teachers[0][1])} 학습지만 있어요.`}</p>
    ${teachers.length > 1 ? `<div class="cmp-t" id="cp-t">${teachers.map(([k, t]) => `<button type="button" data-k="${k}" class="${sel.includes(k) ? 'on' : ''}">${esc(t)}</button>`).join('')}</div>` : ''}
    <div class="nload" id="nload"><div class="ring"></div><p>학습지를 불러오는 중… <b id="nl-pct">0%</b></p><div class="ld-bar"><i id="nl-bar"></i></div></div>
    <div id="nbody" hidden><div class="cmp-cols" id="cp-cols"></div>
      <div class="pnrow"><a class="pnbtn" href="#${subj}">← ${SUBJ[subj]} 자료로</a><a class="pnbtn" href="#" id="totop">맨 위로 ↑</a></div></div></div></div>`;
  const col = ([k, t]) => { const rs = cur.rows.filter(r => r.w.slug === k);
    return `<section class="cmp-c" data-k="${k}"><h3>${esc(t)}</h3>${rs.map(r => `<div class="cmp-b"><div class="cmp-bh"><div><b>${esc(r.c.n)} · ${esc(r.c.title)}</b><small>${esc(r.w.term)} · ${pgs(r)}</small></div>${r.w.file ? `<a href="${esc(r.w.file)}" download title="${esc(r.w.file.split('.').pop().toUpperCase())} 다운로드">${esc(r.w.file.split('.').pop().toUpperCase())} ↓</a>` : ''}</div>`
      + Array.from({ length: r.to - r.from + 1 }, (_, i) => `<figure class="pgf"><div class="pgw"><img src="${r.w.dir}/p-${r.from + i}.webp" alt="${esc(t)} ${esc(r.c.title)} ${r.from + i}쪽" draggable="false" data-z="1" width="${wL(r.w, r.from + i) ? r.w.h : r.w.w}" height="${wL(r.w, r.from + i) ? r.w.w : r.w.h}"></div></figure>`).join('') + '</div>').join('')}</section>`; };
  const paint = () => { const c = $('#cp-cols'); if (!c) return; const vis = teachers.filter(([k]) => sel.includes(k)); c.style.setProperty('--n', vis.length); c.innerHTML = vis.map(col).join(''); };
  $$('#cp-t button').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.k, m = matchMedia('(max-width:760px)').matches;
    if (m) sel = [k]; else if (sel.includes(k)) { if (sel.length > 1) sel = sel.filter(x => x !== k); } else sel = teachers.map(t => t[0]).filter(x => sel.includes(x) || x === k);
    cmpSel = sel.slice(); $$('#cp-t button').forEach(x => x.classList.toggle('on', sel.includes(x.dataset.k))); paint();
  }));
  const goU = id => { location.hash = `${subj}-ws-compare-${id}`; };
  $('#cp-sel').addEventListener('change', e => goU(e.target.value));
  $('#cp-prev').addEventListener('click', () => goU(list[idx - 1].u.id)); $('#cp-next').addEventListener('click', () => goU(list[idx + 1].u.id));
  $('#totop').addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('#cp-cols').addEventListener('click', e => { const im = e.target.closest('img[data-z]'); if (!im) return; const l = [...$$('#cp-cols img[data-z]')].filter(x => x.offsetParent); openLbx(l, Math.max(0, l.indexOf(im))); });
  /* 들어올 때마다 이미지를 모두 받아 오며 로딩 표시 */
  const urls = []; cur.rows.forEach(r => { for (let p = r.from; p <= r.to; p++) urls.push(`${r.w.dir}/p-${p}.webp`); });
  const t0 = Date.now(), pct = $('#nl-pct'), pb = $('#nl-bar'); let d = 0; const tot = urls.length;
  const fin = () => setTimeout(() => { const body = $('#nbody'); if (!body) return; paint(); body.hidden = false; const l = $('#nload'); if (l) l.remove(); }, Math.max(0, 500 - (Date.now() - t0)));
  urls.forEach(u => { const im = new Image(); im.onload = im.onerror = () => { d++; if (pct) pct.textContent = Math.round(d / tot * 100) + '%'; if (pb) pb.style.width = (d / tot * 100) + '%'; if (d === tot) fin(); }; im.src = u; });
}
function renderSubject(subj, arg){
  const units = UNITS[subj], cls = `s-${subj}`;
  const home = '<a href="#home">홈</a>';
  let unit = null;
  const GR = { busan:'부산역사교사모임' }, grp = subj === 'etc' && GR[arg] ? GR[arg] : null;
  if (subj === 'etc' && arg && arg.startsWith('gyegi')) { renderGyegi(arg.slice(6).replace(/^-/, '') || 'jeju43'); return; }
  if (subj !== 'etc' && arg && /^ws-/.test(arg)) { renderWs(subj, arg); return; }
  if (subj !== 'etc' && arg && arg !== 'all') { unit = udec(arg); if (!units.some(u => u[0] === unit)) { location.hash = subj; return; } }
  const items = DB.materials.filter(m => inSubj(m, subj) && (unit == null || m.unit === unit) && (!grp || m.group === grp));
  let crumb, title, img;
  if (subj === 'etc') { crumb = grp ? `${home} › <a href="#etc">기타자료</a> › ${grp}` : `${home} › 기타자료`; title = grp || '기타 수업자료'; img = bandImg('images/sections/etc.webp'); }
  else if (unit == null) { crumb = `${home} › ${SUBJ[subj]}`; title = `${SUBJ[subj]} 전체 자료`; img = bandImg(`images/sections/${subj}.webp`); }
  else { crumb = `${home} › <a href="#${subj}">${SUBJ[subj]}</a> › ${unitLabel(unit)}`; title = unit === '기타' ? `${SUBJ[subj]} 단원 외 자료` : unitTitle(subj, unit); img = bandImg(`images/units/${subj}-${ucode(unit)}.webp`, `images/sections/${subj}.webp`); }
  const ub = '';
  view.innerHTML = band({ cls, crumb, title, desc: '', img }) + `<div class="wrap ${cls}">${subj !== 'etc' && unit == null ? wsHTML(subj) : ''}${ub}<section class="sec"><div id="lib"></div></section></div>`;
  if (subj !== 'etc' && unit == null) initWs();
  mountList(items, null, subj !== 'etc' && unit == null ? subj : null, grp ? 'old' : undefined);
}

/* ---------- 소개 ---------- */
function renderAbout(){
  const A = DB.about, mk = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<mark>$1</mark>');
  const para = t => `<p>${mk(t)}</p>`;
  const rows = arr => `<dl class="ab-rows">${arr.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${mk(v)}</dd></div>`).join('')}</dl>`;
  const qs = arr => `<div class="ab-q"><h4>함께 고민할 질문</h4><ul>${arr.map(q => `<li>${esc(q)}</li>`).join('')}</ul></div>`;
  const sec = (id, n, t, body) => `<section id="${id}" class="ab-s"><div class="ab-l"><b>${n}</b><h2>${esc(t)}</h2></div><div class="ab-r">${body}</div></section>`;
  const half = (S) => `<div class="ab-tag">${esc(S.tag)}</div><h3 class="ab-head">${esc(S.head)}</h3>${para(S.text)}${S.text2 ? para(S.text2) : ''}<h4 class="ab-sub">${esc(S.itemsTitle)}</h4>${rows(S.items)}${qs(S.qs)}`;
  const NAV = [['ab1', '활동 방향'], ['ab2', '상반기'], ['ab3', '하반기'], ['ab4', '2027년'], ['ab5', '연간 흐름'], ['ab6', '지향하는 수업']];
  view.innerHTML = band({ cls:'s-about', crumb:'<a href="#home">홈</a> › 모임 소개', title:'모임 소개', desc:'', img: bandImg('images/sections/about.webp') }) + `
  <div class="wrap s-about ab">
    <header class="ab-top"><span class="ab-eyebrow">동부산 역사교사모임</span><h2>${esc(A.lead)}</h2>${A.intro.map(para).join('')}
      <nav class="ab-nav" id="ab-nav">${NAV.map(([id, t]) => `<a href="#" data-t="${id}">${t}</a>`).join('')}</nav></header>
    ${sec('ab1', '1', A.s1.title, `<div class="ab-key"><span>${esc(A.s1.key)}</span><p>${mk(A.s1.keyText)}</p></div>${rows(A.s1.items)}`)}
    ${sec('ab2', '2', A.s2.title, half(A.s2))}
    ${sec('ab3', '3', A.s3.title, half(A.s3))}
    ${sec('ab4', '4', A.s4.title, `<div class="ab-tag">${esc(A.s4.tag)}</div><h3 class="ab-head">${esc(A.s4.head)}</h3>${para(A.s4.text)}${para(A.s4.text2)}<h4 class="ab-sub">${esc(A.s4.booksTitle)}</h4>${rows(A.s4.books.map(([t, d]) => ['『' + t + '』', d]))}${para(A.s4.after)}`)}
    ${sec('ab5', '5', A.s5.title, `<p class="ab-subt">${esc(A.s5.sub)}</p><ol class="ab-tl">${A.s5.steps.map(([w, t, d]) => `<li><span>${esc(w)}</span><strong>${esc(t)}</strong><p>${esc(d)}</p></li>`).join('')}</ol>`)}
    ${sec('ab6', '6', A.s6.title, `${para(A.s6.text)}<blockquote>${mk(A.s6.quote)}</blockquote>${para(A.s6.after)}`)}
  </div>`;
  $('#ab-nav').addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return; e.preventDefault();
    const t = $('#' + a.dataset.t); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nh')) || 64) - 20, behavior: 'smooth' });
  });
}

/* ---------- 독서 모임 ---------- */
const COVER = ['s-books', 's-world', 's-korea'];
function coverHTML(b){
  if (b.cover) return `<div class="cv real"><img src="${esc(b.cover)}" alt="${esc(b.title)} 표지" loading="lazy"></div>`;
  const n = (b.id - 1) % 3;
  return `<div class="cv ${COVER[n]}"><img class="ov" src="images/books/${b.id}.webp" alt="" onload="this.parentNode.classList.add('hasimg')" onerror="this.remove()"><span class="t">${esc(b.title)}</span><span class="a">${esc(b.author)}</span></div>`;
}
const bookSub = b => [b.author, b.publisher, b.month ? fmt(esc(b.month)) : ''].filter(Boolean).join(' · ');
/* 모임 자료(발표 PDF 전체를 쪽 그대로 보여 줌) */
function notesView(b){
  const n = b.notes, pg = i => String(i).padStart(2, '0'), CH = n.chapters;
  const chip = (c, i) => `<button type="button" class="cj" data-i="${i}"><b>${String(c.n).padStart(2, '0')}</b><span>${esc(c.title)}</span></button>`;
  view.innerHTML = `
  <div class="wrap"><div class="notes">
    <div class="crumb" style="color:var(--sub)"><a href="#home">홈</a> › <a href="#books">독서 모임</a> › <a href="#books-${b.id}">${esc(b.title)}</a></div>
    <h1>${esc(b.title)} <small>모임 자료</small></h1>
    <div class="nt-top">
      
      <div class="hl-tools" id="hl-tools"><span class="fsz"><button type="button" id="fs-m" aria-label="글자 작게" style="font-size:12px">가</button><button type="button" id="fs-p" aria-label="글자 크게" style="font-size:17px">가</button></span><span id="hl-n"></span><button type="button" id="hl-list" hidden>모아보기</button><button type="button" id="hl-clear" hidden>모두 지우기</button></div>
    </div>
    <div class="nload" id="nload"><div class="ring"></div><p>모임 자료를 불러오는 중… <b id="nl-pct">0%</b></p><div class="ld-bar"><i id="nl-bar"></i></div></div>
    <div id="nbody" hidden>
    <div class="jumpbar" id="jumpbar">
      <div class="jb-top"><button type="button" class="jb-arr" id="jb-prev" aria-label="이전 장">‹</button>
        <button type="button" class="jb-now" id="jb-now" aria-expanded="false"><span class="jb-lb">목차</span><span class="jb-t" id="jb-t"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
        <button type="button" class="jb-arr" id="jb-next" aria-label="다음 장">›</button></div>
      <div class="jumps" id="jumps">${CH.map(chip).join('')}</div>
      <div class="jb-all" id="jb-all" hidden>${CH.map((c, i) => `<button type="button" class="ja" data-i="${i}"><b>${String(c.n).padStart(2, '0')}</b><span>${esc(c.title)}</span>${c.by ? `<i>${esc(c.by)}</i>` : ''}</button>`).join('')}</div>
    </div>
    <p class="hl-hint" id="hl-hint">글을 드래그해서 선택하면 형광펜 아이콘이 나와요. 칠한 곳을 누르면 지울 수 있어요. (이 기기에만 저장돼요)</p>
    <div id="pane-text" class="tx-pane"></div>
    <div class="pgs" id="pgs"></div></div>
    <div class="pnrow"><a class="pnbtn" href="#books-${b.id}">← 책 소개로</a><a class="pnbtn" href="#" id="totop">맨 위로 ↑</a></div>
    </div>
  </div></div>`;
  let mode = 'text', TX = null, imgBuilt = false, cur = -1, lock = 0;
  const bar = $('#jumpbar'), jumps = $('#jumps'), all = $('#jb-all'), nowBtn = $('#jb-now');
  const barH = () => (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nh')) || 64) + bar.offsetHeight + 16;
  const anchor = i => mode === 'text' ? $('#tc' + i) : $('#pg' + CH[i].from);
  /* ---- 글 렌더 ---- */
  const cell = c => { if (!/(^|\s)[-–]\s/.test(c)) return esc(c); const p = c.split(/(?:^|\s)[-–]\s+/).map(x => x.trim()), head = p.shift(); const li = p.filter(Boolean); return (head ? `<span class="ch">${esc(head)}</span>` : '') + `<ul class="cl">${li.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`; };
  const tbl = rows => { const w = rows[0].length, hd = w >= 3 && rows.length > 1;
    return `<div class="tbw"><table class="tt${w === 2 && rows.length > 1 ? ' c2' : ''}">${rows.map((r, ri) => `<tr>${r.map(c => (hd && ri === 0) ? `<th>${esc(c)}</th>` : `<td>${cell(c)}</td>`).join('')}</tr>`).join('')}</table></div>`; };
  const blk = x => {
    switch (x.k) {
      case 'h': return `<h3>${esc(x.t)}</h3>`;
      case 'sec': return `<h4 class="sec">${esc(x.t)}</h4>`;
      case 'q': return `<p class="q">${esc(x.t)}</p>`;
      case 'a': return `<p class="a">${esc(x.t)}</p>`;
      case 'li': return `<p class="li">${esc(x.t)}</p>`;
      case 'sum': return `<p class="sum">${esc(x.t)}</p>`;
      case 'quote': return `<p class="qt">${esc(x.t)}</p>`;
      case 'box': return `<div class="bx">${x.t.map(t => `<p>${esc(t)}</p>`).join('')}</div>`;
      case 'tbl': return tbl(x.rows);
      case 'img': return `<figure class="tfig"><img src="${esc(x.src)}" alt="${esc(x.alt || '')}" draggable="false" loading="lazy"></figure>`;
      default: return `<p>${esc(x.t)}</p>`;
    }
  };
  const art = (c, i, meta) => {
    const fns = c.blocks.filter(x => x.k === 'fn'), body = c.blocks.filter(x => x.k !== 'fn');
    return `<article class="tx" id="tc${i}" data-c="${i}"><header class="txh"><small>제${c.n}장${c.by ? ` · ${esc(c.by)}` : ''}</small><h2>${esc(c.title)}</h2></header>${body.map(blk).join('')}${fns.length ? `<aside class="fns"><h4>각주</h4>${fns.map(f => `<p>${esc(f.t)}</p>`).join('')}</aside>` : ''}</article>`;
  };
  /* ---- 형광펜 ---- */
  const HK = 'hl-china'; let HL = {};
  try { HL = JSON.parse(localStorage.getItem(HK) || '{}') || {}; } catch (e) { HL = {}; }
  const persist = () => { try { localStorage.setItem(HK, JSON.stringify(HL)); } catch (e) {} };
  const merge = a => { const s = a.map(x => [x[0], x[1]]).sort((p, q) => p[0] - q[0]), o = []; s.forEach(x => { const l = o[o.length - 1]; if (l && x[0] <= l[1]) l[1] = Math.max(l[1], x[1]); else o.push(x); }); return o; };
  const textNodes = root => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), a = []; let t; while ((t = w.nextNode())) a.push(t); return a; };
  const applyHL = a => {
    $$('mark.hl', a).forEach(m => { const p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); });
    a.normalize();
    const iv = merge(HL[a.dataset.c] || []); if (!iv.length) return;
    let pos = 0; const per = [];
    textNodes(a).forEach(nd => { const len = nd.nodeValue.length, loc = []; iv.forEach(([s, e]) => { const st = Math.max(s, pos), en = Math.min(e, pos + len); if (st < en) loc.push([st - pos, en - pos, s]); }); if (loc.length) per.push([nd, loc]); pos += len; });
    per.forEach(([nd, loc]) => { loc.sort((p, q) => q[0] - p[0]).forEach(([s, e, g]) => { const mid = nd.splitText(s); mid.splitText(e - s); const m = document.createElement('mark'); m.className = 'hl'; m.dataset.s = g; mid.parentNode.insertBefore(m, mid); m.appendChild(mid); }); });
  };
  const count = () => Object.values(HL).reduce((t, a) => t + merge(a).length, 0);
  const upd = () => { const k = count(); $('#hl-n').textContent = k ? `형광펜 ${k}곳` : ''; $('#hl-clear').hidden = !k; $('#hl-list').hidden = !k; };
  const offsets = (a, r) => { const pre = document.createRange(); pre.selectNodeContents(a); pre.setEnd(r.startContainer, r.startOffset); const s = pre.toString().length; return [s, s + r.toString().length]; };
  const artOf = nd => { const el = nd && (nd.nodeType === 1 ? nd : nd.parentElement); return el ? el.closest('.tx') : null; };
  const hb = document.createElement('div'); hb.className = 'hlbar'; hb.hidden = true; hb.innerHTML = '<button type="button" id="hl-add" aria-label="형광펜 칠하기" title="형광펜"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg></button><button type="button" id="hl-del" aria-label="형광펜 지우기" title="지우기"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg></button>'; document.body.appendChild(hb);
  let pend = null;
  const place = rect => { hb.hidden = false; const w = hb.offsetWidth || 90, x = Math.max(8, Math.min(innerWidth - w - 8, rect.left + rect.width / 2 - w / 2)); let y = rect.bottom + 12; if (y + 50 > innerHeight) y = Math.max(8, rect.top - 54); hb.style.left = x + 'px'; hb.style.top = y + 'px'; };
  const hide = () => { hb.hidden = true; pend = null; };
  const placeEnd = sel => { const r = document.createRange(); try { r.setStart(sel.focusNode, sel.focusOffset); } catch (e) { return place(sel.getRangeAt(0).getBoundingClientRect()); } r.collapse(true);
    let rc = r.getClientRects()[0]; if (!rc || !rc.height) { const full = sel.getRangeAt(0).getClientRects(); const f = sel.focusNode === sel.getRangeAt(0).startContainer && sel.focusOffset === sel.getRangeAt(0).startOffset; rc = f ? full[0] : full[full.length - 1]; if (!rc) return; rc = f ? { left: rc.left, right: rc.left, top: rc.top, bottom: rc.bottom, height: rc.height } : { left: rc.right, right: rc.right, top: rc.top, bottom: rc.bottom, height: rc.height }; }
    hb.hidden = false; const w = hb.offsetWidth || 80, h = hb.offsetHeight || 40; let x = rc.right + 10, y = rc.top + rc.height / 2 - h / 2;
    if (x + w > innerWidth - 8) x = Math.max(8, rc.right - w - 4), y = rc.bottom + 6; y = Math.max(8, Math.min(innerHeight - h - 8, y)); hb.style.left = x + 'px'; hb.style.top = y + 'px'; };
  const onSel = () => {
    if (mode !== 'text') return hide();
    const sel = getSelection(); if (!sel || sel.isCollapsed || !sel.rangeCount) { if (!pend || pend.t !== 'del') hide(); return; }
    const r = sel.getRangeAt(0), a = artOf(r.startContainer); if (!a || !document.body.contains(a)) return hide();
    const [s, e0] = offsets(a, r), e = Math.min(e0, a.textContent.length); if (e <= s) return hide();
    pend = { t: 'add', a, s, e }; $('#hl-add').hidden = false; $('#hl-del').hidden = true; placeEnd(sel);
  };
  let tm = 0; const selH = () => { clearTimeout(tm); tm = setTimeout(onSel, 120); };
  document.addEventListener('selectionchange', selH);
  $('#hl-add', hb).addEventListener('click', () => { if (!pend || pend.t !== 'add') return; const k = pend.a.dataset.c; (HL[k] = HL[k] || []).push([pend.s, pend.e]); HL[k] = merge(HL[k]); persist(); applyHL(pend.a); getSelection().removeAllRanges(); hide(); upd(); });
  $('#hl-del', hb).addEventListener('click', () => { if (!pend || pend.t !== 'del') return; const k = pend.a.dataset.c; HL[k] = merge(HL[k] || []).filter(([s, e]) => !(s < pend.e && e > pend.s)); persist(); applyHL(pend.a); hide(); upd(); });
  const onClickMark = e => { const m = e.target.closest && e.target.closest('mark.hl'); if (!m) return; const sel = getSelection(); if (sel && !sel.isCollapsed) return; const a = artOf(m), r = document.createRange(); r.selectNodeContents(m); const [s, e2] = offsets(a, r); pend = { t: 'del', a, s, e: e2 }; $('#hl-add').hidden = true; $('#hl-del').hidden = false; const rs = m.getClientRects(), lr = rs[rs.length - 1] || m.getBoundingClientRect(); hb.hidden = false; const w = hb.offsetWidth || 44, h = hb.offsetHeight || 40; let x = lr.right + 8, y = lr.top + lr.height / 2 - h / 2; if (x + w > innerWidth - 8) { x = Math.max(8, lr.right - w); y = lr.bottom + 6; } y = Math.max(8, Math.min(innerHeight - h - 8, y)); hb.style.left = x + 'px'; hb.style.top = y + 'px'; };
  $('#pane-text').addEventListener('click', onClickMark);
  const offTap = e => { if (!hb.hidden && !hb.contains(e.target) && !(e.target.closest && e.target.closest('mark.hl'))) { const sel = getSelection(); if (!sel || sel.isCollapsed) hide(); } };
  document.addEventListener('pointerdown', offTap);
  /* 글자 크기 */
  const FS = [14, 15, 16, 17, 18, 20]; let fi = 2; try { const v = +localStorage.getItem('nfs'); if (v >= 0 && v < FS.length && localStorage.getItem('nfs') !== null) fi = v; } catch (e) {}
  const applyFs = () => { $('#pane-text').style.setProperty('--tfs', FS[fi] + 'px'); $('#fs-m').disabled = fi === 0; $('#fs-p').disabled = fi === FS.length - 1; try { localStorage.setItem('nfs', fi); } catch (e) {} };
  $('#fs-m').addEventListener('click', () => { if (fi > 0) { fi--; applyFs(); } });
  $('#fs-p').addEventListener('click', () => { if (fi < FS.length - 1) { fi++; applyFs(); } });
  applyFs();
  /* 형광펜 모아보기 */
  const pnl = document.createElement('div'); pnl.className = 'hlp'; pnl.hidden = true; document.body.appendChild(pnl);
  const closeP = () => { pnl.hidden = true; };
  const jumpTo = el => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - barH(), behavior: 'auto' });
  const openP = () => {
    const rows = []; Object.keys(HL).map(Number).sort((a, b) => a - b).forEach(c => { const a = $('#tc' + c); if (!a) return; const txt = a.textContent; merge(HL[c] || []).forEach(([s, e]) => rows.push({ c, s, e, t: txt.slice(s, e).replace(/\s+/g, ' ').trim() })); });
    let last = -1;
    pnl.innerHTML = `<div class="hlp-in"><div class="hlp-h"><b>형광펜 모아보기</b><button type="button" class="hlp-x" aria-label="닫기">×</button></div><div class="hlp-l">${rows.length ? rows.map(r => `${r.c !== last ? (last = r.c, `<h5>제${CH[r.c].n}장 · ${esc(CH[r.c].title)}</h5>`) : ''}<div class="hli"><button type="button" class="hlg" data-c="${r.c}" data-s="${r.s}">${esc(r.t.length > 140 ? r.t.slice(0, 140) + '…' : r.t)}</button><button type="button" class="hlr" data-c="${r.c}" data-s="${r.s}" data-e="${r.e}" aria-label="지우기"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg></button></div>`).join('') : '<p class="bempty">칠한 곳이 없어요.</p>'}</div></div>`;
    pnl.hidden = false;
  };
  $('#hl-list').addEventListener('click', openP);
  pnl.addEventListener('click', e => {
    if (e.target === pnl || e.target.closest('.hlp-x')) return closeP();
    const g = e.target.closest('.hlg'); if (g) { closeP(); const a = $('#tc' + g.dataset.c), m = a && a.querySelector(`mark.hl[data-s="${g.dataset.s}"]`); if (m) jumpTo(m); return; }
    const r = e.target.closest('.hlr'); if (r) { const k = r.dataset.c, s = +r.dataset.s, en = +r.dataset.e; HL[k] = merge(HL[k] || []).filter(([a, b]) => !(a === s && b === en)); persist(); applyHL($('#tc' + k)); upd(); openP(); }
  });
  const cleanup = () => { if (!document.body.contains(bar)) { document.removeEventListener('selectionchange', selH); document.removeEventListener('pointerdown', offTap); removeEventListener('hashchange', cleanup); hb.remove(); pnl.remove(); return true; } return false; };
  addEventListener('hashchange', cleanup);
  let armed = 0;
  $('#hl-clear').addEventListener('click', e => { const b2 = e.currentTarget; if (!armed) { armed = 1; b2.textContent = '정말 지울까요? 한 번 더 누르세요'; setTimeout(() => { armed = 0; b2.textContent = '모두 지우기'; }, 3000); return; } armed = 0; HL = {}; persist(); $$('.tx').forEach(applyHL); b2.textContent = '모두 지우기'; upd(); closeP(); });
  /* ---- 원본 쪽 이미지 ---- */
  const buildImgs = () => {
    const pages = Array.from({ length: n.pages }, (_, i) => { const p = i + 1, st = CH.find(c => c.from === p);
      return `<figure class="pgf ld" id="pg${p}">${st ? `<figcaption class="pgc">제${st.n}장 · ${esc(st.title)}${st.by ? ` · ${esc(st.by)}` : ''}</figcaption>` : ''}<div class="pgw"><img src="${n.dir}/p-${pg(p)}.webp" alt="${esc(b.title)} 모임 자료 ${p}쪽" draggable="false" width="${n.w || ''}" height="${n.h || ''}"></div></figure>`; }).join('');
    $('#pgs').innerHTML = pages; imgBuilt = true;
    $$('.pgf img').forEach(im => { const done = () => im.closest('.pgf').classList.remove('ld'); im.complete && im.naturalWidth ? done() : (im.onload = done, im.onerror = done); });
  };
  const loadImgs = cb => {
    const ld = $('#iload'), pct = $('#il-pct'), bar2 = $('#il-bar'); ld.hidden = false; $('#pgs').hidden = true; const t0 = Date.now(); let d = 0; const tot = n.pages;
    const fin = () => { setTimeout(() => { ld.hidden = true; $('#pgs').hidden = false; cb && cb(); }, Math.max(0, 500 - (Date.now() - t0))); };
    for (let p = 1; p <= tot; p++) { const i = new Image(); i.onload = i.onerror = () => { d++; pct.textContent = Math.round(d / tot * 100) + '%'; bar2.style.width = (d / tot * 100) + '%'; if (d === tot) fin(); }; i.src = `${n.dir}/p-${pg(p)}.webp`; }
  };
  /* ---- 모드 전환 · 목차 ---- */
  const setMode = (m, after) => {
    mode = m; hide(); $$('.nt-tabs button').forEach(x => x.classList.toggle('on', x.dataset.m === m));
    $('#pane-text').hidden = m !== 'text'; $('#pane-img').hidden = m !== 'img';
    $('#hl-tools').hidden = m !== 'text'; $('#hl-hint').hidden = m !== 'text';
    if (m === 'img') { if (!imgBuilt) buildImgs(); loadImgs(() => { after && after(); }); } else { after && after(); }
    cur = -1; setCur(0, false);
  };
  const setCur = (i, center) => {
    if (i === cur) return; cur = i;
    $$('.cj', jumps).forEach((x, k) => x.classList.toggle('on', k === i));
    $$('.ja', all).forEach((x, k) => x.classList.toggle('on', k === i));
    $('#jb-t').textContent = `제${CH[i].n}장 · ${CH[i].title}`;
    $('#jb-prev').disabled = i === 0; $('#jb-next').disabled = i === CH.length - 1;
    const c = $$('.cj', jumps)[i];
    if (c) jumps.scrollTo({ left: c.offsetLeft - (jumps.clientWidth - c.offsetWidth) / 2, behavior: center === false ? 'auto' : 'smooth' });
  };
  const go = i => {
    i = Math.max(0, Math.min(CH.length - 1, i));
    const t = anchor(i); if (!t) return;
    setCur(i); lock = Date.now() + 900;
    window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - barH(), behavior: 'smooth' });
    all.hidden = true; nowBtn.setAttribute('aria-expanded', 'false');
  };
  const spy = () => {
    if (Date.now() < lock) return;
    if (!document.body.contains(bar)) { removeEventListener('scroll', spy); return; }
    const line = barH() + 8; let k = 0;
    CH.forEach((c, i) => { const t = anchor(i); if (t && !t.closest('[hidden]') && t.getBoundingClientRect().top <= line) k = i; });
    setCur(k);
    clearTimeout(sv); sv = setTimeout(() => { const t = anchor(k); if (!t) return; try { localStorage.setItem('nread', JSON.stringify({ c: k, o: Math.max(0, Math.round(line - t.getBoundingClientRect().top)) })); } catch (e) {} }, 400);
  };
  let sv = 0;
  addEventListener('scroll', spy, { passive: true });
  jumps.addEventListener('click', e => { const c = e.target.closest('.cj'); if (c) go(+c.dataset.i); });
  all.addEventListener('click', e => { const c = e.target.closest('.ja'); if (c) go(+c.dataset.i); });
  nowBtn.addEventListener('click', () => { all.hidden = !all.hidden; nowBtn.setAttribute('aria-expanded', String(!all.hidden)); });
  $('#jb-prev').addEventListener('click', () => go(cur - 1));
  $('#jb-next').addEventListener('click', () => go(cur + 1));
  $('#totop').addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $$('.nt-tabs button').forEach(x => x.addEventListener('click', () => { if (x.dataset.m !== mode) { const i = Math.max(0, cur); setMode(x.dataset.m, () => { const t = anchor(i); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - barH(), behavior: 'auto' }); }); } }));
  $('#pane-text').addEventListener('click', e => { const sb = e.target.closest('.srcbtn'); if (!sb) return; const p = +sb.dataset.p; setMode('img', () => { const t = $('#pg' + p); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - barH(), behavior: 'auto' }); }); });
  /* ---- 시작: 글 불러오기 ---- */
  const t0 = Date.now(), pctEl = $('#nl-pct'), barEl = $('#nl-bar');
  let fake = 0; const tick = setInterval(() => { fake = Math.min(90, fake + 12); if (pctEl) pctEl.textContent = fake + '%'; if (barEl) barEl.style.width = fake + '%'; }, 90);
  fetch(n.text).then(r => r.json()).then(d => { TX = d; }).catch(() => { TX = []; }).then(() => {
    clearInterval(tick);
    const show = () => {
      const el = $('#nbody'); if (!el) return;
      $('#pane-text').innerHTML = TX.length ? TX.map((c, i) => art(c, i, CH[i] || { from: 1, to: 1 })).join('') : '<p class="bempty">글 자료를 불러오지 못했어요. 위의 “원본 쪽 보기”로 확인해 주세요.</p>';
      $$('.tx').forEach(applyHL); upd(); el.hidden = false; const l = $('#nload'); if (l) l.remove(); setCur(0, false);
      let nj = null; try { nj = JSON.parse(sessionStorage.getItem('nj') || 'null'); sessionStorage.removeItem('nj'); } catch (e) {}
      if (nj && $('#tc' + nj.c)) {
        let t = $('#tc' + nj.c); if (nj.q) { const w = document.createTreeWalker(t, NodeFilter.SHOW_TEXT); let nd; while ((nd = w.nextNode())) { if (nd.nodeValue.toLowerCase().includes(nj.q)) { t = nd.parentElement; break; } } }
        jumpTo(t); setCur(nj.c, false); t.classList.add('flash'); setTimeout(() => t.classList.remove('flash'), 1800);
      } else {
        let rd = null; try { rd = JSON.parse(localStorage.getItem('nread') || 'null'); } catch (e) {}
        const a = rd && $('#tc' + rd.c);
        if (a && (rd.c > 0 || rd.o > 300)) {
          window.scrollTo({ top: a.getBoundingClientRect().top + scrollY + rd.o - barH() - 8, behavior: 'auto' }); setCur(rd.c, false);
          const rs = document.createElement('div'); rs.className = 'resume'; rs.innerHTML = `제${CH[rd.c].n}장에서 이어 읽고 있어요 <button type="button">처음부터</button>`; document.body.appendChild(rs);
          const rm = () => { rs.classList.add('out'); setTimeout(() => rs.remove(), 400); }; rs.querySelector('button').addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'auto' }); rm(); }); setTimeout(rm, 5000);
        }
      }
    };
    setTimeout(show, Math.max(0, 450 - (Date.now() - t0)));
  });
}
function renderBooks(arg){
  const crumbHome = '<a href="#home">홈</a>';
  if (!arg) {
    view.innerHTML = band({ cls:'s-books', crumb:`${crumbHome} › 독서 모임`, title:'독서 모임', desc:'책을 누르면 소개와 모임 자료를 볼 수 있어요.', img: bandImg('images/sections/books.webp') }) + `
    <div class="wrap"><section class="sec"><div class="sec-h"><h2>2026</h2><span>${DB.books.length}권</span></div>
      <div class="shelf">${[...DB.books].sort((x, y) => (x.half === '상반기' ? 0 : 1) - (y.half === '상반기' ? 0 : 1)).map((b, i) => `<a class="bk" style="--i:${i}" href="#books-${b.id}">${coverHTML(b)}<em class="bk-tag">${esc(b.half || '')}</em><strong>${esc(b.title)}</strong><small>${esc(bookSub(b))}</small></a>`).join('')}</div>
    </section></div>`;
    return;
  }
  const [bid, sub] = arg.split('-');
  const b = DB.books.find(x => String(x.id) === bid);
  if (!b) { location.hash = 'books'; return; }
  if (sub === 'notes' && b.notes) { notesView(b); return; }
  const i = DB.books.indexOf(b), pv = DB.books[i - 1], nx = DB.books[i + 1];
  const rows = b.materials.map((m, k) => rowHTML({ ...m, subject:'books', author:b.author, date:b.month + '-01' }, k, '독서 모임'));
  view.innerHTML = `
  <div class="wrap"><div class="bdetail s-books">
    <div>${coverHTML(b)}</div>
    <div>
      <div class="crumb" style="color:var(--sub)">${crumbHome} › <a href="#books">독서 모임</a></div>
      <h1>${esc(b.title)}</h1>
      ${b.subtitle ? `<div class="bsub">${esc(b.subtitle)}</div>` : ''}
      <div class="bmeta">${esc(bookSub(b))}</div>
      ${b.intro ? `<div class="bintro">${esc(b.intro)}</div>` : ''}
      ${b.notes ? `<a class="notebtn" href="#books-${b.id}-notes">모임자료 보기 <span>→</span></a>` : `<div class="notebtn off">모임 자료는 준비 중이에요</div>`}
      ${rows.length ? `<section class="sec"><div class="sec-h"><h2>독서 탐구 자료</h2><span>${b.materials.length}개</span></div>
        <div class="list still">${rows.join('')}</div></section>` : ''}
      <div class="pnrow">${pv ? `<a class="pnbtn" href="#books-${pv.id}">← ${esc(pv.title)}</a>` : '<a class="pnbtn" href="#books">← 전체 책</a>'}${nx ? `<a class="pnbtn" href="#books-${nx.id}">${esc(nx.title)} →</a>` : '<span class="pnbtn off">.</span>'}</div>
    </div>
  </div></div>`;
}

/* ---------- 라우터 ---------- */
function route(){
  const h = (location.hash || '#home').slice(1);
  const [page, arg] = h.split(/-(.+)/);
  if (page !== 'material') listHash = h === 'home' ? 'home' : h;
  const mat = page === 'material' ? DB.materials.find(x => String(x.id) === arg) : null;
  if (page === 'material' && !mat) { location.hash = 'home'; return; }
  const key = mat ? mat.subject : (['home','about','world','korea','books','etc'].includes(page) ? page : 'home');
  markNav(key, key === 'home' ? '' : (mat ? key : (key === page ? h : key)));
  if (mat) { renderMaterial(mat); initPreview(mat); }
  else if (key === 'home') renderHome();
  else if (key === 'about') renderAbout(arg);
  else if (key === 'books') renderBooks(arg);
  else renderSubject(key, arg);
  window.scrollTo({ top:0 });
  bannerBg(); revealAll();
  const names = { home:'', about:'소개', world:'세계사', korea:'한국사', books:'독서 모임', etc:'기타자료' };
  document.title = (names[key] ? names[key] + ' · ' : '') + '동부산 역사교사모임 아카이브';
}

/* 시작 로딩: 큰 이미지를 먼저 내려받는 동안 로딩 화면을 보여 줌 */
function preload(urls, ms){
  let done = 0; const p = $('#ld-pct'), bar = $('#ld-bar');
  const tick = () => { const v = Math.round(++done / urls.length * 100); if (p) p.textContent = v + '%'; if (bar) bar.style.width = v + '%'; };
  return Promise.race([
    Promise.all(urls.map(u => new Promise(r => { const i = new Image(); i.onload = i.onerror = () => { tick(); r(); }; i.src = u; }))),
    new Promise(r => setTimeout(r, ms))
  ]);
}
const hideLoader = () => { const l = $('#loader'); if (!l) return; l.classList.add('out'); setTimeout(() => l.remove(), 600); };
/* 드래그·선택 막기 */
addEventListener('dragstart', e => e.preventDefault());
addEventListener('selectstart', e => { const el = e.target && (e.target.nodeType === 1 ? e.target : e.target.parentElement); if (!el || !el.closest('input,textarea,.tx')) e.preventDefault(); });
(() => { const b = document.createElement('button'); b.type = 'button'; b.className = 'totop-fab'; b.setAttribute('aria-label', '맨 위로'); b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>'; document.body.appendChild(b);
  const t = () => b.classList.toggle('show', scrollY > 500); addEventListener('scroll', t, { passive: true }); t();
  b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' })); })();

/* ===== 통합 검색 ===== */
function initSearch(){
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'sbtn'; btn.id = 'sbtn'; btn.setAttribute('aria-label', '검색');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  $('.nav .wrap').appendChild(btn);
  const ov = document.createElement('div'); ov.className = 'sov'; ov.hidden = true;
  ov.innerHTML = '<div class="sbox"><div class="sin"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="sq" type="search" placeholder="자료·책·모임 글·학습지 검색" autocomplete="off" enterkeyhint="search"><button type="button" class="sx" aria-label="닫기">×</button></div><div class="sres" id="sres"><p class="sh">검색어를 입력해 보세요.</p></div></div>';
  document.body.appendChild(ov);
  let notes = null, loading = null;
  const loadNotes = () => loading || (loading = Promise.all(DB.books.filter(b => b.notes && b.notes.text).map(b => fetch(b.notes.text).then(r => r.json()).then(d => ({ b, d })).catch(() => null))).then(a => { notes = a.filter(Boolean); }));
  const plain = x => (x.t != null ? [x.t] : []).concat(x.rows ? x.rows.flat() : []);
  const hi = (t, ts) => { let o = esc(t); ts.forEach(q => { const e = esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); o = o.replace(new RegExp(e, 'gi'), m => `<mark>${m}</mark>`); }); return o; };
  const snip = (t, ts) => { const l = t.toLowerCase(); let i = Math.min(...ts.map(q => { const k = l.indexOf(q); return k < 0 ? 1e9 : k; })); if (i > 1e8) i = 0; const a = Math.max(0, i - 28); return (a ? '…' : '') + t.slice(a, a + 90) + (a + 90 < t.length ? '…' : ''); };
  const open = () => { ov.hidden = false; document.body.classList.add('sopen'); setTimeout(() => $('#sq').focus(), 30); loadNotes(); };
  const close = () => { ov.hidden = true; document.body.classList.remove('sopen'); };
  btn.addEventListener('click', open);
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.sx')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) close(); });
  const go = (hash, nj) => { close(); if (nj) { try { sessionStorage.setItem('nj', JSON.stringify(nj)); } catch (e) {} } if (location.hash === hash) route(); else location.hash = hash; };
  const grp = (title, items) => items.length ? `<section class="sg"><h5>${title}<i>${items.length}</i></h5>${items.join('')}</section>` : '';
  const run = () => {
    const raw = $('#sq').value.trim().toLowerCase(), box = $('#sres'); if (!raw) { box.innerHTML = '<p class="sh">검색어를 입력해 보세요.</p>'; return; }
    const ts = raw.split(/\s+/).filter(Boolean), all = h => ts.every(q => h.includes(q));
    const mats = DB.materials.filter(m => all([m.title, m.desc, m.type, m.topic, m.author, (m.tags || []).join(' ')].join(' ').toLowerCase())).slice(0, 20)
      .map(m => `<a class="sr" data-h="#material-${m.id}"><b>${hi(m.title, ts)}</b><small>${esc([subjOf(m), m.type].filter(Boolean).join(' · '))}</small></a>`);
    const bks = DB.books.filter(b => all([b.title, b.subtitle, b.author, b.intro].join(' ').toLowerCase()))
      .map(b => `<a class="sr" data-h="#books-${b.id}"><b>${hi(b.title, ts)}</b><small>${esc(b.author || '')}</small></a>`);
    const gy = Object.values(DB.gyegi || {}).filter(g => all([g.title, (g.topics || []).join(' '), (g.sections || []).map(x => x.title + ' ' + (x.items || []).map(i => i.title).join(' ')).join(' ')].join(' ').toLowerCase()))
      .map(g => `<a class="sr" data-h="#etc-gyegi"><b>${hi(g.title, ts)}</b><small>계기 교육</small></a>`);
    let nt = [];
    (notes || []).forEach(({ b, d }) => d.forEach((c, i) => {
      if (nt.length >= 15) return;
      const hit = c.blocks.map(x => plain(x).join(' ')).find(t => all(t.toLowerCase())) || (all(c.title.toLowerCase()) ? c.title : null);
      if (hit) nt.push(`<a class="sr" data-h="#books-${b.id}-notes" data-c="${i}" data-q="${esc(ts[0])}"><b>제${c.n}장 · ${hi(c.title, ts)}</b><small>${hi(snip(hit, ts), ts)}</small></a>`);
    }));
    const fw = wsFind(h => all(h.toLowerCase())),
      wsr = fw.ws.slice(0, 20).map(({ w, c, href, p, sn }) => `<a class="sr" data-h="${href}" data-w="${w.id}" data-p="${p}"><b>${hi(c.n + ' · ' + c.title, ts)}</b><small>${esc(w.teacher)} · ${esc(w.term)} · ${p}쪽${sn ? ' — ' + hi(sn, ts) : ''}</small></a>`),
      cmr = fw.cmp.slice(0, 12).map(({ e, href }) => `<a class="sr" data-h="${href}"><b>${hi(e.u.t, ts)}</b><small>단원별 비교 · ${e.tn}명의 학습지</small></a>`);
    const html = grp('단원별 비교', cmr) + grp('학습지', wsr) + grp('수업·평가 자료', mats) + grp('독서 모임 글', nt) + grp('책', bks) + grp('계기 교육', gy);
    box.innerHTML = html || `<p class="sh">${notes ? '검색 결과가 없어요.' : '불러오는 중…'}</p>`;
    if (!notes && !html) loadNotes().then(run);
  };
  let tm = 0; $('#sq').addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(run, 120); });
  $('#sres').addEventListener('click', e => { const a = e.target.closest('.sr'); if (!a) return; if (a.dataset.w) { try { sessionStorage.setItem('wj', JSON.stringify({ id: a.dataset.w, p: +a.dataset.p })); } catch (e) {} } go(a.dataset.h, a.dataset.c != null ? { c: +a.dataset.c, q: a.dataset.q } : null); });
}
async function init(){
  try {
    const [m, b, a, g, ws] = await Promise.all(['materials','books','about','gyegi','worksheets'].map(n => fetch(`data/${n}.json`).then(r => r.json()).catch(() => n === 'worksheets' ? [] : Promise.reject())));
    DB.materials = m; DB.books = b; DB.about = a; DB.gyegi = g; DB.worksheets = ws || [];
    try { DB.wsUnits = await fetch('data/ws-units.json').then(r => r.json()); } catch (e) { DB.wsUnits = {}; }
  } catch (e) {
    view.innerHTML = '<div class="empty" style="padding:80px 20px">자료를 불러오지 못했어요. 페이지를 새로고침해 주세요.</div>';
    hideLoader(); return;
  }
  buildNav(); initSearch();
  addEventListener('hashchange', route);
  const nv = $('.nav'), sc = () => nv.classList.toggle('scrolled', scrollY > 4); addEventListener('scroll', sc, { passive:true }); sc();
  addEventListener('resize', () => { setNavH(); const t = $('#ttabs'); if (t) moveInd(t); });
  const pad = i => String(i).padStart(2, '0');
  const imgs = ['images/hero.webp',
    ...['about', 'world', 'korea', 'books', 'etc'].map(k => `images/banners/${k}.webp`),
    ...['world', 'korea'].flatMap(k => [...[1, 2, 3, 4, 5, 6].map(i => `${k}-${pad(i)}`), `${k}-x`].map(c => `images/units/${c}.webp`)),
    ...DB.materials.map(m => m.thumb).filter(Boolean),
    ...DB.books.map(b => b.cover).filter(Boolean)];
  await Promise.all([preload(imgs, 60000), (document.fonts && document.fonts.ready) || 0]);
  route();
  requestAnimationFrame(() => setTimeout(hideLoader, 150));
}
init();

try { if (localStorage.getItem('noanim')) document.body.classList.add('no-anim'); } catch (e) {}
