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
const countOf = (s, c) => DB.materials.filter(m => m.subject === s && (c == null || m.unit === c)).length;
if (matchMedia('(hover:none)').matches) document.documentElement.classList.add('touch');

const artKey = m => m.subject === 'etc' ? 'etc-x' : m.subject === 'books' ? 'tile-books' : `${m.subject}-${ucode(m.unit)}`;
const art = k => ART[k] || '';
/* images/ 폴더에 같은 이름의 사진이 있으면 그림 위에 덮어서 보여 줘요 */
const unitImg = k => /^(world|korea)-/.test(k) ? `<img class="ov" src="images/units/${k}.png" alt="" loading="lazy" onerror="this.remove()">` : '';
/* 페이지 맨 위 띠의 오른쪽 그림: 단원 그림이 없으면 과목 그림, 그것도 없으면 그림 없이 보여요 */
const bandImg = (src, fb) => `<div class="band-img"><img src="${src}" alt="" onerror="${fb ? `if(!this.dataset.f){this.dataset.f=1;this.src='${fb}'}else{this.parentNode.remove()}` : 'this.parentNode.remove()'}"></div>`;
const pic = k => art(k) + unitImg(k);

/* ---------- 자료 한 줄 ---------- */
function rowHTML(m, i, meta){
  const top = meta ?? [SUBJ[m.subject], m.subject === 'etc' ? '' : unitLabel(m.unit)].filter(Boolean).join(' · ');
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
  const top = [meta ?? [SUBJ[m.subject], m.subject === 'etc' ? (m.group || '') : unitLabel(m.unit)].filter(Boolean).join(' · '), m.topic].filter(Boolean).join(' · ');
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
    card('자료 정보', dl([['과목', SUBJ[m.subject]], ['단원', m.subject === 'etc' ? '' : `${unitLabel(m.unit)}${un ? ' · ' + esc(un) : ''}`], ['다룬 내용', esc(m.topic || '')], ['유형', esc(m.type)], ['형식', esc(m.format || '')], ['만든 사람', esc(m.author || '')], ['등록일', fmt(esc(m.date))]])),
    (m.tags || []).length ? card('키워드', `<div class="tags big">${m.tags.map(t => `<i>#${esc(t)}</i>`).join('')}</div>`, 'wide') : ''
  ].join('');
  view.innerHTML = `
  <div class="wrap s-${m.subject}"><div class="mdetail">
    <div class="m-poster">${posterImg(m)}${m.author ? `<em class="by">${esc(m.author)}</em>` : ''}</div>
    <div class="m-main">
      <div class="crumb" style="color:var(--sub)">${home} › <a href="#${m.subject}">${SUBJ[m.subject]}</a>${unitLink}</div>
      ${pills(m)}
      <h1>${esc(m.title)}</h1>
      <p class="m-lead">${esc(m.overview || m.desc)}</p>
      <div class="go-row">${go}<a class="backbtn" href="${back}">← 목록으로</a></div>
    </div>
  </div>
  ${m.preview ? `<section class="pv" id="pv"><div class="pv-h"><h3>자료 미리보기</h3><span id="pv-n">1 / ${m.preview.pages}</span></div>
    <div class="pv-main"><div class="pv-load" id="pv-load" role="status"><div class="ring"></div><p>미리보기를 불러오는 중… <b id="pv-pct">0%</b></p></div><button class="pv-b" id="pv-prev" type="button" aria-label="이전 쪽">‹</button><img id="pv-img" src="${esc(m.preview.dir)}/p-1.jpg" alt="${esc(m.title)} 1쪽" draggable="false"><button class="pv-b" id="pv-next" type="button" aria-label="다음 쪽">›</button></div>
    <div class="pv-th">${Array.from({ length: m.preview.pages }, (_, k) => `<button type="button" class="${k ? '' : 'on'}" data-k="${k + 1}"><img src="${esc(m.preview.dir)}/p-${k + 1}.jpg" alt="" draggable="false" loading="lazy"></button>`).join('')}</div></section>` : ''}
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
  Array.from({ length: N }, (_, k) => { const i = new Image(); i.onload = i.onerror = () => { done++; const p = $('#pv-pct'); if (p) p.textContent = Math.round(done / N * 100) + '%'; if (done >= N) { clearTimeout(tm); fin(); } }; i.src = `${m.preview.dir}/p-${k + 1}.jpg`; });
  const go = n => { cur = Math.min(N, Math.max(1, n)); img.src = `${m.preview.dir}/p-${cur}.jpg`; img.alt = `${m.title} ${cur}쪽`; $('#pv-n').textContent = `${cur} / ${N}`; $$('.pv-th button', pv).forEach(b => b.classList.toggle('on', +b.dataset.k === cur)); };
  $('#pv-prev').addEventListener('click', () => go(cur - 1)); $('#pv-next').addEventListener('click', () => go(cur + 1));
  const open = () => {
    const lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog');
    lb.innerHTML = `<div class="lb-top"><span id="lb-n"></span><button type="button" id="lb-x" aria-label="닫기">×</button></div><div class="lb-stage" id="lb-stage"><img id="lb-img" alt="" draggable="false"></div><button class="lb-b" id="lb-p" type="button" aria-label="이전 쪽">‹</button><button class="lb-b" id="lb-nx" type="button" aria-label="다음 쪽">›</button><p class="lb-hint">이미지를 누르면 크게 볼 수 있어요</p>`;
    document.body.appendChild(lb); document.body.classList.add('lb-open');
    const li = $('#lb-img', lb), st = $('#lb-stage', lb);
    const show = () => { li.src = `${m.preview.dir}/p-${cur}.jpg`; $('#lb-n', lb).textContent = `${m.title} · ${cur} / ${N}`; st.classList.remove('zoom'); st.scrollTo(0, 0); go(cur); };
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
/* 섹션 배너 배경: images/banners/{about,world,korea,books,etc}.jpg */
function bannerBg(){
  const b = $('.band'); if (!b) return;
  const k = b.dataset.k; if (!k) return;
  const i = new Image();
  i.onload = () => { b.style.setProperty('--bnr', `url(images/banners/${k}.jpg)`); b.classList.add('own'); };
  i.src = `images/banners/${k}.jpg`;
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
    (hs.subj === 'all' || m.subject === hs.subj) && (hs.type === 'all' || m.type === hs.type) && (hs.unit === 'all' || m.unit === hs.unit) &&
    (!q || norm([m.title, m.desc, m.author, (m.tags || []).join(' '), m.format || '', m.topic || '', SUBJ[m.subject], unitName(m)].join(' ')).includes(q))
  ).sort(byNew);
  const active = homeActive();
  const hero = $('#hero'); if (hero) hero.classList.toggle('compact', !!active);
  $('#res-sec').hidden = !active;
  $('#board-sec').hidden = !!active;
  $('#res-count').textContent = `${items.length}개`;
  const list = $('#home-list');
  list.classList.toggle('still', !animate);
  list.className = items.length ? 'pgrid' : 'list';
  list.innerHTML = items.length ? items.map((m, i) => posterHTML(m, i)).join('') : `<div class="empty">${MS}조건에 맞는 자료가 없어요. 검색어나 필터를 바꿔 보세요.</div>`;
}
function homeUnitOptions(){
  const sel = $('#unit-sel');
  const units = hs.subj === 'all' || hs.subj === 'etc' ? [] : UNITS[hs.subj];
  sel.hidden = !units.length;
  sel.innerHTML = '<option value="all">전체 단원</option>' + units.map(u => `<option value="${u[0]}">${u[0] === '기타' ? '기타' : u[0] + '. ' + esc(u[1])}</option>`).join('');
  sel.value = hs.unit;
}
function bitem(m){
  const meta = [SUBJ[m.subject], m.subject === 'etc' ? '' : unitLabel(m.unit)].filter(Boolean).join(' · ');
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
function renderHome(){
  const picks = DB.materials.filter(m => m.pick).sort((x, y) => x.pick - y.pick);
  const latest = (picks.length ? picks : [...DB.materials].sort(byNew)).slice(0, 3);
  const cols = latest.length ? `<div class="pgrid home-pg rv">${latest.map((m, i) => posterHTML(m, i)).join('')}</div>` : '<p class="bempty">아직 올라온 자료가 없어요.</p>';
  view.innerHTML = `
  <section class="hero" id="hero">
    <button class="fx-btn" id="fxbtn" type="button" aria-pressed="false"></button>
    <div class="hbg">
      <div class="stage"><div class="zoom">
        <img class="heroimg" src="images/hero.jpg" alt="" fetchpriority="high">
        <i class="glow"></i><i class="beam"></i>
        ${SPARKS.map(([x, y, sz, d]) => `<i class="sp" style="left:${x}%;top:${y}%;--s:${sz}px;--d:${d}s"></i>`).join('')}
      </div></div>
      <div class="motes" aria-hidden="true">${motes()}</div>
    </div>
    <div class="wrap hin">
      <h1 class="ttl" aria-label="동부산 역사교사모임 아카이브">${[['l1', '동부산 역사교사모임', 0], ['l2', '아카이브', 10]].map(([c, t, o]) => `<span class="${c}" aria-hidden="true">${[...t].map((ch, i) => ch === ' ' ? '<b class="sp"></b>' : `<b style="--k:${i + o}">${ch}</b>`).join('')}</span>`).join('')}</h1>
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
    <button class="more-hint" id="hint" type="button" aria-label="최신 자료 보기">최신 자료<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
  </section>
  <div class="wrap">
    <section class="sec" id="board-sec"><span id="latest"></span><div class="sec-h rv"><h2>최신 모임 자료</h2><span>바이브 코딩</span></div>
      ${cols}
    </section>
    <section class="sec" id="res-sec" hidden><div class="sec-h"><h2>검색 결과</h2><span id="res-count"></span></div><div class="list" id="home-list"></div></section>
  </div>`;
  homeUnitOptions(); homeList(true);
  setNavH(); heroFx();
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
  view.innerHTML = band({ cls:'s-etc', crumb:`<a href="#home">홈</a> › <a href="#etc">기타자료</a> › 계기 교육`, title:'계기 교육', desc:'', img: bandImg('images/sections/etc.png') }) + `<div class="wrap s-etc gy">${ub}${tabs}${body}</div>`;
  $('#gy-nav').addEventListener('click', e => { const a = e.target.closest('a'); if (!a) return; e.preventDefault(); const t = $('#' + a.dataset.t); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nh')) || 64) - 18, behavior:'smooth' }); });
}
function renderSubject(subj, arg){
  const units = UNITS[subj], cls = `s-${subj}`;
  const home = '<a href="#home">홈</a>';
  let unit = null;
  const GR = { busan:'부산역사교사모임' }, grp = subj === 'etc' && GR[arg] ? GR[arg] : null;
  if (subj === 'etc' && arg && arg.startsWith('gyegi')) { renderGyegi(arg.slice(6).replace(/^-/, '') || 'jeju43'); return; }
  if (subj !== 'etc' && arg && arg !== 'all') { unit = udec(arg); if (!units.some(u => u[0] === unit)) { location.hash = subj; return; } }
  const items = DB.materials.filter(m => m.subject === subj && (unit == null || m.unit === unit) && (!grp || m.group === grp));
  let crumb, title, img;
  if (subj === 'etc') { crumb = grp ? `${home} › <a href="#etc">기타자료</a> › ${grp}` : `${home} › 기타자료`; title = grp || '기타 수업자료'; img = bandImg('images/sections/etc.png'); }
  else if (unit == null) { crumb = `${home} › ${SUBJ[subj]}`; title = `${SUBJ[subj]} 전체 자료`; img = bandImg(`images/sections/${subj}.png`); }
  else { crumb = `${home} › <a href="#${subj}">${SUBJ[subj]}</a> › ${unitLabel(unit)}`; title = unit === '기타' ? `${SUBJ[subj]} 단원 외 자료` : unitTitle(subj, unit); img = bandImg(`images/units/${subj}-${ucode(unit)}.png`, `images/sections/${subj}.png`); }
  const ub = subj === 'etc' ? '' : `<nav class="ubar" aria-label="단원"><a class="${unit == null ? 'on' : ''}" href="#${subj}">전체<i>${countOf(subj)}</i></a>${units.map(u => `<a class="${unit === u[0] ? 'on' : ''}" href="#${subj}-${ucode(u[0])}" title="${esc(unitTitle(subj, u[0]))}"><b>${u[0] === '기타' ? '외' : u[0]}</b><span>${esc(unitTitle(subj, u[0]))}</span><i>${countOf(subj, u[0])}</i></a>`).join('')}</nav>`;
  view.innerHTML = band({ cls, crumb, title, desc: '', img }) + `<div class="wrap ${cls}">${ub}<section class="sec"><div id="lib"></div></section></div>`;
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
  view.innerHTML = band({ cls:'s-about', crumb:'<a href="#home">홈</a> › 모임 소개', title:'모임 소개', desc:'', img: bandImg('images/sections/about.png') }) + `
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
  return `<div class="cv ${COVER[n]}"><img class="ov" src="images/books/${b.id}.jpg" alt="" onload="this.parentNode.classList.add('hasimg')" onerror="this.remove()"><span class="t">${esc(b.title)}</span><span class="a">${esc(b.author)}</span></div>`;
}
const bookSub = b => [b.author, b.publisher, b.month ? fmt(esc(b.month)) : ''].filter(Boolean).join(' · ');
/* 모임 자료(발표 PDF 전체를 쪽 그대로 보여 줌) */
function notesView(b){
  const n = b.notes, pg = i => String(i).padStart(2, '0'), CH = n.chapters;
  const chip = (c, i) => `<button type="button" class="cj" data-i="${i}"><b>${String(c.n).padStart(2, '0')}</b><span>${esc(c.title)}</span></button>`;
  const pages = Array.from({ length: n.pages }, (_, i) => {
    const p = i + 1, st = CH.find(c => c.from === p);
    return `<figure class="pgf ld" id="pg${p}">${st ? `<figcaption class="pgc">제${st.n}장 · ${esc(st.title)}${st.by ? ` · ${esc(st.by)}` : ''}</figcaption>` : ''}<div class="pgw"><img src="${n.dir}/p-${pg(p)}.jpg" alt="${esc(b.title)} 모임 자료 ${p}쪽" draggable="false" width="${n.w || ""}" height="${n.h || ""}"></div><span class="pgn">${p} / ${n.pages}</span></figure>`;
  }).join('');
  view.innerHTML = `
  <div class="wrap"><div class="notes">
    <div class="crumb" style="color:var(--sub)"><a href="#home">홈</a> › <a href="#books">독서 모임</a> › <a href="#books-${b.id}">${esc(b.title)}</a></div>
    <h1>${esc(b.title)} <small>모임 자료</small></h1>
    <div class="nload" id="nload"><div class="ring"></div><p>모임 자료를 불러오는 중… <b id="nl-pct">0%</b></p><div class="ld-bar"><i id="nl-bar"></i></div></div>
    <div id="nbody" hidden>
    <div class="jumpbar" id="jumpbar">
      <div class="jb-top"><button type="button" class="jb-arr" id="jb-prev" aria-label="이전 장">‹</button>
        <button type="button" class="jb-now" id="jb-now" aria-expanded="false"><span class="jb-lb">목차</span><span class="jb-t" id="jb-t"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
        <button type="button" class="jb-arr" id="jb-next" aria-label="다음 장">›</button></div>
      <div class="jumps" id="jumps">${CH.map(chip).join('')}</div>
      <div class="jb-all" id="jb-all" hidden>${CH.map((c, i) => `<button type="button" class="ja" data-i="${i}"><b>${String(c.n).padStart(2, '0')}</b><span>${esc(c.title)}</span>${c.by ? `<i>${esc(c.by)}</i>` : ''}</button>`).join('')}</div>
    </div>
    <div class="pgs">${pages}</div>
    <div class="pnrow"><a class="pnbtn" href="#books-${b.id}">← 책 소개로</a><a class="pnbtn" href="#" id="totop">맨 위로 ↑</a></div>
    </div>
  </div></div>`;
  { let d = 0; const pct = $('#nl-pct'), bar = $('#nl-bar'), tot = n.pages;
    const fin = () => { const el = $('#nbody'); if (el) { el.hidden = false; const l = $('#nload'); if (l) l.remove(); } };
    for (let p = 1; p <= tot; p++) { const i = new Image(); i.onload = i.onerror = () => { d++; if (pct) pct.textContent = Math.round(d / tot * 100) + '%'; if (bar) bar.style.width = (d / tot * 100) + '%'; if (d === tot) fin(); }; i.src = `${n.dir}/p-${pg(p)}.jpg`; }
  }
  $$('.pgf img').forEach(im => { const done = () => im.closest('.pgf').classList.remove('ld'); im.complete && im.naturalWidth ? done() : (im.onload = done, im.onerror = done); });
  const bar = $('#jumpbar'), jumps = $('#jumps'), all = $('#jb-all'), nowBtn = $('#jb-now');
  const barH = () => (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nh')) || 64) + bar.offsetHeight + 16;
  let cur = -1;
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
    const t = $('#pg' + CH[i].from);
    setCur(i); lock = Date.now() + 900;
    window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - barH(), behavior: 'smooth' });
    all.hidden = true; nowBtn.setAttribute('aria-expanded', 'false');
  };
  let lock = 0;
  const spy = () => {
    if (Date.now() < lock) return;
    if (!document.body.contains(bar)) { removeEventListener('scroll', spy); return; }
    const line = barH() + 8; let k = 0;
    CH.forEach((c, i) => { const t = $('#pg' + c.from); if (t && t.getBoundingClientRect().top <= line) k = i; });
    setCur(k);
  };
  addEventListener('scroll', spy, { passive: true });
  jumps.addEventListener('click', e => { const c = e.target.closest('.cj'); if (c) go(+c.dataset.i); });
  all.addEventListener('click', e => { const c = e.target.closest('.ja'); if (c) go(+c.dataset.i); });
  nowBtn.addEventListener('click', () => { all.hidden = !all.hidden; nowBtn.setAttribute('aria-expanded', String(!all.hidden)); });
  $('#jb-prev').addEventListener('click', () => go(cur - 1));
  $('#jb-next').addEventListener('click', () => go(cur + 1));
  $('#totop').addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  setCur(0, false);
}
function renderBooks(arg){
  const crumbHome = '<a href="#home">홈</a>';
  if (!arg) {
    view.innerHTML = band({ cls:'s-books', crumb:`${crumbHome} › 독서 모임`, title:'독서 모임', desc:'책을 누르면 소개와 모임 자료를 볼 수 있어요.', img: bandImg('images/sections/books.png') }) + `
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
addEventListener('selectstart', e => { if (!e.target.closest || !e.target.closest('input,textarea')) e.preventDefault(); });
async function init(){
  try {
    const [m, b, a, g] = await Promise.all(['materials','books','about','gyegi'].map(n => fetch(`data/${n}.json`).then(r => r.json())));
    DB.materials = m; DB.books = b; DB.about = a; DB.gyegi = g;
  } catch (e) {
    view.innerHTML = '<div class="empty" style="padding:80px 20px">자료를 불러오지 못했어요. 페이지를 새로고침해 주세요.</div>';
    hideLoader(); return;
  }
  buildNav();
  addEventListener('hashchange', route);
  const nv = $('.nav'), sc = () => nv.classList.toggle('scrolled', scrollY > 4); addEventListener('scroll', sc, { passive:true }); sc();
  addEventListener('resize', () => { setNavH(); const t = $('#ttabs'); if (t) moveInd(t); });
  const pad = i => String(i).padStart(2, '0');
  const imgs = ['images/hero.jpg',
    ...['about', 'world', 'korea', 'books', 'etc'].map(k => `images/banners/${k}.jpg`),
    ...['world', 'korea'].flatMap(k => [...[1, 2, 3, 4, 5, 6].map(i => `${k}-${pad(i)}`), `${k}-x`].map(c => `images/units/${c}.png`)),
    ...DB.materials.map(m => m.thumb).filter(Boolean),
    ...DB.books.map(b => b.cover).filter(Boolean)];
  await Promise.all([preload(imgs, 60000), (document.fonts && document.fonts.ready) || 0]);
  route();
  requestAnimationFrame(() => setTimeout(hideLoader, 150));
}
init();

try { if (localStorage.getItem('noanim')) document.body.classList.add('no-anim'); } catch (e) {}
