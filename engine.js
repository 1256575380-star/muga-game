/* MUGA: deterministic, browser-local simulation. Amounts are EUR millions. */
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./operations.js') : root.MUGAOperations, typeof module === 'object' && module.exports ? require('./real-players.js') : root.MUGARealPlayers);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MUGA = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Operations, Roster) {
  'use strict';
  const VERSION = 1;
  const POS = {GK:'门将',DF:'后卫',MF:'中场',FW:'前锋'};
  const ENGLISH = [['曼联',77],['曼城',85],['阿森纳',84],['利物浦',84],['切尔西',80],['纽卡斯尔',80],['热刺',78],['阿斯顿维拉',78],['布莱顿',76],['水晶宫',74],['富勒姆',73],['布伦特福德',74],['埃弗顿',72],['西汉姆联',73],['伯恩茅斯',74],['诺丁汉森林',74],['利兹联',70],['莱斯特城',71],['桑德兰',70],['伊普斯维奇',69]];
  const EURO = ['皇家马德里','巴塞罗那','拜仁慕尼黑','巴黎圣日耳曼','国际米兰','AC米兰','尤文图斯','那不勒斯','多特蒙德','勒沃库森','马德里竞技','毕尔巴鄂','本菲卡','波尔图','葡萄牙体育','阿贾克斯','埃因霍温','费耶诺德','马赛','里昂','摩纳哥','里尔','罗马','拉齐奥','亚特兰大','佛罗伦萨','皇家社会','比利亚雷亚尔','贝蒂斯','塞维利亚','莱比锡','法兰克福','斯图加特','弗赖堡','萨尔茨堡','格拉斯哥流浪者','凯尔特人','布鲁日','安德莱赫特','哥本哈根','加拉塔萨雷','费内巴切','贝西克塔斯','奥林匹亚科斯','雅典AEK','萨格勒布迪纳摩','贝尔格莱德红星','布拉格斯拉维亚','布拉格斯巴达','顿涅茨克矿工','基辅迪纳摩','年轻人','巴塞尔','卢加诺','维也纳快速','格拉茨风暴','尼斯','都灵','美因茨','赫罗纳'];
  const FIRST = ['卢卡','马特','里奥','奥利弗','马丁','丹尼尔','伊万','亚历克斯','托马斯','诺亚','雨果','埃里克','尼科','米洛','约纳斯','本','迪奥戈','拉斐尔','西蒙','维克托','加布里埃尔','塞缪尔','亚当','塞巴斯蒂安'];
  const LAST = ['沃克','科斯塔','莫雷诺','席尔瓦','贝克','马丁内斯','杜兰','霍尔','卡瓦略','彼得森','拉尔森','罗西','格林','哈特','克莱因','梅耶','杜阿尔特','科瓦奇','韦斯特','博格','丰塞卡','莫雷蒂','莱昂','埃文斯'];
  const COACHES = ['阿德里安·贝尔','马尔科·雷纳','维克托·科瓦奇','莱昂·费舍尔','安德烈·莫拉','托马斯·格雷'];
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const round = x => Math.round(x*10000)/10000;
  const sum = (a,f=x=>x) => a.reduce((v,x)=>v+f(x),0);
  function hash(str) { let x=2166136261; for (const c of String(str)) x=Math.imul(x^c.charCodeAt(0),16777619); return x>>>0; }
  function random(s) { s.rngState=(s.rngState+0x6D2B79F5)>>>0; let t=s.rngState; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); s.draws++; return ((t^(t>>>14))>>>0)/4294967296; }
  const int = (s,a,b) => a+Math.floor(random(s)*(b-a+1));
  const pick = (s,a) => a[Math.floor(random(s)*a.length)];
  function shuffle(s,a) { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=int(s,0,i);[a[i],a[j]]=[a[j],a[i]];}return a; }
  const team = s => s.clubs.find(c=>c.id===s.playerClub);
  const club = (s,id) => s.clubs.find(c=>c.id===id);
  const player = (s,id) => s.players.find(p=>p.id===id);
  const squad = (s,id=s.playerClub) => s.players.filter(p=>p.club===id);
  const star = p => p.ca>=85?5:p.ca>=75?4:p.ca>=65?3:2;
  function value(p) { const base=p.ca>=85?80+(p.ca-85)*6:p.ca>=75?35+(p.ca-75)*4.5:p.ca>=65?8+(p.ca-65)*2.7:Math.max(.4,(p.ca-40)*.12); const age=p.age<24?1.2:p.age<=28?1:p.age<=31?.8:.55; return round(base*clamp(age*(.6+Math.min(p.months,48)/80)*(p.pa>p.ca+6?1.1:1),.35,1.6)); }
  function newPlayer(s,c,pos,ca,age) { const months=48;return {id:'p'+s.nextId++,name:pick(s,FIRST)+'·'+pick(s,LAST),fictional:true,generatedSeason:s.season,club:c,pos,ca:clamp(ca,40,94),pa:clamp(ca+int(s,2,15),ca,95),age,months,wage:round(Math.max(.5,(ca-52)*.22)),book:0,fitness:100,morale:50,satisfaction:60,injury:0,minutes:0,starts:0,eligible:0,careerApps:0,academy:false,role:'轮换',signedSeason:0,fee:0,retire:false,bids:[],loan:null}; }
  function newClub(s,name,rating,league) { const c={id:'c'+s.nextId++,name,rating,league,budget:Math.max(25,(rating-55)*4),coach:rating,played:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}; s.clubs.push(c); const counts=league?{GK:3,DF:7,MF:7,FW:5}:{GK:2,DF:6,MF:6,FW:4}; for(const [pos,n] of Object.entries(counts))for(let i=0;i<n;i++)s.players.push(newPlayer(s,c.id,pos,rating+int(s,-10,3),int(s,19,33)));return c; }
  const REAL_VERSION='real-2026-11-14-v1';
  const REAL_NAMES={'Tom Heaton':'汤姆·希顿','Karl Darlow':'卡尔·达洛','Senne Lammens':'塞内·拉门斯','Dermot Mee':'德莫特·米','Harry Maguire':'哈里·马奎尔','Luke Shaw':'卢克·肖','Lisandro Martínez':'利桑德罗·马丁内斯','Diogo Dalot':'迪奥戈·达洛特','Matthijs de Ligt':'马泰斯·德利赫特','Noussair Mazraoui':'努赛尔·马兹拉维','Leny Yoro':'莱尼·约罗','Ayden Heaven':'艾登·海文','Harry Amass':'哈里·阿马斯','Patrick Dorgu':'帕特里克·多古','Bruno Fernandes':'布鲁诺·费尔南德斯','Youri Tielemans':'尤里·蒂勒曼斯','Mason Mount':'梅森·芒特','Manuel Ugarte':'曼努埃尔·乌加特','Andrey Santos':'安德雷·桑托斯','Kobbie Mainoo':'科比·梅努','Carlos Baleba':'卡洛斯·巴莱巴','Marcus Rashford':'马库斯·拉什福德','Matheus Cunha':'马特乌斯·库尼亚','Bryan Mbeumo':'布赖恩·姆伯莫','Joshua Zirkzee':'约书亚·齐尔克泽','Benjamin Sesko':'本亚明·谢什科','Amad Diallo':'阿马德·迪亚洛','Shea Lacey':'谢伊·莱西','Jack Fletcher':'杰克·弗莱彻','Tyler Fletcher':'泰勒·弗莱彻','Erling Haaland':'埃尔林·哈兰德','Kylian Mbappé':'基利安·姆巴佩','Jude Bellingham':'裘德·贝林厄姆','Lamine Yamal':'拉明·亚马尔','Mohamed Salah':'穆罕默德·萨拉赫','Harry Kane':'哈里·凯恩','Bukayo Saka':'布卡约·萨卡','Cole Palmer':'科尔·帕尔默','Declan Rice':'德克兰·赖斯'};
  // These are game-balancing estimates, never claimed as published ratings, wages or transfer values.
  const REAL_RATINGS={'Tom Heaton':65,'Karl Darlow':69,'Senne Lammens':77,'Harry Maguire':77,'Luke Shaw':76,'Lisandro Martínez':80,'Diogo Dalot':77,'Matthijs de Ligt':80,'Noussair Mazraoui':78,'Leny Yoro':78,'Ayden Heaven':69,'Patrick Dorgu':75,'Bruno Fernandes':86,'Youri Tielemans':82,'Mason Mount':76,'Manuel Ugarte':77,'Andrey Santos':77,'Kobbie Mainoo':78,'Carlos Baleba':80,'Marcus Rashford':79,'Matheus Cunha':82,'Bryan Mbeumo':83,'Joshua Zirkzee':75,'Benjamin Sesko':79,'Amad Diallo':80,'Erling Haaland':92,'Kylian Mbappé':92,'Jude Bellingham':89,'Lamine Yamal':90,'Mohamed Salah':89,'Harry Kane':90,'Bukayo Saka':88,'Cole Palmer':87,'Declan Rice':88};
  const FACTS=new Map((Roster?.clubs||[]).flatMap(c=>c.players.map(p=>[p.id,{...p,clubName:c.name,asOf:Roster.asOf}])));
  const identityOf=p=>p.realId?FACTS.get(p.realId)||null:null;
  const realWorld=s=>s.dataVersion===REAL_VERSION;
  const seasonYear=(s,season=s.season)=>(s.startYear||2027)+season-1;
  function ageOn(dob,date){let age=Number(date.slice(0,4))-Number(dob.slice(0,4));if(date.slice(5)<dob.slice(5))age--;return age;}
  function populateRealWorld(s){
    if(!Roster?.clubs||Roster.clubs.filter(c=>c.league).length!==20)throw Error('真实球员数据库未完整加载，请刷新重试。');
    s.dataVersion=REAL_VERSION;s.startYear=Roster.startYear;s.rosterAsOf=Roster.asOf;
    const ordered=Roster.clubs.slice().sort((a,b)=>a.name==='曼联'?-1:b.name==='曼联'?1:Number(b.league)-Number(a.league));
    for(const source of ordered){const old=ENGLISH.find(x=>x[0]===source.name),eu=EURO.indexOf(source.name),rating=old?.[1]||(source.competition.startsWith('eng.')?69:eu>=0&&eu<5?85:71+hash(source.id)%9);const c={id:'c'+s.nextId++,name:source.name,rating,league:source.league,budget:Math.max(25,(rating-55)*4),coach:rating,played:0,w:0,d:0,l:0,gf:0,ga:0,pts:0,competition:source.competition,realId:source.id,sourceUrl:source.pageUrl};s.clubs.push(c);if(source.name==='曼联')s.playerClub=c.id;
      for(const fact of source.players){const age=ageOn(fact.dob,Roster.asOf),estimate=REAL_RATINGS[fact.name]??clamp(rating-6+hash(fact.id)%11-(age<21?Math.max(0,21-age)*2:0),48,90),p=newPlayer(s,c.id,fact.position,estimate,age);Object.assign(p,{name:fact.nameZh||REAL_NAMES[fact.name]||fact.name,realId:fact.id,fictional:false,generatedSeason:0});s.players.push(p);}
    }
    const source=ordered.find(c=>c.name==='曼联'),preferred=new Set(Roster.preferredUnitedIds||source.preferredIds||[]),own=squad(s);let first=preferred.size?own.filter(p=>preferred.has(p.realId)):own.slice().sort((a,b)=>b.ca-a.ca).slice(0,25);if(first.length!==25){const g=own.filter(p=>p.pos==='GK').slice(0,3);first=[...g,...own.filter(p=>p.pos!=='GK').sort((a,b)=>b.ca-a.ca).slice(0,22)];}const keep=new Set(first.map(p=>p.id));for(const p of own)if(!keep.has(p.id)){p.club='academy';p.reserveClub=s.playerClub;p.wage=.5;p.book=0;}refreshAcademy(s);
  }
  function refreshAcademy(s){s.academy=[];if(realWorld(s)&&s.season<6){s.academy=s.players.filter(p=>p.club==='academy'&&p.reserveClub===s.playerClub&&p.age<=23).sort((a,b)=>a.age-b.age).slice(0,3).map(p=>p.id);}else for(let i=0;i<3;i++){const p=newPlayer(s,'academy',pick(s,Object.keys(POS)),int(s,48,66),int(s,16,18));p.pa=clamp(p.ca+int(s,10,22)+s.youthLevel*3,60,95);p.wage=.5;p.book=0;s.players.push(p);s.academy.push(p.id);}s.promotedThisYear=0;}
  function marketNewgens(s){if(!realWorld(s)||s.season<6)return [];const key=s.season+'-'+s.phase;if(s.newgenWindow===key)return s.players.filter(p=>p.generatedWindow===key&&p.club!==s.playerClub).map(p=>p.id);s.newgenWindow=key;const ids=[];for(let i=0;i<4;i++){const c=pick(s,s.clubs.filter(c=>c.id!==s.playerClub)),p=newPlayer(s,c.id,Object.keys(POS)[i],int(s,60,74),int(s,16,19));p.pa=int(s,Math.max(p.ca+8,80),95);p.generatedWindow=key;s.players.push(p);ids.push(p.id);}news(s,'新一代球员进入市场','第6季起，每个转会窗出现4名16–19岁虚构新秀。标记清楚，潜力未必诚实。','transfer');return ids;}
  function createGame(opts={}) {
    const seed=String(opts.seed||'MUGA-2027').slice(0,40); const s={version:VERSION,dataVersion:'fiction-2027-v1',seed,rngState:hash(seed),draws:0,nextId:1,name:String(opts.name||'新任总监').slice(0,20),gender:opts.gender||'不透露',background:opts.background||'经理人',style:opts.style||'沟通型',difficulty:['轻松','标准','挑战'].includes(opts.difficulty)?opts.difficulty:'标准',tone:opts.tone===0?0:2,gray:!!opts.gray,season:1,round:0,totalRounds:0,phase:'summer',windowStep:0,windowBudget:120,windowSpent:0,month:0,totalMonths:0,day:0,cash:200,baseRevenue:460,board:60,trust:50,fans:50,network:40,credit:50,risk:0,privateMoney:0,illicitMoney:0,clubs:[],players:[],fixtures:[],reports:[],news:[],history:[],ledger:[],finance:{income:0,expense:0,amort:0,saleProfit:0},loan:null,overdue:0,lowCashMonths:0,boardWarning:false,probation:false,lossHistory:[],rankHistory:[],target:6,coach:{name:'阿德里安·贝尔',ability:76,training:74,communication:73,wage:12,months:36,style:'433',warmup:0},dismissals:0,severance:0,formation:'433',tactic:'均衡',rotate:true,locked:[],scoutLevel:0,youthLevel:0,invested:false,market:[],offers:[],listed:[],coachMarket:[],event:null,eventSeen:[],promises:[],cases:[],investigation:null,actions:1,lastActionBlock:-1,analysis:0,bribeBoost:0,bribes:0,noWin:0,wins:[],trophies:{league:0,cl:0,el:0},europe:[],euroPrize:0,review:null,ended:null,callback:[],usedQuotes:[],statementCount:0,careerFailedPromises:0,adviser:0,qualifiedYouth:[],lastError:''};
    ensureOps(s);
    if(s.difficulty==='轻松')s.baseRevenue*=1.1;if(s.difficulty==='挑战')s.baseRevenue*=.9;
    if(s.background==='前球员')s.trust+=8;else if(s.background==='企业CEO')s.credit+=8;else s.network+=8;
    if(s.style==='沟通型')s.trust+=5;else if(s.style==='公众型')s.fans+=5;else s.credit+=5;
    if(opts.roster==='legacy'){for(const [n,r] of ENGLISH)newClub(s,n,r,true);s.playerClub=s.clubs[0].id;EURO.forEach((n,i)=>newClub(s,n,i<5?int(s,83,87):int(s,66,82),false));}else populateRealWorld(s);
    const own=squad(s);const wages=sum(own,p=>p.wage),assets=sum(own,p=>value(p));own.forEach((p,i)=>{p.wage=round(p.wage/wages*240);p.book=round(value(p)/assets*320);p.role=i%5===0?'主力':'轮换';});
    resetLeague(s);buildEurope(s);refreshMarket(s);refreshCoaches(s);
    news(s,'任命公告',`欢迎执掌曼联，${s.name}。你的前任也觉得问题不大。`,'board');
    news(s,'先做这三件事','点击“处理下一周事务”，签署方案、承受后果，再处理下一份文件。比赛由教练带队进行，经营账单由你负责。','info');return s;
  }
  function news(s,title,text,type='info') { s.news.unshift({id:'n'+s.nextId++,title,text,type,season:s.season,round:s.round});s.news=s.news.slice(0,100); }
  function fail(message) { return {ok:false,message}; }
  const ok = message => ({ok:true,message});
  function post(s,kind,amount,note) {
    amount=round(amount); const inflow=['income','sale','capital','loan'].includes(kind);s.cash=round(s.cash+(inflow?amount:-amount));
    if(kind==='income')s.finance.income+=amount;
    if(kind==='expense'||kind==='interest')s.finance.expense+=amount;
    s.ledger.unshift({kind,amount,note,season:s.season,month:s.month});s.ledger=s.ledger.slice(0,100);
  }
  const profit = s => round(s.finance.income-s.finance.expense-s.finance.amort+s.finance.saleProfit);
  function annualExpense(s,extra=0) { return sum(squad(s),p=>p.wage*(p.loan?.share??1))+s.coach.wage+2+150+extra+(s.adviser>0?5:0); }
  function safeCash(s,cost=0,extraWage=0) { const expense=annualExpense(s,extraWage);const net=(s.baseRevenue-expense)/12; const floor=s.cash-cost+Math.min(0,net*3)-(s.loan&&s.loan.remaining<=3?s.loan.principal:0);return {safe:floor>=expense/4,minimum:round(floor),buffer:round(expense/4),remaining:round(s.cash-cost)}; }
  function spendCheck(s,cost,wage=0) { const f=safeCash(s,cost,wage);if(!f.safe)return `交易后最低预测现金 ${f.minimum.toFixed(1)} 百万欧元，低于工资安全线 ${f.buffer.toFixed(1)}。先出售球员或选择更低成本方案。`;return ''; }
  function standings(s) { return s.clubs.filter(c=>c.league).slice().sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.id.localeCompare(b.id)); }
  const rank = s => standings(s).findIndex(c=>c.id===s.playerClub)+1;
  function schedule(ids) { const a=ids.slice(), rounds=[];for(let r=0;r<a.length-1;r++){const games=[];for(let i=0;i<a.length/2;i++){let h=a[i],v=a[a.length-1-i];if((r+i)%2)[h,v]=[v,h];games.push([h,v]);}rounds.push(games);a.splice(1,0,a.pop());}return rounds.concat(rounds.map(gs=>gs.map(([h,a])=>[a,h]))); }
  function resetLeague(s) { s.clubs.filter(c=>c.league).forEach(c=>Object.assign(c,{played:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}));s.fixtures=schedule(shuffle(s,s.clubs.filter(c=>c.league).map(c=>c.id))); }
  function refreshMarket(s) {
    const generated=marketNewgens(s),pool=shuffle(s,s.players.filter(p=>p.club!==s.playerClub&&club(s,p.club)&&!p.loan&&p.age>=16&&p.age<=34));const res=[];
    for(const [pos,count] of Object.entries({FW:4,MF:4,DF:5,GK:2})){const a=pool.filter(p=>p.pos===pos);for(let i=0;i<count;i++){const u=random(s),target=u<.07+Math.max(0,s.network-40)/1000?5:u<.4?4:3;const p=a.find(p=>star(p)===target&&!res.includes(p.id))||a.find(p=>!res.includes(p.id));if(p)res.push(p.id);}}
    for(const id of generated)if(!res.includes(id))res.push(id);s.market=res;s.marketData={};res.forEach(id=>{const p=player(s,id);s.marketData[id]={ask:round(value(p)*(1+random(s)*.15)*(s.difficulty==='挑战'?1.1:1)),wage:round(Math.max(p.wage,(p.ca>=85?12:p.ca>=75?6:2)+random(s)*4)),error:int(s,-6,6),attempts:0,lastBid:0,accepted:false,scouted:false};});
    s.freeMarket=[];const availableFree=realWorld(s)?shuffle(s,s.players.filter(p=>p.club==='free'&&p.age<=35)).slice(0,4):Array.from({length:4},()=>{const p=newPlayer(s,'free',pick(s,Object.keys(POS)),int(s,58,73),int(s,20,34));p.months=0;s.players.push(p);return p;});for(const p of availableFree){s.freeMarket.push(p.id);s.marketData[p.id]={ask:0,wage:p.wage,error:0,attempts:0,lastBid:0,accepted:true,scouted:true};}
    s.scans=0;s.windowNetwork=0;
  }
  function refreshCoaches(s) { s.coachMarket=COACHES.filter(n=>n!==s.coach.name).map(name=>({name,ability:int(s,68,88),training:int(s,65,90),communication:int(s,65,85),wage:int(s,4,18),months:36,style:pick(s,['433','4231','442']),warmup:4})); }
  function visibleAbility(s,p) { const m=s.marketData[p.id];if(!m||m.scouted)return {low:p.ca,high:p.ca};const error=Math.max(1,6-s.scoutLevel*2-(s.difficulty==='轻松'?1:0));const est=clamp(p.ca+clamp(m.error,-error,error),35,95);return {low:clamp(est-error,35,95),high:clamp(est+error,35,95)}; }
  function scout(s,id) { if(!['summer','winter'].includes(s.phase))return fail('转会窗口尚未开放。');const m=s.marketData[id];if(!m)return fail('目标已不在本窗名单。');if(m.scouted)return fail('已完成观察。');if(s.scans>=4)return fail('本窗4次观察已用完。');const cost=s.scans>=2?.5:0;const e=spendCheck(s,cost);if(e)return fail(e);if(cost)post(s,'expense',cost,'球探定向观察');s.scans++;m.scouted=true;return ok('球探报告已更新。至少这次，你看了报告。'); }
  function offerTransfer(s,id,fee) {
    if(s.event)return fail('请先处理待办事件。');if(!['summer','winter'].includes(s.phase))return fail('只可在转会窗口报价。');const p=player(s,id),m=s.marketData[id];if(!p||!m||p.club===s.playerClub)return fail('目标已不可用。');fee=Number(fee);if(!Number.isFinite(fee)||fee<0)return fail('报价无效。');
    if(m.accepted)return ok('俱乐部已接受，可以商谈个人合同。');if(m.attempts>=3)return fail('本窗对该目标的3次报价已用完。');if(fee<=m.lastBid&&m.attempts)return fail('报价必须高于上次；同一条件不能反复重抽。');
    m.attempts++;m.lastBid=fee;const prob=clamp(.5+(fee/m.ask-1)+.003*(s.network-40),.1,.95);m.accepted=random(s)<prob;
    if(m.accepted){m.agreedFee=fee;return ok('卖方接受报价。现在需要谈妥球员合同。');}m.ask=round(Math.max(fee*1.08,m.ask*.97));return fail(`报价被拒。最新要价 ${m.ask.toFixed(1)} 百万欧元。已使用 ${m.attempts}/3 次谈判。`);
  }
  function signPlayer(s,id,opts={}) {
    if(s.event)return fail('请先处理待办事件。');if(!['summer','winter'].includes(s.phase))return fail('转会窗口已关闭。');const p=player(s,id),m=s.marketData[id];if(!p||!m||p.club===s.playerClub)return fail('球员已不在市场。');if(!m.accepted)return fail('请先让卖方接受报价。');if(squad(s).length>=25)return fail('一线队已经25人，请先出售或等待租借归队。');
    const years=clamp(Math.floor(Number(opts.years)||4),1,5),wage=Number(opts.wage)||m.wage,role=opts.role==='主力'?'主力':'轮换';if(!Number.isFinite(wage)||wage<m.wage||wage>50)return fail('工资低于球员要求或超出有效范围。');
    if(p.ca>=85&&!s.europe.some(e=>e.ids.includes(s.playerClub))&&wage<m.wage*1.2)return fail('该球员要求欧战，或至少20%的额外工资补偿。');
    const fee=m.agreedFee??0,agent=fee?fee*.05:wage*.25,cost=fee+agent;
    if(s.windowSpent+cost>s.windowBudget+.00001)return fail('本窗审批额度不足；卖人可回补80%到账款。');const e=spendCheck(s,cost,wage);if(e)return fail(e);
    const seller=club(s,p.club);if(seller)seller.budget+=fee;
    post(s,'transfer',fee,`签入 ${p.name}`);post(s,'expense',agent,`${p.name} 经纪或签字费`);s.windowSpent+=cost;
    const old=value(p);Object.assign(p,{club:s.playerClub,months:years*12,wage,book:fee,role,fitness:100,morale:55,satisfaction:60,signedSeason:s.season,fee,minutes:0,starts:0,eligible:0});
    s.market=s.market.filter(x=>x!==id);s.freeMarket=s.freeMarket.filter(x=>x!==id);
    if(s.windowNetwork<3){s.network=clamp(s.network+1,0,100);s.windowNetwork++;}
    news(s,'签约完成',`${p.name} 加盟，转会费 ${fee.toFixed(1)}M，年薪 ${wage.toFixed(1)}M。`,'transfer');
    if(fee>old*1.3)news(s,'转会谈判圆满结束',s.tone?'对方圆满，你方结束。卖方以为你在开玩笑，直到银行确认到账。':'本次成交价格高于签约前估值30%。','roast');
    s.callback.push({kind:'sign',id:p.id,at:s.totalRounds+10,fee,old});
    if(s.gray&&!s.eventSeen.includes('G01')&&fee>=30){s.event=eventById(s,'G01');s.eventSeen.push('G01');}
    return ok('签约完成，工资与账面摊销已更新。');
  }
  function loanPlayer(s,id) {
    if(!['summer','winter'].includes(s.phase))return fail('只可在转会窗租借。');const p=player(s,id);if(s.event)return fail('请先处理待办事件。');if(!p||p.club===s.playerClub||p.club==='free'||p.loan||!s.market.includes(id))return fail('此球员不可租借。');if(p.ca>79)return fail('卖方只愿出售这名核心球员。');if(squad(s).length>=25)return fail('一线队名额已满。');const fee=value(p)*.1,wage=p.wage*.7;
    if(s.windowSpent+fee>s.windowBudget)return fail('转会额度不足。');const e=spendCheck(s,fee,wage);if(e)return fail(e);
    const origin=p.club;p.loan={origin,share:.7,until:s.season};p.club=s.playerClub;p.role='轮换';post(s,'expense',fee,`租借 ${p.name}`);s.windowSpent+=fee;s.market=s.market.filter(x=>x!==id);news(s,'租借完成',`${p.name} 加盟至季末，承担70%工资。`,'transfer');return ok('租借完成。');
  }
  function listPlayer(s,id) { const p=player(s,id);if(!p||p.club!==s.playerClub||p.loan)return fail('无法挂牌该球员。');if(s.listed.includes(id)){s.listed=s.listed.filter(x=>x!==id);return ok('已撤销挂牌。');}s.listed.push(id);news(s,'挂牌出售',`${p.name} 已进入市场。推进一次窗口以等待买家报价。`,'transfer');return ok('已挂牌，下次推进窗口时寻找买家。'); }
  function generateOffers(s) { for(const id of s.listed){const p=player(s,id);if(!p||s.offers.some(o=>o.player===id))continue;const fee=round(value(p)*(.65+random(s)*.4));const buyer=pick(s,s.clubs.filter(c=>c.id!==s.playerClub&&c.budget>=fee));if(!buyer)continue;s.offers.push({id:'o'+s.nextId++,player:id,buyer:buyer.id,fee,willing:random(s)<.85});} }
  function sellPlayer(s,id) {
    if(!['summer','winter'].includes(s.phase))return fail('窗口已关闭。');const o=s.offers.find(o=>o.id===id);if(!o)return fail('报价已过期。');const p=player(s,o.player),own=squad(s),b=club(s,o.buyer);if(!p||p.club!==s.playerClub||!b)return fail('球员或买家不可用。');if(own.length<=18||p.pos==='GK'&&own.filter(p=>p.pos==='GK').length<=2)return fail('出售后不足18人或2名门将，请先补位。');if(!o.willing){s.offers=s.offers.filter(x=>x!==o);return fail('球员拒绝加盟该俱乐部。此次没有现金到账。');}if(b.budget<o.fee)return fail('买家预算不足，报价失效。');
    b.budget-=o.fee;post(s,'sale',o.fee,`出售 ${p.name}`);s.finance.saleProfit+=o.fee-p.book;s.windowBudget+=o.fee*.8;p.club=b.id;p.book=o.fee;p.months=36;s.listed=s.listed.filter(x=>x!==p.id);s.offers=s.offers.filter(x=>x.player!==p.id);s.locked=s.locked.filter(x=>x!==p.id);news(s,'转会收入到账',`${p.name} 转会 ${b.name}，收入 ${o.fee.toFixed(1)}M。`,'transfer');return ok('出售完成，现金和审批额度已更新。');
  }
  function renew(s,id,years=3) { const p=player(s,id);if(!p||p.club!==s.playerClub||p.loan)return fail('无法续约。');if(p.months>24)return fail('剩余合同超过两年，暂不需要续约。');const wage=round(p.wage*1.1),e=spendCheck(s,0,wage-p.wage);if(e)return fail(e);p.months=clamp(years,1,5)*12;p.wage=wage;p.satisfaction=clamp(p.satisfaction+5,0,100);return ok('续约完成，工资上涨10%，账面价值没有重置。'); }
  function hireCoach(s,index) { if(s.event)return fail('请先处理事件。');if(s.dismissals>=3)return fail('本季已用完3次换帅机会。');const c=s.coachMarket[index];if(!c)return fail('候选人已变更。');const severance=s.coach.wage*s.coach.months/12*.5,e=spendCheck(s,severance,c.wage-s.coach.wage);if(e)return fail(e);post(s,'expense',severance,'主帅解约金');s.severance+=severance;s.dismissals++;s.coach={...c};s.coachMarket.splice(index,1);news(s,'长期计划，短期负责人',s.tone?(s.dismissals>=2?'你成功证明了，曼联的问题确实不止主教练一个。还有你。':'新任主帅已到岗。解约金比战术更早完成磨合。'):`${c.name} 上任；前4场存在磨合影响。`,'roast');return ok(`${c.name} 上任。解约金 ${severance.toFixed(1)}M。`); }
  function setTactics(s,formation,tactic,rotate) { if(!['433','4231','442'].includes(formation)||!['均衡','主动进攻','稳守'].includes(tactic))return fail('战术参数无效。');s.formation=formation;s.tactic=tactic;s.rotate=!!rotate;return ok('已向主教练提交竞技方针。'); }
  function lockPlayer(s,id) { if(s.locked.includes(id)){s.locked=s.locked.filter(x=>x!==id);return ok('已取消优先首发。');}if(s.locked.length>=3)return fail('最多指定3名优先首发。');if(!squad(s).some(p=>p.id===id))return fail('球员不在本队。');s.locked.push(id);return ok('已设为健康时优先首发。'); }
  function lineup(s,id=s.playerClub) { const own=id===s.playerClub,form=own?s.formation:'433',n=form==='442'?{GK:1,DF:4,MF:4,FW:2}:form==='4231'?{GK:1,DF:4,MF:5,FW:1}:{GK:1,DF:4,MF:3,FW:3};const list=squad(s,id).filter(p=>p.injury<=0),used=new Set(),selected=[];
    for(const [pos,count] of Object.entries(n)){const sorted=list.slice().sort((a,b)=>{const score=p=>p.ca+(p.pos===pos?0:pos==='GK'?-25:-12)+(p.fitness-80)/10+(p.morale-50)/20+(own&&p.pos===pos&&s.locked.includes(p.id)?30:0)-(own&&s.rotate&&p.fitness<70?15:0);return score(b)-score(a);});for(let i=0;i<count;i++){const p=sorted.find(p=>!used.has(p.id));if(p){used.add(p.id);selected.push({p,pos,effective:clamp(p.ca+(p.pos===pos?0:pos==='GK'?-25:-12)+(p.fitness-80)/10+(p.morale-50)/20,30,99)});}else selected.push({p:null,pos,effective:45});}}
    return selected;
  }
  function strength(s,id,venue=null) { const sel=lineup(s,id),avg=pos=>{const a=sel.filter(x=>x.pos===pos);return sum(a,x=>x.effective)/a.length;};const own=id===s.playerClub,c=club(s,id);let mod=own?(s.coach.ability-70)/10+(s.trust-50)/25+(s.coach.style===s.formation?1:-1)-(s.coach.warmup?2*s.coach.warmup/4:0):(c.coach-70)/10;mod=clamp(mod,-5,5);let attack=.65*avg('FW')+.35*avg('MF')+mod,defense=.6*avg('DF')+.25*avg('GK')+.15*avg('MF')+mod;if(own){if(s.tactic==='主动进攻'){attack+=2;defense-=2;}if(s.tactic==='稳守'){attack-=2;defense+=2;}attack+=s.analysis;}const baseAttack=attack,baseDefense=defense,sporting=own?sportingImpact(s,venue||nextVenue(s)):null;if(sporting){attack+=sporting.attack;defense+=sporting.defense;}return {attack,defense,baseAttack,baseDefense,sporting,lineup:sel}; }
  function poisson(s,lambda) { const limit=Math.exp(-lambda);let k=0,p=1;do{k++;p*=random(s);}while(p>limit&&k<20);return k-1; }
  function recover(s,days) { s.day+=days;s.players.forEach(p=>{p.fitness=Math.min(100,p.fitness+days*3);p.injury=Math.max(0,p.injury-days);}); }
  function match(s,homeId,awayId,label,neutral=false) { const h=strength(s,homeId,neutral?'neutral':'home'),a=strength(s,awayId,neutral?'neutral':'away'),home=club(s,homeId),away=club(s,awayId);const hx=clamp(1.35*Math.exp((h.attack-a.defense)/30)+(neutral?0:.15)+(homeId===s.playerClub?s.bribeBoost:0),.2,3.5),ax=clamp(1.35*Math.exp((a.attack-h.defense)/30)+(awayId===s.playerClub?s.bribeBoost:0),.2,3.5);const hg=poisson(s,hx),ag=poisson(s,ax);const report={id:'m'+s.nextId++,season:s.season,round:s.round,label,home:home.name,away:away.name,homeId,awayId,hg,ag,hx:round(hx),ax:round(ax),injuries:[],reason:[],quote:''};
    if(homeId===s.playerClub||awayId===s.playerClub){const isHome=homeId===s.playerClub,own=isHome?h:a;const bx=clamp(1.35*Math.exp((h.baseAttack-a.baseDefense)/30)+(neutral?0:.15)+(homeId===s.playerClub?s.bribeBoost:0),.2,3.5),by=clamp(1.35*Math.exp((a.baseAttack-h.baseDefense)/30)+(awayId===s.playerClub?s.bribeBoost:0),.2,3.5);report.sporting={...own.sporting,ourBefore:round(isHome?bx:by),ourAfter:round(isHome?hx:ax),theirBefore:round(isHome?by:bx),theirAfter:round(isHome?ax:hx)};}
    for(const side of [h,a])for(const x of side.lineup)if(x.p){const p=x.p;p.fitness=clamp(p.fitness-12-(p.club===s.playerClub&&s.tactic==='主动进攻'?3:0),0,100);p.minutes+=90;p.starts++;p.careerApps++;if(random(s)<.004+(p.fitness<60?.008:0)){p.injury=pick(s,[7,7,7,7,7,14,14,14,28,56]);if(p.club===s.playerClub)report.injuries.push(`${p.name} 伤停${p.injury}天`);}}
    if(homeId===s.playerClub||awayId===s.playerClub){squad(s).filter(p=>p.injury<=0).forEach(p=>p.eligible++);const us=homeId===s.playerClub?hg:ag,them=homeId===s.playerClub?ag:hg;report.result=us>them?'W':us===them?'D':'L';s.wins.push(report.result);s.wins=s.wins.slice(-12);s.noWin=report.result==='W'?0:s.noWin+1;
      s.trust=clamp(s.trust+(us>them?1:us<them?-1:0),0,100);s.fans=clamp(s.fans+(us>them?1:us<them?-1:0),0,100);squad(s).forEach(p=>p.morale=clamp(p.morale+(us>them?2:us<them?-2:0),0,100));
      const own=homeId===s.playerClub?h:a;const tired=own.lineup.filter(x=>x.p&&x.p.fitness<65).length;if(tired)report.reason.push(`${tired}名首发体能偏低，轮换会有帮助。`);if(own.lineup.some(x=>!x.p||x.pos!==x.p.pos))report.reason.push('阵容缺口导致客串，影响实际战力。');report.reason.push(`攻 ${own.attack.toFixed(0)} / 防 ${own.defense.toFixed(0)}；主帅${s.coach.warmup?'仍在磨合':'已适应球队'}。`);
      if(s.tone){if(s.noWin>=4)report.quote='上轮重建，本轮复读。请勿退出长期计划。';else if(us>them)report.quote='本轮终于有素材不用调低画质。';else if(us<them)report.quote='俱乐部仍然很大，主要体现在工资单上。';else report.quote='双方各拿一分。新闻稿拿到了宝贵的解释空间。';}
      if(s.coach.warmup)s.coach.warmup--;s.analysis=0;s.bribeBoost=0;s.reports.unshift(report);s.reports=s.reports.slice(0,60);consumeSporting(s,report.sporting.venue);if(report.injuries.length)news(s,'医疗室报告',report.injuries.join('；'),'injury');
    }return report;
  }
  function recordTable(rows,id,gf,ga) { const t=rows.find(x=>x.id===id);t.played++;t.gf+=gf;t.ga+=ga;if(gf>ga){t.w++;t.pts+=3;}else if(gf===ga){t.d++;t.pts++;}else t.l++; }
  function sortedRows(rows) { return rows.slice().sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.id.localeCompare(b.id)); }
  function buildEurope(s,qualified) {
    const eng=s.clubs.filter(c=>c.league),top=qualified||[eng[1].id,eng[2].id,eng[3].id,eng[4].id,s.playerClub,eng[5].id];const outside=shuffle(s,s.clubs.filter(c=>!c.league&&(!realWorld(s)||!c.competition?.startsWith('eng.'))).map(c=>c.id));const ids1=[...top.slice(0,4),...outside.slice(0,28)],ids2=[...top.slice(4,6),...outside.slice(28,58)];
    s.europe=[['cl','冠军杯',ids1],['el','欧联杯',ids2]].map(([key,name,ids])=>{const draw=shuffle(s,ids);const groups=[];for(let i=0;i<8;i++)groups.push(draw.slice(i*4,i*4+4).map(id=>({id,pts:0,played:0,gf:0,ga:0,w:0,d:0,l:0})));return {key,name,ids,groups,matchday:0,alive:[],stage:'小组赛',finished:false,champion:null,prizePaid:false};});s.euroPrize=0;
  }
  function euroPay(s,e,stage) { if(e.prizePaid||!e.ids.includes(s.playerClub))return;const prizes=e.key==='cl'?[20,35,55,80,110,150]:[8,12,20,30,40,60];const amount=prizes[stage];post(s,'income',amount,`${e.name} ${['小组出局','16强','8强','4强','亚军','冠军'][stage]}奖金`);s.euroPrize+=amount;e.prizePaid=true;news(s,'欧战奖金到账',`${e.name}：${amount}M，按最高阶段一次结算。`,'finance');if(stage===5){s.trophies[e.key]++;s.fans=clamp(s.fans+8,0,100);s.board=clamp(s.board+8,0,100);} }
  function playEurope(s) {
    const groupRounds=[3,6,9,12,15,18],knockRounds=[23,27,31,35];const gd=groupRounds.indexOf(s.round),kd=knockRounds.indexOf(s.round);if(gd<0&&kd<0)return;
    recover(s,3);
    for(const e of s.europe){if(e.finished)continue;
      if(gd>=0){for(const rows of e.groups){const pairs=schedule(rows.map(x=>x.id))[gd];for(const [h,a] of pairs){const r=match(s,h,a,e.name+' 小组赛');recordTable(rows,h,r.hg,r.ag);recordTable(rows,a,r.ag,r.hg);}}e.matchday=gd+1;if(gd===5){e.alive=e.groups.flatMap(g=>sortedRows(g).slice(0,2).map(x=>x.id));e.stage='16强';if(!e.alive.includes(s.playerClub))euroPay(s,e,0);}}
      else {const winners=[];e.stage=['16强','8强','4强','决赛'][kd];for(let i=0;i<e.alive.length;i+=2){const h=e.alive[i],a=e.alive[i+1];const r=match(s,h,a,`${e.name} ${e.stage}`,true);let winner=r.hg>r.ag?h:r.ag>r.hg?a:random(s)<.5?h:a;if(r.hg===r.ag){r.pens=club(s,winner).name;const shown=s.reports.find(x=>x.id===r.id);if(shown)shown.pens=r.pens;}winners.push(winner);if((h===s.playerClub||a===s.playerClub)&&winner!==s.playerClub)euroPay(s,e,kd+1);}e.alive=winners;if(kd===3){e.finished=true;e.champion=winners[0];if(e.champion===s.playerClub)euroPay(s,e,5);}}
    }s.nextRest=4;
  }
  function ensureOps(s) {
    if(!s.ops)s.ops={stadium:45,staff:55,brand:50,turn:s.totalRounds||0,handled:0,seasonHandled:0,flags:{},queue:[],contracts:[],recent:[]};
    if(!s.ops.sporting)s.ops.sporting=[];if(!s.ops.sportSources)s.ops.sportSources={};
    if(!s.ops.people)s.ops.people={liaison:null,appointedSeason:0,lastActionTurn:-1,relations:{scout:0,agent:0,analyst:0},intelSeason:0,intelUsed:0,recommendKey:"",projects:[],completed:[],reports:[]};
    return s.ops;
  }
  function peopleState(s){return ensureOps(s).people;}
  function peopleActionCheck(s,cost=0){if(s.ended||s.phase==='review')return '请在进行中的赛季行动。';const p=peopleState(s);if(p.lastActionTurn===s.ops.turn)return '本周总监行动已用，推进一周后恢复。';return cost?spendCheck(s,cost):'';}
  function completePeopleAction(s,message){peopleState(s).lastActionTurn=s.ops.turn;return ok(message);}
  function liaisonReport(s){const p=peopleState(s),l=p.liaison;if(!l)return null;const member=player(s,l.playerId);if(!member||member.club!==s.playerClub)return null;const own=squad(s),unhappy=own.filter(x=>x.satisfaction<50||x.morale<45),roles=own.filter(x=>x.role==='主力'&&x.eligible>=8&&x.starts/x.eligible<.6),expiring=own.filter(x=>x.months<=12&&!x.loan);return {from:member.name,season:s.season,round:s.round,rapport:l.rapport,summary:unhappy.length?`${unhappy.length}名球员情绪偏低，需要关注。`:'目前没有明显低落的球员，沉默暂时不等于阴谋。',details:l.rapport>=60?[...unhappy.slice(0,3).map(x=>`${x.name}：士气${Math.round(x.morale)}，满意度${Math.round(x.satisfaction)}`),...roles.slice(0,3).map(x=>`${x.name}：主力承诺与首发比例不符（${x.starts}/${x.eligible}）`),...expiring.slice(0,2).map(x=>`${x.name}：合同剩余${x.months}个月`)]:['联络默契达到60可获得具体姓名与矛盾线索。']};}
  function saveLiaisonReport(s){const report=liaisonReport(s);if(!report)return;const p=peopleState(s);p.reports.unshift(report);p.reports=p.reports.slice(0,12);news(s,'球员联络人周报',`${report.from}：${report.summary}`,'team');}
  function appointLiaison(s,id,mode='open'){const p=peopleState(s),e=peopleActionCheck(s,.2),member=player(s,id);if(e)return fail(e);if(!member||member.club!==s.playerClub)return fail('请选择本队球员。');if(!['open','covert'].includes(mode))return fail('联络方式无效。');if(p.appointedSeason===s.season)return fail('每赛季只能任命一位联络人。');post(s,'expense',.2,'球员联络机制启动');p.liaison={playerId:id,name:member.name,mode,rapport:45,trained:0};p.appointedSeason=s.season;s.trust=clamp(s.trust+(mode==='open'?2:-5),0,100);member.satisfaction=clamp(member.satisfaction+3,0,100);if(mode==='covert')s.ops.queue.push({id:'F20',due:s.ops.turn+2,source:'球员联络人任命',choice:'鼓励私下监视同事'});saveLiaisonReport(s);return completePeopleAction(s,mode==='open'?'联络人已到岗，每4轮提交报告。':'私下联络已建立，信任−5；两周后将处理队内反应。');}
  function trainLiaison(s){const p=peopleState(s),e=peopleActionCheck(s,.5);if(e)return fail(e);if(!p.liaison||!squad(s).some(x=>x.id===p.liaison.playerId))return fail('请先任命在队的球员联络人。');if(p.liaison.trained>=2)return fail('本赛季两次联络培养已完成。');post(s,'expense',.5,'联络人沟通与核实培训');p.liaison.rapport=clamp(p.liaison.rapport+20,0,100);p.liaison.trained++;s.trust=clamp(s.trust+1,0,100);saveLiaisonReport(s);return completePeopleAction(s,'联络默契+20，信任+1；详细报告已更新。');}
  function contactPerson(s,kind){const p=peopleState(s),e=peopleActionCheck(s,.3);if(e)return fail(e);if(!Object.hasOwn(p.relations,kind))return fail('请选择已有联系人。');if(p.relations[kind]>=100)return fail('该联系人的熟悉度已满。');post(s,'expense',.3,'圈内联系人维护');p.relations[kind]=clamp(p.relations[kind]+25,0,100);s.network=clamp(s.network+3,0,100);return completePeopleAction(s,'熟悉度+25，人脉+3；可以向这位联系人提出具体请求。');}
  function requestContact(s,kind){const p=peopleState(s),e=peopleActionCheck(s,kind==='analyst'?1:.5);if(e)return fail(e);if(!Object.hasOwn(p.relations,kind)||p.relations[kind]<25)return fail('先联络一次，使熟悉度达到25。');if(kind==='analyst'){if(p.intelSeason!==s.season){p.intelSeason=s.season;p.intelUsed=0;}if(p.intelUsed>=4)return fail('本赛季4次情报请求已用完。');post(s,'expense',1,'圈内分析员对手报告');p.intelUsed++;s.ops.sporting=s.ops.sporting.filter(x=>x.key!=='contact-intel');s.ops.sporting.push({key:'contact-intel',label:'圈内分析员核实情报',attack:1,defense:2,remaining:1,scope:'all',source:'圈内联系人',choice:'请求对手报告'});news(s,'圈内情报到账','下一场正式比赛攻击+1、防守+2；已体现在经营备战状态。','team');return completePeopleAction(s,'下一场情报已生效，同类报告不叠加。');}
    if(!['summer','winter'].includes(s.phase))return fail('球探与经纪人推荐请在转会窗请求。');const key=s.season+'-'+s.phase+'-'+kind;if(p.recommendKey.split('|').includes(key))return fail('该联系人本窗口的推荐已经交付。');const id=s.market.find(id=>s.marketData[id]&&!s.marketData[id].scouted);if(!id)return fail('当前推荐池已全部完成观察。');post(s,'expense',.5,'联系人核实转会目标');s.marketData[id].scouted=true;p.recommendKey=(p.recommendKey?p.recommendKey+'|':'')+key;p.recommendedId=id;news(s,'圈内推荐已核实',`${player(s,id).name} 的能力已完成观察，可在市场查看。`,'team');return completePeopleAction(s,'已核实一名转会目标，不占用普通球探次数。');
  }
  function startDevelopment(s,id){const p=peopleState(s),e=peopleActionCheck(s,1);if(e)return fail(e);const member=player(s,id);if(!member||member.club!==s.playerClub||member.loan||member.age>23||member.ca>=member.pa)return fail('请选择23岁或以下、有成长空间的本队非租借球员。');if(p.projects.some(x=>x.playerId===id)||p.completed.some(x=>x.playerId===id&&x.season===s.season))return fail('该球员已有培养计划，或本赛季已培养。');if(p.projects.length>=2)return fail('最多同时培养两人。');post(s,'expense',1,'球员个人培养计划');p.projects.push({playerId:id,name:member.name,progress:0,target:8,startApps:member.careerApps,season:s.season});return completePeopleAction(s,'培养计划已启动：8个健康联赛周后能力+1，期间出场至少3场则+2，不超过潜力上限。');}
  function peopleWeek(s){const p=peopleState(s);if(p.liaison&&!squad(s).some(x=>x.id===p.liaison.playerId)){news(s,'联络人离队',`${p.liaison.name} 已离队，联络渠道停止。本赛季任命额度不返还。`,'team');p.liaison=null;}if(s.round%4===0)saveLiaisonReport(s);const ongoing=[];for(const plan of p.projects){const member=player(s,plan.playerId);if(!member||member.club!==s.playerClub){news(s,'培养计划中止',plan.name+' 已不在队，未完成培养。','team');continue;}if(member.injury<=0)plan.progress++;if(plan.progress>=plan.target){const gain=Math.min(member.pa-member.ca,member.careerApps-plan.startApps>=3?2:1);member.ca+=Math.max(0,gain);p.completed.unshift({...plan,season:s.season,gain:Math.max(0,gain)});p.completed=p.completed.slice(0,24);news(s,'培养计划完成',`${member.name} 能力+${Math.max(0,gain)}，当前${member.ca}。成长终于不是一句宣传口号。`,'team');}else ongoing.push(plan);}p.projects=ongoing;}
  const scopeMatches=(scope,venue)=>scope==='all'||scope===venue;
  function nextVenue(s){const f=s.fixtures[s.round]?.find(g=>g.includes(s.playerClub));return f?.[0]===s.playerClub?'home':'away';}
  function sportingImpact(s,venue='away') {
    const o=s.ops||{staff:55,stadium:45},rows=[];
    const metric=(key,label,value,scale,route)=>{const n=round((value-50)*scale),source=o.sportSources?.[key];rows.push({label,attack:n,defense:n,detail:`${label} ${Math.round(value)}/100 → ${route}`,source:source?source.title+' · '+source.choice:'当前经营状态',remaining:0,scope:venue});};
    metric('staff','员工士气',o.staff,.08,'后勤与训练支持');
    if(venue==='home'){metric('stadium','设施可靠度',o.stadium,.06,'主场保障');metric('fans','球迷支持',s.fans,.04,'主场助威');}
    for(const e of o.sporting||[])if(scopeMatches(e.scope,venue))rows.push({label:e.label,attack:e.attack,defense:e.defense,detail:`剩余${e.remaining}场${e.scope==='home'?'主场':e.scope==='away'?'客场':'正式比赛'}`,source:e.source+' · '+e.choice,remaining:e.remaining,scope:e.scope});
    const rawAttack=round(sum(rows,r=>r.attack)),rawDefense=round(sum(rows,r=>r.defense));return {venue,rows,attack:round(clamp(rawAttack,-8,8)),defense:round(clamp(rawDefense,-8,8)),capped:Math.abs(rawAttack)>8||Math.abs(rawDefense)>8};
  }
  function withSportingChoice(s,fx,source='',choice=''){
    const o=s.ops||{staff:55,stadium:45,brand:50},draft={...s,fans:clamp(s.fans+(fx.fans||0),0,100),ops:{...o,sporting:(o.sporting||[]).map(x=>({...x}))}};
    for(const k of ['staff','stadium','brand'])draft.ops[k]=clamp(o[k]+(fx.ops?.[k]||0),0,100);
    if(fx.sporting){const e=fx.sporting;draft.ops.sporting=draft.ops.sporting.filter(x=>x.key!==e.key);draft.ops.sporting.push({...e,remaining:e.matches,source,choice});}
    return draft;
  }
  function sportingPreview(s,option){const draft=withSportingChoice(s,option.fx);return {home:{before:sportingImpact(s,'home'),after:sportingImpact(draft,'home')},away:{before:sportingImpact(s,'away'),after:sportingImpact(draft,'away')},effect:option.fx.sporting||null};}
  function consumeSporting(s,venue){const o=ensureOps(s);for(const e of o.sporting)if(scopeMatches(e.scope,venue))e.remaining--;o.sporting=o.sporting.filter(e=>e.remaining>0);}
  function operatingImpact(s) { const o=ensureOps(s);return {income:round((o.brand-50)*.04+(o.stadium-50)*.03),expense:round((50-o.staff)*.04)}; }
  function operatingMonth(s) {
    const o=ensureOps(s),impact=operatingImpact(s);
    if(impact.income)post(s,'income',impact.income,'商业信誉与球场体验调整');
    if(impact.expense)post(s,'expense',impact.expense,'员工效率调整');
    for(const c of o.contracts){if(c.income)post(s,'income',c.income,c.name);if(c.expense)post(s,'expense',c.expense,c.name);c.remaining--;if(!c.remaining)news(s,'经营合同到期',c.name+' 已完成最后一期结算。','finance');}
    o.contracts=o.contracts.filter(c=>c.remaining>0);o.stadium=clamp(o.stadium-1,0,100);
  }
  function monthly(s) {
    s.month++;s.totalMonths++;operatingMonth(s);post(s,'income',s.baseRevenue/12,'每月商业、转播及比赛日收入');post(s,'expense',annualExpense(s)/12,'工资与固定运营');
    const own=squad(s);for(const p of own){if(!p.loan&&p.months>0){const a=p.book/p.months;s.finance.amort+=a;p.book=Math.max(0,p.book-a);p.months--;}if(!p.loan&&p.months===0){p.club='free';p.book=0;s.listed=s.listed.filter(x=>x!==p.id);news(s,'合同到期',`${p.name} 自由离队。此前的合同预警已经兑现。`,'contract');}}
    if(s.coach.months>0)s.coach.months--;if(s.coach.months===0){s.coach.months=12;s.coach.wage=round(s.coach.wage*1.05);news(s,'主帅合同续期','主帅按预设委托续约1年，工资上涨5%。','contract');}if(s.adviser>0)s.adviser--;
    s.privateMoney+=2/12;
    if(s.loan){post(s,'interest',s.loan.principal*s.loan.rate/12,'过桥贷款利息');s.loan.remaining--;if(s.loan.remaining<=0){post(s,'principal',s.loan.principal,'归还贷款本金');s.loan=null;news(s,'贷款到期','本金已归还。伟大复兴暂时接受银行转账。','finance');}}
    s.overdue=s.cash<0?s.overdue+1:0;if(s.overdue>=2){finish(s,'insolvent');if(s.ended)return;}
    const safe=safeCash(s);s.lowCashMonths=safe.safe?0:s.lowCashMonths+1;
    if(s.round>0&&s.round<38){let delta=rank(s)<=s.target?2:rank(s)<=s.target+3?-2:-5;if(s.lowCashMonths>=2)delta-=5;delta=clamp(delta,-8,8);if(s.difficulty==='轻松'&&delta<0)delta/=2;s.board=clamp(s.board+delta,0,100);const protectedRounds=s.difficulty==='挑战'?4:8;
      if(s.board<25&&s.round>=protectedRounds){if(s.boardWarning){finish(s,'board');if(s.ended)return;}s.boardWarning=true;news(s,'董事会最后通牒','下个月评估时信心仍低于25，你将被解雇。请立即改善成绩或处理危机。','danger');}else if(s.board>=25)s.boardWarning=false;
    }
    if(s.investigation&&s.totalMonths>=s.investigation.due){finish(s,'scandal');if(s.ended)return;}
    if(!s.ops.freePlay&&s.cases.length&&!s.investigation&&random(s)<Math.min(.35,.02+.003*s.risk)){s.investigation={due:s.totalMonths+1};news(s,'调查通知','独立调查将在下个结算月裁决。公关稿不能修改财务流水。','danger');s.pauseReason='调查已经启动';}
    if(s.cash<safe.buffer)s.pauseReason='现金低于安全线';
  }
  function settleTo(s,target) { while(s.month<target&&!s.ended)monthly(s); }
  function takeLoan(s,amount) { amount=Number(amount);if(!Number.isFinite(amount)||amount<=0||amount>Math.min(50,s.baseRevenue*.1))return fail('贷款额度无效，最高5000万或确定收入的10%。');if(s.credit<50||s.loan||s.probation)return fail('信用须至少50、无未清贷款且不在整改期。');const rate=Math.max(.06,.1-.001*(s.credit-50));const projected=s.cash+s.baseRevenue+15-annualExpense(s)-amount*rate;if(projected<annualExpense(s)/4)return fail('按确定收入预测，到期偿债后不足安全储备。');s.loan={principal:amount,remaining:12,rate};post(s,'loan',amount,'过桥借款');return ok('贷款到账，12个月内按月付息，到期还本。'); }
  function repayLoan(s) { if(!s.loan)return fail('没有未偿贷款。');if(s.cash-s.loan.principal<annualExpense(s)/4)return fail('提前还款后不足安全储备。');post(s,'principal',s.loan.principal,'提前偿还贷款');s.loan=null;return ok('贷款已还清。'); }
  function invest(s,scout,youth) { if(s.phase!=='summer'||s.invested)return fail('年度投入仅在夏窗选择一次。');scout=clamp(Number(scout)||0,0,2);youth=clamp(Number(youth)||0,0,2);const cost=scout*3+youth*5,e=spendCheck(s,cost);if(e)return fail(e);post(s,'expense',cost,'年度球探与青训投入');s.scoutLevel=scout;s.youthLevel=youth;s.invested=true;return ok('年度投入已确定。'); }
  function management(s,type) { if(!['league'].includes(s.phase)||s.event||s.ended)return fail('请在联赛阶段、无待办时行动。');if(s.actions<1)return fail('本周期的管理行动已使用，下一4轮周期恢复。');
    if(type==='talk'){s.trust=clamp(s.trust+4,0,100);squad(s).forEach(p=>p.morale=clamp(p.morale+2,0,100));news(s,'更衣室沟通','你兑现了一次倾听。至少这次没有先准备新闻稿。','team');}
    else if(type==='analysis'){const e=spendCheck(s,1);if(e)return fail(e);post(s,'expense',1,'对手分析报告');s.analysis=random(s)<.75?1:0;news(s,'战术情报','下场将使用分析报告；情报可能过时，不保证赢球。','team');}
    else if(type==='investigate'){if(s.round<8||rank(s)<=10||s.trust>=35)return fail('需至少8轮、排名第11或以后、队内信任低于35。');if(s.eventSeen.includes('E03'))return fail('本季已经调查过。');s.event=eventById(s,'E03');s.eventSeen.push('E03');}
    else if(type==='bribe'){if(!s.gray)return fail('本存档未开启灰色事件。');if(s.bribes>=2)return fail('本季灰色交易已达到2次上限。');const e=spendCheck(s,3);if(e)return fail(e);post(s,'expense',3,'虚构中间人服务费');s.bribes++;s.bribeBoost=random(s)<.4?.3:0;addRisk(s,30,'操纵比赛');news(s,'掮客说已经安排','是否有效尚不可知，付款记录倒是非常确定。','danger');}
    else return fail('未知行动。');s.actions--;return ok('管理行动已执行。'); }
  function addRisk(s,n,reason) { s.cases.push({id:'case'+s.nextId++,risk:n,reason});s.risk=clamp(sum(s.cases,c=>c.risk),0,100); }
  function promise(s,rounds,target) { s.promises.push({id:'pr'+s.nextId++,kind:'points',due:s.totalRounds+rounds,startPoints:team(s).pts,points:0,target,good:3,bad:5});s.statementCount++; }
  function checkPromises(s,points) { for(const p of s.promises){if(p.kind==='points')p.points+=points;}for(const p of s.promises.filter(p=>p.kind==='points'&&p.due<=s.totalRounds)){const good=p.points>=p.target;s.fans=clamp(s.fans+(good?p.good:-p.bad),0,100);if(!good)s.careerFailedPromises++;news(s,good?'承诺兑现':'历史发言已找到',good?`你在期限内拿到 ${p.points} 分。少了一份需要解释的材料。`:`承诺${p.target}分，实际${p.points}分。你的未来再次没有按时到来。`,'promise');}s.promises=s.promises.filter(p=>p.kind!=='points'||p.due>s.totalRounds);
    for(const cb of s.callback.filter(c=>c.at<=s.totalRounds)){if(cb.kind==='rebuild')news(s,'重建计划回访',rank(s)<cb.rank?(cb.option===0?'球队开始进步，咨询公司准备认领成果。':'董事会宣布，坦诚务实一直是他们的管理风格。'):(cb.option===0?'方案已经升级，排名保持向后兼容。':'至少这次没有付钱购买解释。'),'roast');if(cb.kind==='sign'){const p=player(s,cb.id);if(p&&p.club===s.playerClub&&p.injury<=0&&cb.fee>cb.old*1.3)news(s,'转会十轮回访',p.minutes<180?'你买他的时候说机会稍纵即逝。现在持续出现的机会，是发工资。':'球员开始发挥作用，卖方正在后悔报价太保守。','roast');}}s.callback=s.callback.filter(c=>c.at>s.totalRounds);
  }
  function next(s) {
    ensureOps(s);reconcileSeason(s);s.pauseReason='';if(s.ended)return fail('这段任期已经结束。');if(s.event)return fail('请先作出事件选择。');
    if(s.phase==='review')return startNextSeason(s);
    if(s.phase==='summer'||s.phase==='winter'){
      s.ops.turn++;s.windowStep++;generateOffers(s);const max=s.phase==='summer'?4:2;
      settleTo(s,s.phase==='summer'?Math.floor(s.windowStep/2):s.windowStep===2?7:6);
      if(s.ended)return ok('任期已结束。');if(s.windowStep>=max){s.phase='league';s.windowStep=0;s.offers=[];news(s,'转会窗口关闭','阵容名单已提交。接下来由比赛替报价单说话。','info');}triggerEvent(s);return ok('经营事务已送达。');
    }
    if(s.phase!=='league')return fail('当前阶段不可推进。');
    s.ops.turn++;recover(s,s.nextRest??7);s.nextRest=7;s.round++;s.totalRounds++;
    for(const [h,a] of s.fixtures[s.round-1]){const r=match(s,h,a,'联赛 第'+s.round+'轮');recordTable(s.clubs,h,r.hg,r.ag);recordTable(s.clubs,a,r.ag,r.hg);if(h===s.playerClub||a===s.playerClub){const gf=h===s.playerClub?r.hg:r.ag,ga=h===s.playerClub?r.ag:r.hg;checkPromises(s,gf>ga?3:gf===ga?1:0);}}
    playEurope(s);peopleWeek(s);
    const target=s.round<=19?2+Math.floor(s.round/19*4):7+Math.floor((s.round-19)/19*4);settleTo(s,target);
    if(s.ended)return ok('任期已结束。');
    if(s.round===19){s.phase='winter';s.windowStep=0;s.windowBudget=40;s.windowSpent=0;refreshMarket(s);refreshCoaches(s);s.pauseReason='冬季窗口已开放';news(s,'冬窗开启','没有凭空多出的8000万。财务部今天也保持清醒。','info');}
    else if(s.round===38){seasonReview(s);}
    if(s.round%4===0)s.actions=1;
    if(s.phase!=='review'&&!s.ended)triggerEvent(s);
    return ok('比赛已结算。');
  }
  function seasonReview(s) {
    if(s.history.some(h=>h.season===s.season)){reconcileSeason(s);return;}
    settleTo(s,12);if(s.ended)return;const r=rank(s),bonus=r===1?100:r<=4?70:r<=6?50:r<=10?30:r<=17?15:5;post(s,'income',bonus,'联赛第'+r+'名奖金');if(r===1){s.trophies.league++;s.board=clamp(s.board+10,0,100);s.fans=clamp(s.fans+10,0,100);}
    const pl=profit(s);s.lossHistory.push(pl);s.rankHistory.push(r);s.credit=clamp(s.credit+(pl>=0?3:-3),0,100);s.history.push({season:s.season,rank:r,points:team(s).pts,profit:pl,cash:s.cash,goals:team(s).gf,coach:s.coach.name,league:s.trophies.league,cl:s.trophies.cl,el:s.trophies.el});
    for(const p of s.promises.filter(x=>x.kind==='title'&&x.dueSeason===s.season)){const achieved=sum(Object.values(s.trophies))>p.start;s.fans=clamp(s.fans+(achieved?5:-8),0,100);if(!achieved)s.careerFailedPromises++;news(s,'复兴预售结算',achieved?'复兴终于发货。客服正在处理此前的退款申请。':'预售产品已成为历史文物，纪念的是购买时的乐观。','roast');}s.promises=s.promises.filter(x=>x.kind!=='title'||x.dueSeason>s.season);
    const prevProbation=s.probation;if(prevProbation&&pl<0){finish(s,'finance');if(s.ended)return;}s.probation=s.lossHistory.length>=4&&sum(s.lossHistory.slice(-4)) < -100;
    if(r>=18){finish(s,'relegated');if(s.ended)return;}if(s.rankHistory.length>=4&&s.rankHistory.slice(-4).every(r=>r>=6)){finish(s,'board');if(s.ended)return;}
    s.review={rank:r,bonus,profit:pl,income:s.finance.income,expense:s.finance.expense,amort:s.finance.amort,saleProfit:s.finance.saleProfit,table:standings(s).map(c=>({...c})),quote:r===1?'本季新闻终于可以配新照片了。':r<=s.target?'目标达成。董事会已经开始回忆自己如何支持你。':'这一年结束了。长期计划还没有。'};
    if(s.season>=20){finish(s,'complete');return;}s.phase='review';s.event=null;s.pauseReason='赛季总结';
  }
  function endingInfo(s){const reason=s.ended?.reason;if(!reason)return {valid:false,label:'阶段异常',detail:'没有有效的任期结束记录。'};const poor=s.rankHistory.length>=4&&s.rankHistory.slice(-4).every(r=>r>=6),map={complete:['任期上限',s.season>=20,'已完成20赛季任期。'],retire:['主动退休',true,'记录显示总监选择了主动退休。'],relegated:['球队降级',s.round===38&&rank(s)>=18,`赛季排名第${rank(s)}，进入降级区。`],board:['董事会解雇',poor||s.board<25,poor?'连续四季未进入前五。':`董事会信心${Math.round(s.board)}/100，低于25。`],finance:['财务整改失败',s.probation&&profit(s)<0,'整改赛季再次发生账面亏损。'],insolvent:['持续现金逾期',s.cash<0&&s.overdue>=2,`现金${s.cash.toFixed(1)}百万欧元，连续逾期${s.overdue}个月。`],scandal:['调查查实',!!s.investigation&&s.totalMonths>=s.investigation.due&&s.cases.length>0,s.cases.map(c=>c.reason).join('；')||'记录没有有效调查证据。']};const row=map[reason];return row?{reason,valid:!!row[1],label:row[0],detail:row[2]}:{reason,valid:false,label:'旧版归档记录异常',detail:'结束原因无法识别，将按完成赛季恢复。'};}
  function continueArchived(s){if(!s.ended||s.season>=20)return fail('当前没有可继续的归档任期。');const d=JSON.parse(JSON.stringify(s)),o=ensureOps(d);o.archives=o.archives||[];o.archives.push({season:d.season,round:d.round,reason:d.ended.reason,title:d.ended.title});o.freePlay=true;d.ended=null;d.event=null;d.phase=d.round===38?'review':'league';if(d.round===0)d.phase='summer';else if(d.round===19&&d.month<7){d.phase='winter';d.windowStep=0;d.windowBudget=40;d.windowSpent=0;refreshMarket(d);refreshCoaches(d);}d.investigation=null;d.boardWarning=false;news(d,'保留球队继续经营','已切换自由续玩：现金、合同、战绩保留，结束原因存入历史。解雇类条件以后只记录，不再终止；20年上限与主动退休仍有效。','board');if(d.round===38){if(!d.history.some(h=>h.season===d.season))seasonReview(d);reconcileSeason(d);const result=nextSeason(d);if(!result.ok)return result;}Object.assign(s,d);return ok('已保留原球队继续经营。');}
  function reconcileSeason(s) {
    if(s.round!==38)return;
    const h=s.history.find(h=>h.season===s.season);if(s.phase==='ended'&&!s.ended&&s.season<20&&standings(s).every(c=>c.played===38))s.phase='review';
    if(s.ended){if(s.season<20&&!endingInfo(s).valid&&standings(s).every(c=>c.played===38)){const old=s.ended;ensureOps(s).archiveRecovery={reason:old.reason,title:old.title};s.ended=null;s.phase='review';news(s,'异常归档已恢复','原归档原因与当前赛季记录不符，已恢复赛季交接，保留原资金和战绩。','info');}else return;}
    if(!['league','review'].includes(s.phase))return;
    if(!h){if(standings(s).every(c=>c.played===38))seasonReview(s);return;}
    if(!s.review)s.review={rank:h.rank,bonus:h.rank===1?100:h.rank<=4?70:h.rank<=6?50:h.rank<=10?30:h.rank<=17?15:5,profit:h.profit,...s.finance,table:standings(s).map(c=>({...c})),quote:'年度账目已归档。下一年的责任人，还是你。'};
    s.phase='review';s.event=null;
  }
  function startNextSeason(s) {
    const draft=JSON.parse(JSON.stringify(s));reconcileSeason(draft);if(draft.ended)return fail('这段任期已因明确规则结束，请查看归档原因或选择自由续玩。');
    if(draft.phase!=='review'||draft.round!==38||!draft.history.some(h=>h.season===draft.season))return fail('赛季尚未完成结算。');
    const result=nextSeason(draft);if(result.ok)Object.assign(s,draft);return result;
  }
  function nextSeason(s) {
    if(s.phase!=='review')return fail('赛季尚未结束。');const table=standings(s),qualification=table.slice(0,6).map(c=>c.id),r=rank(s);s.baseRevenue=clamp(s.baseRevenue*(r===1?1.05:r<=4?1.02:r<=10?1:.95),360,620);
    ensureOps(s);s.ops.seasonHandled=0;const people=peopleState(s);if(people.liaison)people.liaison.trained=0;people.recommendKey='';s.pauseReason='';s.season++;s.round=0;s.month=0;s.phase='summer';s.windowStep=0;s.windowBudget=120;s.windowSpent=0;s.finance={income:0,expense:0,amort:0,saleProfit:0};s.dismissals=0;s.eventSeen=[];s.bribes=0;s.invested=false;s.offers=[];s.actions=1;s.target=r<=4?4:s.rankHistory.length>=3&&s.rankHistory.slice(-3).every(x=>x>=6)?5:6;s.review=null;s.nextRest=7;s.locked=s.locked.filter(id=>squad(s).some(p=>p.id===id));
    post(s,'capital',s.probation?30:60,'新赛季股东注资');
    for(const p of s.players){if(p.loan&&p.loan.until<s.season){p.club=p.loan.origin;p.loan=null;}p.age++;let growth=p.age<=23?1:p.age<=27?0:p.age<=30?-1:p.age<=33?-2:-3;if(p.pos==='GK'&&p.age>=28)growth=p.age<=30?0:p.age<=33?-1:p.age<=36?-2:-3;if(p.age<=23)growth+=Math.min(2,Math.floor(p.minutes/900))+(p.club===s.playerClub&&s.coach.training>=80?1:0);p.ca=clamp(p.ca+clamp(growth+int(s,-1,1),-4,4),35,p.pa);p.retire=p.age>=(p.pos==='GK'?36:34)&&random(s)<Math.min(.9,.1+(p.age-(p.pos==='GK'?36:34))*.15);p.minutes=0;p.starts=0;p.eligible=0;p.fitness=100;p.injury=0;}
    const retired=s.players.filter(p=>p.retire);retired.filter(p=>p.club===s.playerClub).forEach(p=>{s.finance.expense+=p.book;news(s,'退役公告',`${p.name} 结束职业生涯，剩余账面价值 ${p.book.toFixed(1)}M计入减值。`,'contract');});s.players=s.players.filter(p=>!p.retire);
    for(const c of s.clubs){c.budget=Math.max(25,(c.rating-55)*4);if(c.id!==s.playerClub&&(!realWorld(s)||s.season>=6)){for(const [pos,n] of Object.entries({GK:2,DF:6,MF:6,FW:4})){const have=squad(s,c.id).filter(p=>p.pos===pos).length;for(let i=have;i<n;i++)s.players.push(newPlayer(s,c.id,pos,c.rating+int(s,-7,3),int(s,18,23)));}}}
    refreshAcademy(s);
    const relegated=(s.ops.freePlay?table.filter(c=>c.id!==s.playerClub):table).slice(-3);const names=realWorld(s)?s.clubs.filter(c=>!c.league&&c.competition?.startsWith('eng.')).map(c=>c.name):['南安普顿','沃特福德','诺维奇','米德尔斯堡','谢菲尔德联','西布朗','斯托克城','伯恩利','德比郡'];relegated.forEach((c,i)=>{c.league=false;const available=names.filter(n=>!s.clubs.some(c=>c.league&&c.name===n));const n=available[i%available.length]||`联赛升班马${s.season}-${i}`;let promoted=s.clubs.find(x=>x.name===n&&!x.league);if(promoted)promoted.league=true;else newClub(s,n,int(s,68,73),true);});
    // Keep the world bounded: unused expired free agents are replaced by fresh candidates.
    s.players=s.players.filter(p=>realWorld(s)&&p.realId||p.club!=='free'&&p.club!=='academy'||s.academy.includes(p.id));
    s.scoutLevel=0;s.youthLevel=0;s.locked=s.locked.filter(id=>squad(s).some(p=>p.id===id));resetLeague(s);buildEurope(s,qualification);refreshMarket(s);refreshCoaches(s);news(s,'重建计划续费成功',`${seasonYear(s)}/${String(seasonYear(s)+1).slice(-2)} 赛季。董事会目标：前${s.target}。新注资已到账，球探与青训年度投入需要重新选择。`,'board');return ok('新赛季已开启。');
  }
  function promote(s,id) { if(s.phase!=='summer'||!s.academy?.includes(id))return fail('请在夏窗从青训候选中选择。');if(s.promotedThisYear>=2||squad(s).length>=25)return fail('已达本年2人提拔上限或25人名单上限。');const p=player(s,id);p.club=s.playerClub;p.academy=true;p.months=48;s.promotedThisYear++;s.academy=s.academy.filter(x=>x!==id);return ok('青训球员已进入一线队。'); }
  function finish(s,reason) { if(s.ops?.freePlay&&!['retire','complete'].includes(reason)){news(s,'自由续玩 · 结束条件记录',`触发${({board:'董事会解雇',finance:'财务整改失败',insolvent:'现金逾期',scandal:'调查裁决',relegated:'降级'})[reason]||'任期终止'}条件，自由续玩保留球队，继续经营。`,'board');return;}s.event=null;s.phase='ended';const titles={scandal:s.illicitMoney>0?'个人复兴先于俱乐部完成':'调查程序取得阶段性成果',relegated:'英超席位优化完成',insolvent:'伟大复兴 暂不支持付款',board:'长期计划 短期负责人',finance:'财务总监终于不用再解释了',complete:'重建工程终身编制',retire:'提前退出责任认定'};let title=titles[reason]||titles.board;if(!['scandal','relegated'].includes(reason)){if(s.trophies.league>=3&&s.trophies.cl>=2)title='你让公关部门失业了';else if(squad(s).filter(p=>p.academy&&p.careerApps>=30).length>=5&&!s.loan)title='终于有几个人不是买来的';}s.ended={reason,title,season:s.season};s.ended.score=score(s); }
  function score(s) { const athletic=Math.min(50,s.trophies.league*6+s.trophies.cl*8+s.trophies.el*3),finance=Math.min(25,s.lossHistory.filter(x=>x>=0).length+(s.loan?0:5)),youth=Math.min(15,squad(s).filter(p=>p.academy&&p.careerApps>=30).length*3),ethics=s.ended?.reason==='scandal'||s.investigation?0:10;return {total:athletic+finance+youth+ethics,athletic,finance,youth,ethics}; }
  function retire(s) { if(s.ended)return fail('任期已经结束。');finish(s,'retire');return ok('任期已归档。'); }
  const EVENTS = [
    ['E01','打印机比边锋先完成续约','曼联又完成一笔关键续约。对方是打印机品牌，至少它的输出比较稳定。',s=>s.noWin>=3&&s.fans<50,[['承认人不如机器','支持+2；承诺8轮拿12分',{fans:2,promise:12}],['强调双方都有红色墨盒','商业收入100万；支持−3',{cash:1,fans:-3}]]],
    ['E02','经纪人说这是友情价','别人买的是球员，曼联买的是态度。态度另加三千万。',s=>s.windowSpent>35,[['追加一次复盘','支出50万；人脉+2',{cost:.5,network:2}],['贵有贵的新闻价值','支持−2；董事会+2',{fans:-2,board:2}]]],
    ['E03','更衣室到底谁在说话','我们排查了训练场和食堂。最明确的证据，仍然是你签过的合同。',()=>false,[['查到自己也继续查','信任+2；公布调查结果',{trust:2,investigate:true}],['开会直到没人敢说话','信任+3；案件没有新进展',{trust:3}],['先点名再找证据','误判导致信任−12、支持−5',{trust:-12,fans:-5}]]],
    ['E04','到底是谁保证了首发','球员带来了你亲笔签过的首发承诺。你第一次觉得自己的签名不够艺术。',s=>squad(s).some(p=>p.role==='主力'&&p.eligible>=8&&p.starts/p.eligible<.6),[['协调轮换','队内信任+3；董事会−2',{trust:3,board:-2}],['重新谈角色','支出100万；信任+4',{cost:1,trust:4}],['你要顾全大局','信任−6',{trust:-6}]]],
    ['E05','重建计划续费成功','董事会要求长期计划提交新版本。上一版的问题是过于长期，导致有人开始追问结果。',s=>s.history.length>=2&&s.history.slice(-2).every(x=>x.rank>6),[['换封面，再争取一届信任','咨询费200万；董事会+5，支持−4',{cost:2,board:5,fans:-4,rebuild:true}],['取消庆典，让球队训练','董事会−2；信任+4',{board:-2,trust:4,rebuild:true}],['承认前两年没有进展','董事会−3；支持+3',{board:-3,fans:3,rebuild:true}]]],
    ['E06','全球合作伙伴，本地没有后腰','赞助商要求三名主力到场。至于周末谁保护中场，他们建议寻找防守合作伙伴。',s=>s.cash<200,[['派主力，服务真正的客户','收入400万；3名主力体能−8；信任−2',{cash:4,trust:-2,fatigue:8}],['派替补，把主力留给足球','收入100万；3名替补体能−5',{cash:1,fatigue:5,reserve:true}],['拒绝活动','董事会−3',{board:-3}]]],
    ['E07','曼联DNA鉴定中心','虚构名宿：阵型可以学，DNA不能学。我的咨询费倒是可以按月付。',s=>s.dismissals>=2&&rank(s)>=7,[['聘为文化顾问','12个月合同，年费500万；董事会+5，信任−3',{adviser:12,board:5,trust:-3}],['公布计划，让结果说话','支持+3，董事会−3；8轮12分承诺',{fans:3,board:-3,promise:12}],['感谢建议，不安排岗位','无额外开支',{}]]],
    ['E08','历史最佳阵容，今日暂停出场','内容部门找到了破局办法：播放一场已经赢过的比赛。没有伤病，没有客场，甚至没有你。',s=>s.noWin>=4,[['推出限量纪念周边','收入200万；支持−4',{cash:2,fans:-4}],['召开球迷说明会','费用100万；支持+3，董事会−2',{cost:1,fans:3,board:-2}],['保存录像，继续准备比赛','没有数值变化',{}]]],
    ['E09','离任主帅感谢你的长期信任','离任主帅感谢你为其家庭提供的长期保障，并祝你尽快找到下一个短期方案。',s=>s.dismissals>=2,[['宣布这是双方共同决定','支持−2；董事会+2',{fans:-2,board:2}],['承认自己选人失误','支持+3；董事会−3',{fans:3,board:-3}],['公开指责球员','信任−6；董事会+3',{trust:-6,board:3}]]],
    ['E10','奖杯室空间优化项目','奖杯室终于具备扩建条件：原有空间基本未被新增物品占用。',s=>s.season>=4&&s.round>=32&&sum(Object.values(s.trophies))===0,[['出售复兴预售纪念品','收入300万；支持−5；承诺下季冠军',{cash:3,fans:-5,titlePromise:true}],['停止宣传复兴','支持−2；董事会−2',{fans:-2,board:-2}],['办青训开放日','费用100万；支持+2',{cost:1,fans:2}]]],
    ['E11','队长申请一个没有麦克风的会议','他想讨论足球。公关部问能不能先统一口径。',()=>true,[['关门谈足球','信任+4；董事会−1',{trust:4,board:-1}],['请公关部列席','董事会+2；信任−2',{board:2,trust:-2}]]],
    ['E12','青训毕业生想见一见草坪','他已经熟悉一线队的座椅，下一步希望熟悉比赛场地。',s=>squad(s).some(p=>p.age<=23),[['支持主帅给年轻人机会','信任+2；支付50万培养费用',{trust:2,cost:.5}],['经验比潜力重要','董事会+1；信任−2',{board:1,trust:-2}]]],
    ['E13','球票涨价建议已送达','商业部门把失利称为稀缺的沉浸式体验。球迷似乎有别的叫法。',()=>true,[['接受短期票价方案','收入200万；支持−5',{cash:2,fans:-5}],['维持价格','支持+3；董事会−2',{fans:3,board:-2}]]],
    ['E14','数据分析师请求购买一台显示器','现在大家轮流用手机看数据。好处是没那么容易看清问题。',()=>true,[['批准设备预算','费用50万；人脉+2，信任+2',{cost:.5,network:2,trust:2}],['先把字体调小','董事会+1；信任−2',{board:1,trust:-2}]]],
    ['E15','医疗室终于坐不下了','医生建议减少额外活动。商业部门建议扩大医疗室的冠名面积。',s=>squad(s).some(p=>p.injury>0),[['追加康复支持','费用100万；伤员恢复7天',{cost:1,heal:7}],['相信现有流程','支持−1',{fans:-1}]]],
    ['E16','你的续约清单已经可以装订','有球员的合同快到期了。财务部把自由转会称为资产轻量化。',s=>squad(s).some(p=>p.months<=12),[['和球员认真谈一次','信任+3',{trust:3}],['释放管理层的坚定态度','董事会+2；信任−3',{board:2,trust:-3}]]],
    ['E17','赞助商想成为官方复兴伙伴','如果复兴没有发生，他们希望保留退款解释权。',()=>true,[['接受额外拍摄','收入150万；3名主力体能−5',{cash:1.5,fatigue:5}],['把时间留给训练','信任+2；董事会−1',{trust:2,board:-1}]]],
    ['E18','球迷论坛举行了不信任投票','投票结果尚未公布，候选替代者已经排到了门外。',s=>s.fans<55,[['出席问答会','费用50万；支持+4，董事会−2',{cost:.5,fans:4,board:-2}],['发表一份无可奉告','董事会+2；支持−3',{board:2,fans:-3}]]],
    ['E19','更衣室收到了新的宣传口号','球员问它能不能防定位球。设计公司表示可以加钱做动效。',()=>true,[['让球员自己选口号','信任+3',{trust:3}],['尊重已付款的设计','董事会+2；信任−2',{board:2,trust:-2}]]],
    ['E20','客场球迷的最后一班车','球迷希望俱乐部补贴返程。你们已经让他们看完了比赛。',()=>true,[['补贴远征球迷','费用100万；支持+5',{cost:1,fans:5}],['请他们理解预算约束','董事会+1；支持−3',{board:1,fans:-3}]]],
    ['E21','财务总监找到了节省方案','少开一场没有结论的咨询会。听起来像是对俱乐部文化的攻击。',()=>true,[['削减非竞技会议','节省费用50万；董事会−2',{refund:.5,board:-2}],['要求再开会讨论','董事会+2；费用50万',{cost:.5,board:2}]]],
    ['E22','球队终于迎来了三连胜','董事会打算拍一段如何坚持正确路线的纪录片。素材里暂时没有你。',s=>s.wins.slice(-3).every(x=>x==='W')&&s.wins.length>=3,[['让成绩自己说话','支持+3；信任+2',{fans:3,trust:2}],['配合董事会的历史叙事','收入100万；董事会+4',{cash:1,board:4}]]],
    ['E23','一位经纪人主动请你吃饭','他说绝不谈转会。菜单上的每个名字都像一名边锋。',()=>true,[['由俱乐部公开接待','费用20万；人脉+3',{cost:.2,network:3}],['婉拒，按流程沟通','人脉+1',{network:1}]]],
    ['E24','年度工作总结要求缩短','董事会希望重点突出。你删除了所有形容词，剩下一张积分榜。',s=>s.round>=24,[['提交真实数据','支持+3；董事会−2',{fans:3,board:-2}],['保留所有宏大形容词','董事会+3；支持−3',{board:3,fans:-3}]]],
    ['G01','经纪人问你是否接受感谢','一笔虚构服务费可以进入你的私人账户。俱乐部的账本会记住它。',()=>false,[['拒绝，按合同办事','无额外风险',{}],['接受300万私人回扣','俱乐部−300万；私款+300万；风险+20',{cost:3,private:3,risk:20}]]],
    ['G02','掮客保证今天的风向','他说自己认识所有重要人物。付款之后，可能连你都不认识。',s=>s.gray&&s.noWin>=3,[['拒绝这项业务','无额外风险',{}],['接受灰色安排','费用300万；风险+30；40%下场机会加成',{cost:3,risk:30,boost:true}]]],
    ['G03','一张没有用途的咨询发票','对方保证这就是足球行业的文化。财务总监表示文化也需要凭证。',s=>s.gray,[['要求退回并说明','信用+2',{credit:2}],['签字，别耽误长期计划','费用200万；私人所得200万；风险+20',{cost:2,private:2,risk:20}]]],
    ['G04','内线消息也有会员套餐','虚构中间人声称情报来自违规渠道。他的报价比信息本身确定。',s=>s.gray,[['购买正常公开分析','费用100万；下场攻击+1',{cost:1,analysis:1}],['支付违规信息费','费用200万；风险+15；下场攻击+1',{cost:2,risk:15,analysis:1}]]],
    ['G05','董事会希望某份记录消失','这是架空故事中的越界要求。你可以拒绝为别人的体面背书。',s=>s.gray,[['保留记录，拒绝配合','董事会−3；信用+3',{board:-3,credit:3}],['替虚构主管担保','董事会+5；风险+25',{board:5,risk:25}]]],
    ['G06','举报信已经送到办公室','有人想把一项严重投诉解释成沟通方式不同。信封上没有公关部的签字位。',s=>s.gray,[['启动独立处理','费用100万；信任+4，信用+2',{cost:1,trust:4,credit:2}],['包庇已证实的违规','董事会+2；信任−8；风险+30',{board:2,trust:-8,risk:30}]]]
  ];
  EVENTS.push(...Operations.EVENTS);
  const commercialEffects={E06:[[-4,-2,2],null,[2,1,1]],E17:[[-3,-2,2],[2,1,2]]};
  for(const [id,effects] of Object.entries(commercialEffects)){const row=EVENTS.find(e=>e[0]===id);effects.forEach((e,i)=>{if(e)row[4][i][2].sporting={key:'training',label:e[0]<0?'商业拍摄挤占训练':'保留训练时间',attack:e[0],defense:e[1],matches:e[2],scope:'all'};});}

  function eventById(s,id) { const t=EVENTS.find(e=>e[0]===id);return t?{id:t[0],title:t[1],text:t[2],options:t[4].map((o,i)=>({label:o[0],detail:o[1],fx:{...o[2]},index:i})),at:s.totalRounds}:null; }
  function triggerEvent(s) {
    if(s.event||s.ended)return;const o=ensureOps(s);
    const due=o.queue.findIndex(q=>q.due<=o.turn);let chosen;
    let callback; if(due>=0){callback=o.queue[due];chosen=EVENTS.find(e=>e[0]===callback.id);o.queue.splice(due,1);}
    if(!chosen){
      const eligible=EVENTS.filter(e=>e[0].startsWith('O')&&!o.recent.includes(e[0])&&e[3](s)),fresh=eligible.filter(e=>!s.eventSeen.includes(e[0])),ops=fresh.length?fresh:eligible;
      const other=EVENTS.filter(e=>/^[EG]/.test(e[0])&&!s.eventSeen.includes(e[0])&&(!e[0].startsWith('G')||s.gray)&&e[3](s));
      const pool=o.turn%4!==0||!other.length?ops:other;chosen=pick(s,pool.length?pool:ops);
    }
    if(!chosen)return;s.event=eventById(s,chosen[0]);if(callback?.source)s.event.context={source:'经营回访',reason:`你此前在「${callback.source}」中选择了「${callback.choice}」。这份方案现在到了回访时间。`};
    if(chosen[0].startsWith('O'))o.recent=[...o.recent,chosen[0]].slice(-16);
    if(!s.eventSeen.includes(chosen[0]))s.eventSeen.push(chosen[0]);
  }
  function chooseEvent(s,index) {
    const ev=s.event,o=ev?.options[index];if(!o)return fail('事件选项无效。');const f=o.fx;if(f.boost&&s.bribes>=2)return fail('本季灰色交易已达到2次上限。');if(f.titlePromise&&s.season>=20)return fail('最后一季不能预售下一季的复兴。');const cost=f.cost||0,extra=f.adviser?5:0,e=spendCheck(s,cost,extra);if(cost||extra)if(e)return fail(e);
    if(f.refund)post(s,'expense',-f.refund,ev.title+' 费用节省');if(cost)post(s,'expense',cost,ev.title);if(f.cash)post(s,'income',f.cash,ev.title+' 额外收入');for(const k of ['board','trust','fans','network','credit'])if(f[k])s[k]=clamp(s[k]+f[k],0,100);
    const ops=ensureOps(s);ops.handled++;ops.seasonHandled++;
    for(const k of ['stadium','staff','brand'])if(f.ops?.[k])ops[k]=clamp(ops[k]+f.ops[k],0,100);
    if(f.sporting)ops.sporting=withSportingChoice(s,{sporting:f.sporting},ev.title,o.label).ops.sporting;
    for(const k of ['staff','stadium','fans'])if(k==='fans'?f.fans:f.ops?.[k])ops.sportSources[k]={title:ev.title,choice:o.label};
    if(f.contactMode&&ops.people.liaison)ops.people.liaison.mode=f.contactMode;
    if(f.flag)Object.assign(ops.flags,f.flag);
    if(f.follow)ops.queue.push({id:f.follow.id,due:ops.turn+f.follow.inTurns,source:ev.title,choice:o.label});
    if(f.contract){ops.contracts=ops.contracts.filter(c=>c.key!==f.contract.key);ops.contracts.push({...f.contract});}
    if(f.private){s.privateMoney+=f.private;s.illicitMoney+=f.private;}if(f.risk)addRisk(s,f.risk,ev.title);if(f.boost){s.bribes++;s.bribeBoost=random(s)<.4?.3:0;}if(f.analysis)s.analysis=f.analysis;
    if(f.fatigue){const all=squad(s).filter(p=>p.injury<=0).sort((a,b)=>f.reserve?a.ca-b.ca:b.ca-a.ca).slice(0,3);all.forEach(p=>p.fitness=clamp(p.fitness-f.fatigue,0,100));}
    if(f.heal)squad(s).forEach(p=>p.injury=Math.max(0,p.injury-f.heal));if(f.adviser)s.adviser=f.adviser;if(f.promise)promise(s,8,f.promise);
    if(f.rebuild){s.callback.push({kind:'rebuild',at:s.totalRounds+8,rank:rank(s),option:index});s.statementCount++;}
    if(f.titlePromise)s.promises.push({id:'pr'+s.nextId++,kind:'title',dueSeason:s.season+1,start:sum(Object.values(s.trophies))});
    if(f.investigate)news(s,'调查结果','调查排除了阴谋，现在只剩业务水平。情况更严重了。','roast');
    news(s,ev.title,`你选择了「${o.label}」。${o.detail}`,'decision');s.event=null;return ok('选择已记录，账本和后续事件已更新。');
  }
  function serializeSave(value){return JSON.stringify(value,(key,v)=>{if(key!=='players'||!Array.isArray(v)||!v.length)return v;const keys=[...new Set(v.flatMap(p=>Object.keys(p)))];return {format:'muga-player-table-v1',keys,rows:v.map(p=>keys.map(k=>Object.hasOwn(p,k)?p[k]:null))};});}
  function unpackPlayers(x){const packed=x?.players;if(!packed||Array.isArray(packed))return;if(packed.format!=='muga-player-table-v1'||!Array.isArray(packed.keys)||packed.keys.length>80||new Set(packed.keys).size!==packed.keys.length||packed.keys.some(k=>typeof k!=='string'||['__proto__','constructor','prototype'].includes(k))||!Array.isArray(packed.rows)||packed.rows.length>6000)throw Error('压缩球员存档格式无效');x.players=packed.rows.map(row=>{if(!Array.isArray(row)||row.length!==packed.keys.length)throw Error('球员记录不完整');return Object.fromEntries(packed.keys.flatMap((k,i)=>row[i]===null&&!['loan'].includes(k)?[]:[[k,row[i]]]));});}
  function validateSave(x) {
    unpackPlayers(x);const invalid=t=>{throw Error(t+'，无法读取。');}, numeric=(o,ks)=>{if(!o||ks.some(k=>!Number.isFinite(o[k])))invalid('存档数值缺失或无效');}, text=(v,max=120)=>typeof v==='string'&&v.length<=max;
    if(!x||typeof x!=='object'||x.version!==VERSION||!['fiction-2027-v1',REAL_VERSION].includes(x.dataVersion))invalid('存档版本不受支持');
    if(realWorld(x)&&(!Number.isInteger(x.startYear)||x.startYear!==2026||x.rosterAsOf!==Roster.asOf))invalid('真实名单版本');
    const baseline=createGame({seed:'validation',roster:'legacy'});
    for(const [key,v] of Object.entries(baseline)){
      if(typeof v==='number'&&!Number.isFinite(x[key]))invalid('存档数值 '+key);
      if(typeof v==='string'&&!text(x[key],200))invalid('存档文字 '+key);
      if(typeof v==='boolean'&&typeof x[key]!=='boolean')invalid('存档设置 '+key);
      if(Array.isArray(v)&&(!Array.isArray(x[key])||x[key].length>(key==='players'?6000:2000)))invalid('存档列表 '+key);
    }
    if(x.season<1||x.season>20||x.round<0||x.round>38||!Number.isInteger(x.season)||!Number.isInteger(x.round)||!['summer','winter','league','review','ended'].includes(x.phase))invalid('存档阶段');
    if(!['433','4231','442'].includes(x.formation)||!['均衡','主动进攻','稳守'].includes(x.tactic))invalid('战术');
    numeric(x.finance,['income','expense','amort','saleProfit']);numeric(x.coach,['ability','training','communication','wage','months','warmup']);numeric(x.trophies,['league','cl','el']);
    if(!text(x.coach.name)||!text(x.coach.style))invalid('主帅');
    const ids=new Set();for(const c of x.clubs){if(!c||!text(c.id)||ids.has(c.id)||!text(c.name)||typeof c.league!=='boolean')invalid('俱乐部');ids.add(c.id);numeric(c,['rating','budget','coach','played','w','d','l','gf','ga','pts']);}
    const league=x.clubs.filter(c=>c.league).map(c=>c.id);if(league.length!==20||!league.includes(x.playerClub))invalid('联赛俱乐部');
    const pids=new Set();for(const p of x.players){if(!p||pids.has(p.id)||!text(p.id)||!text(p.name,80)||!POS[p.pos])invalid('球员');pids.add(p.id);numeric(p,['ca','pa','age','months','wage','book','fitness','morale','satisfaction','injury','minutes','starts','eligible','careerApps']);if(p.ca<30||p.ca>99||p.wage<0||p.book<0||p.months<0||(!ids.has(p.club)&&!['free','academy'].includes(p.club)))invalid('球员属性');if(p.loan){numeric(p.loan,['share','until']);if(!ids.has(p.loan.origin))invalid('租借俱乐部');}}
    const pairs=new Set();if(x.fixtures.length!==38)invalid('赛程');for(const round of x.fixtures){if(!Array.isArray(round)||round.length!==10)invalid('赛程轮次');const played=new Set();for(const g of round){if(!Array.isArray(g)||g.length!==2||g[0]===g[1]||g.some(id=>!league.includes(id)||played.has(id))||pairs.has(g.join('/')))invalid('赛程引用');g.forEach(id=>played.add(id));pairs.add(g.join('/'));}}
    if(!x.marketData||typeof x.marketData!=='object')invalid('转会数据');for(const id of [...x.market,...x.freeMarket]){if(!pids.has(id))invalid('转会球员');numeric(x.marketData[id],['ask','wage','error','attempts','lastBid']);}
    for(const n of x.news)if(!n||!text(n.title)||!text(n.text,1000))invalid('新闻记录');
    for(const r of x.reports){numeric(r,['hg','ag','hx','ax','round','season']);if(!text(r.label)||!text(r.home)||!text(r.away)||!Array.isArray(r.reason)||!Array.isArray(r.injuries))invalid('战报');}
    for(const h of x.history)numeric(h,['season','rank','points','profit','cash','goals','league','cl','el']);
    for(const l of x.ledger){numeric(l,['amount','season','month']);if(!text(l.note)||!text(l.kind))invalid('财务流水');}
    if(x.europe.length!==2)invalid('欧战');for(const e of x.europe){if(!e||!['cl','el'].includes(e.key)||!text(e.name)||!text(e.stage)||!Array.isArray(e.ids)||e.ids.length!==32||new Set(e.ids).size!==32||e.ids.some(id=>!ids.has(id))||!Array.isArray(e.groups)||e.groups.length!==8||!Array.isArray(e.alive)||e.alive.some(id=>!ids.has(id)))invalid('欧战参赛');for(const g of e.groups){if(!Array.isArray(g)||g.length!==4)invalid('欧战分组');for(const r of g){numeric(r,['pts','played','gf','ga','w','d','l']);if(!ids.has(r.id))invalid('欧战积分');}}}
    for(const o of x.offers){numeric(o,['fee']);if(!pids.has(o.player)||!ids.has(o.buyer))invalid('出售报价');}
    for(const c of x.coachMarket){numeric(c,['ability','training','communication','wage','months','warmup']);if(!text(c.name)||!text(c.style))invalid('候选主帅');}
    if(x.loan)numeric(x.loan,['principal','remaining','rate']);if(x.investigation)numeric(x.investigation,['due']);
    reconcileSeason(x);
    if(x.phase==='review'&&!x.review||x.phase==='ended'&&!x.ended)invalid('赛季结算');if(x.review){numeric(x.review,['rank','bonus','profit','income','expense','amort','saleProfit']);if(!text(x.review.quote))invalid('赛季总结');}if(x.ended&&(!text(x.ended.reason)||!text(x.ended.title)))invalid('任期结局');
    if(x.academy&&(!Array.isArray(x.academy)||x.academy.some(id=>!pids.has(id))))invalid('青训');
    if(x.event){const template=eventById(x,x.event.id);if(!template||!x.gray&&template.id.startsWith('G'))invalid('待办事件');const context=x.event.context;if(context&&text(context.source,120)&&text(context.reason,500))template.context={source:context.source,reason:context.reason};x.event=template;}
    if(x.inboxReadIds&&!Array.isArray(x.inboxReadIds))x.inboxReadIds=[];
    if(x.lastDecision){const d=x.lastDecision;if(!text(d.title)||!text(d.label)||!Array.isArray(d.immediate)||!Array.isArray(d.later)||d.immediate.some(i=>!text(i.label)||!Number.isFinite(i.before)||!Number.isFinite(i.after))||d.later.some(t=>!text(t,500)))x.lastDecision=null;}
    if(x.lastDecision?.sporting){const p=x.lastDecision.sporting,validImpact=b=>b&&Number.isFinite(b.attack)&&Number.isFinite(b.defense);if(!p.home||!p.away||!validImpact(p.home.before)||!validImpact(p.home.after)||!validImpact(p.away.before)||!validImpact(p.away.after)||p.effect&&(!text(p.effect.label)||!Number.isFinite(p.effect.attack)||!Number.isFinite(p.effect.defense)||!Number.isInteger(p.effect.matches)||!['all','home','away'].includes(p.effect.scope)))delete x.lastDecision.sporting;}
    const o=ensureOps(x);numeric(o,['stadium','staff','brand','turn','handled','seasonHandled']);
    if(['stadium','staff','brand'].some(k=>o[k]<0||o[k]>100)||!Number.isInteger(o.turn)||o.turn<0||!o.flags||typeof o.flags!=='object'||Array.isArray(o.flags))invalid('经营数据');
    for(const k of ['queue','contracts','recent'])if(!Array.isArray(o[k])||o[k].length>100)invalid('经营记录');
    for(const q of o.queue){if(!q||!Operations.meta[q.id]?.followup||!Number.isInteger(q.due)||q.due<0||q.source!==undefined&&!text(q.source)||q.choice!==undefined&&!text(q.choice))invalid('经营回访');}
    for(const c of o.contracts){numeric(c,['income','expense','remaining']);if(!text(c.key)||!text(c.name)||c.income<0||c.expense<0||c.remaining<1||c.remaining>12||!Number.isInteger(c.remaining))invalid('经营合同');}
    if(!Array.isArray(o.sporting)||o.sporting.length>20||!o.sportSources||typeof o.sportSources!=='object'||Array.isArray(o.sportSources))invalid('备战状态');
    const keys=new Set();for(const e of o.sporting){numeric(e,['attack','defense','remaining']);if(!text(e.key)||keys.has(e.key)||!text(e.label)||!text(e.source)||!text(e.choice)||!['all','home','away'].includes(e.scope)||Math.abs(e.attack)>8||Math.abs(e.defense)>8||!Number.isInteger(e.remaining)||e.remaining<1||e.remaining>10)invalid('备战影响');keys.add(e.key);}
    for(const v of Object.values(o.sportSources))if(!v||!text(v.title)||!text(v.choice))invalid('经营来源');
    for(const r of x.reports)if(r.sporting){const b=r.sporting;numeric(b,['attack','defense','ourBefore','ourAfter','theirBefore','theirAfter']);if(!['home','away','neutral'].includes(b.venue)||!Array.isArray(b.rows)||b.rows.length>25)invalid('经营战报');for(const row of b.rows){numeric(row,['attack','defense','remaining']);if(!text(row.label)||!text(row.source,300)||!text(row.detail,300))invalid('经营战报来源');}}
    const people=peopleState(x);numeric(people,['appointedSeason','lastActionTurn','intelSeason','intelUsed']);numeric(people.relations,['scout','agent','analyst']);if(Object.values(people.relations).some(n=>n<0||n>100)||!Number.isInteger(people.lastActionTurn)||people.intelUsed<0||people.intelUsed>4)invalid('联系人进度');
    if(!text(people.recommendKey,500)||!Array.isArray(people.projects)||people.projects.length>2||!Array.isArray(people.completed)||people.completed.length>24||!Array.isArray(people.reports)||people.reports.length>12)invalid('总监行动记录');
    if(people.liaison){const l=people.liaison;numeric(l,['rapport','trained']);if(!text(l.playerId)||!text(l.name)||!['open','covert'].includes(l.mode)||l.rapport<0||l.rapport>100||l.trained<0||l.trained>2)invalid('球员联络人');}
    for(const plan of [...people.projects,...people.completed]){numeric(plan,['progress','target','startApps','season']);if(!text(plan.playerId)||!text(plan.name)||plan.progress<0||plan.target!==8)invalid('球员培养');}
    for(const report of people.reports){if(!text(report.from)||!text(report.summary,500)||!Array.isArray(report.details)||report.details.some(t=>!text(t,500)))invalid('联络报告');}
    return x;
  }
  const guarded=fn=>(s,...args)=>s.ended?fail('这段任期已经结束。'):fn(s,...args);

  return {VERSION,POS,realWorld,identityOf,serializeSave,seasonYear,createGame,startNextSeason,continueArchived,endingInfo,liaisonReport,appointLiaison,trainLiaison,contactPerson,requestContact,startDevelopment,operatingImpact,sportingImpact,sportingPreview,nextVenue,random,hash,clamp,round,sum,club,team,player,squad,star,value,rank,standings,schedule,lineup,strength,annualExpense,safeCash,profit,visibleAbility,scout,offerTransfer,signPlayer,loanPlayer,listPlayer,sellPlayer,renew,hireCoach,setTactics,lockPlayer,takeLoan,repayLoan,invest,management,next,chooseEvent,retire,promote,score,validateSave,eventById,EVENTS,news,post,finish,...Object.fromEntries(Object.entries({scout,offerTransfer,signPlayer,loanPlayer,listPlayer,sellPlayer,renew,hireCoach,setTactics,lockPlayer,takeLoan,repayLoan,invest,management,promote,chooseEvent}).map(([name,fn])=>[name,guarded(fn)]))};
});
