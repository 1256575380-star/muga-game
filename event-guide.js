/* Plain-language explanations; does not draw random numbers or alter game state. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));else root.MUGAEventGuide=factory(root.MUGA);})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  const descriptions={
    E01:['连战不胜让球迷失去耐心，你需要回应赞助续约被嘲讽的新闻。',s=>`球队已连续 ${s.noWin} 场未胜，球迷支持 ${Math.round(s.fans)}/100，低于50。`],
    E02:['一笔大额转会引发质疑，决定是否花钱复盘。',s=>`本窗已支出 ${s.windowSpent.toFixed(1)} 百万欧元，超过35百万。`],
    E03:['你主动调查了更衣室泄密，需要决定调查方式。',s=>`你使用了“调查泄密”行动；联赛第 ${s.round} 轮，排名第 ${E.rank(s)}，更衣室信任 ${Math.round(s.trust)}/100。`],
    E04:['承诺为主力的球员没有获得足够首发，需要处理不满。',s=>{const p=E.squad(s).find(p=>p.role==='主力'&&p.eligible>=8&&p.starts/p.eligible<.6);return p?`${p.name} 被承诺为主力，符合出场条件 ${p.eligible} 场，仅首发 ${p.starts} 场，比例低于60%。`:'主力角色与实际出场安排发生了冲突。';}],
    E05:['连续两个赛季未达预期，董事会要求解释重建进展。',()=> '最近两个赛季都排在第7名或以后。'],
    E06:['赞助商安排商业活动。你要在收入和球员体能之间取舍。',s=>`当前现金 ${s.cash.toFixed(1)} 百万欧元，低于200百万，商业活动进入了本次候选事件。`],
    E07:['换帅效果不佳，一位名宿提议担任有偿文化顾问。',s=>`本季已换帅 ${s.dismissals} 次，当前排名第 ${E.rank(s)}。`],
    E08:['连战不胜后，内容部门提议用历史成绩安抚球迷。',s=>`球队已连续 ${s.noWin} 场未胜，至少达到4场。`],
    E09:['多次换帅后，需要对外说明离任主帅的情况。',s=>`本季已换帅 ${s.dismissals} 次，至少达到2次。`],
    E10:['多年无冠，商业部门仍想提前出售夺冠纪念品。',s=>`任期第 ${s.season} 年、联赛第 ${s.round} 轮，至今没有新增冠军。`],
    E11:['队长希望进行一次内部沟通，你决定谁可以参加。',()=> '这是日常更衣室事务，由本次例会随机抽中，不代表发生了额外失败。'],
    E12:['年轻球员希望获得培养机会，需要你的支持。',()=> '一线队存在23岁或以下球员，青训培养事务进入本次候选事件。'],
    E13:['商业部门提议涨价，增加收入会降低球迷支持。',()=> '这是日常票务议题，由本次例会随机抽中。'],
    E14:['分析团队申请设备经费，你需要审批。',()=> '这是日常设备申请，由本次例会随机抽中。'],
    E15:['球队存在伤员，医疗团队申请额外康复经费。',s=>`当前有 ${E.squad(s).filter(p=>p.injury>0).length} 名伤员，额外投入可缩短恢复时间。`],
    E16:['部分球员合同即将到期，选择沟通态度。续约仍需单独操作。',()=> '至少一名一线队球员剩余合同不超过12个月。'],
    E17:['赞助商要求额外拍摄，收入会占用主力球员的体能。',()=> '这是日常商业合作请求，由本次例会随机抽中。'],
    E18:['球迷对管理层不满，你需要选择回应方式。',s=>`球迷支持 ${Math.round(s.fans)}/100，低于55。`],
    E19:['球队收到新口号，你决定是否让球员参与选择。',()=> '这是日常球队文化事务，由本次例会随机抽中。'],
    E20:['远征球迷希望获得交通补贴，你决定是否承担费用。',()=> '这是日常球迷关系事务，由本次例会随机抽中。'],
    E21:['财务团队提议减少咨询会议，节约非竞技费用。',()=> '这是日常预算审核，由本次例会随机抽中。'],
    E22:['三连胜后，董事会希望拍摄宣传纪录片。',()=> '球队最近三场比赛全部获胜（含欧战）。'],
    E23:['经纪人发来会面邀请，规范接待可以拓展人脉。',()=> '这是日常转会人脉事务，由本次例会随机抽中。'],
    E24:['赛季进入后半程，董事会要求你汇报工作。',s=>`已完成联赛第 ${s.round} 轮，达到第24轮后的总结阶段。`],
    G01:['大额签约后，经纪人提出向你个人支付违规回扣。',()=> '已开启灰色事件，并刚完成转会费至少30百万欧元的签约。'],
    G02:['连战不胜时，虚构掮客提出违规安排。拒绝也可以正常继续。',s=>`已开启灰色事件；球队连续 ${s.noWin} 场未胜，至少达到3场。`],
    G03:['你收到一张虚构咨询发票，签字会给个人带来收入和违规记录。',()=> '已开启灰色事件，本次例会抽中了咨询发票议题。'],
    G04:['有人出售违规来源的信息，你也可以购买正常的公开分析。',()=> '已开启灰色事件，本次例会抽中了情报交易议题。'],
    G05:['一位虚构董事要求你隐瞒记录，你可以拒绝。',()=> '已开启灰色事件，本次例会抽中了董事会越界要求。'],
    G06:['俱乐部收到严重投诉，你需要决定是否独立处理。',()=> '已开启灰色事件，本次例会抽中了举报处理议题。']
  };
  function info(s,event=s.event){if(!event)return null;const meta=typeof module==='object'&&module.exports?require('./operations.js').meta:globalThis.MUGAOperations.meta;const m=meta[event.id];if(m)return {summary:m.summary,reason:event.context?.reason||m.reason,source:(m.followup?'经营回访':'本周经营事务')+' · '+m.department};const d=descriptions[event.id];return {summary:d?.[0]||'有一项俱乐部事务需要你决定。',reason:event.context?.reason||d?.[1](s)||'符合当前经营状况的事件被抽中。',source:event.context?.source||(event.id==='G01'?'签约后即时事件':event.id==='E03'?'主动管理行动':`第 ${s.round} 轮办公室例会`)};}
  function effects(s,option){const f=option.fx,immediate=[],later=[],amount=n=>`${Number((Math.abs(n)*100).toFixed(2))}万欧元`,change=(label,before,after,money=false)=>({label,before,after,money});const net=(f.cash||0)+(f.refund||0)-(f.cost||0);if(net)immediate.push(change('俱乐部现金',s.cash,E.round(s.cash+net),true));for(const [k,label] of Object.entries({board:'董事会信心',trust:'更衣室信任',fans:'球迷支持',network:'人脉',credit:'信用'}))if(f[k])immediate.push(change(label,s[k],E.clamp(s[k]+f[k],0,100)));
    for(const [k,label] of Object.entries({stadium:'设施可靠度',staff:'员工士气',brand:'商业信誉'}))if(f.ops?.[k])immediate.push(change(label,s.ops[k],E.clamp(s.ops[k]+f.ops[k],0,100)));
    if(f.follow)later.push(`再推进${f.follow.inTurns}周后进入回访队列，届时需要再次作决定；跨赛季仍会保留。`);
    if(f.contract)later.push(`${f.contract.name}：从下次月结起，连续${f.contract.remaining}个月，每月${f.contract.income?'收入'+amount(f.contract.income):'支出'+amount(f.contract.expense)}。同类合同替换旧合同。`);
    if(f.ops)later.push('设施与商业信誉影响每月经营收入；员工士气影响每月费用。');
    if(f.private)immediate.push(change('个人账户',s.privateMoney,s.privateMoney+f.private,true));if(f.risk){immediate.push(change('违规风险',s.risk,E.clamp(s.risk+f.risk,0,100)));later.push('新增违规记录会保留，可能触发调查；查实后任期结束。');}
    if(f.fatigue){const ps=E.squad(s).filter(p=>p.injury<=0).sort((a,b)=>f.reserve?a.ca-b.ca:b.ca-a.ca).slice(0,3);for(const p of ps)immediate.push(change(`${p.name} · 体能`,p.fitness,E.clamp(p.fitness-f.fatigue,0,100)));}
    if(f.heal)for(const p of E.squad(s).filter(p=>p.injury>0))immediate.push(change(`${p.name} · 伤停天数`,p.injury,Math.max(0,p.injury-f.heal)));
    if(f.promise)later.push(`未来8轮联赛必须拿到${f.promise}分；达标球迷支持+3，未达标−5。`);
    if(f.titlePromise)later.push('下赛季结束前赢得一项冠军；达标球迷支持+5，未达标−8。');
    if(f.adviser)later.push(`顾问合同12个月，每月支出约${amount(5/12)}（年费500万欧元）。`);
    if(f.boost)later.push('下场比赛：40%概率使预期进球+0.3，60%无加成；费用与风险一定生效。');
    if(f.analysis)later.push('下一场比赛攻击+1，比赛后清除；不保证获胜。');
    if(f.rebuild)later.push('8轮联赛后回访重建进展，收件箱将收到结果。');
    if(f.investigate)later.push('调查结论将写入收件箱。');
    let unavailable='';if(f.boost&&s.bribes>=2)unavailable='本季灰色交易已达2次上限';else if(f.titlePromise&&s.season>=20)unavailable='最后一季不能承诺下一季冠军';else if((f.cost||f.adviser)&&!E.safeCash(s,f.cost||0,f.adviser?5:0).safe)unavailable='支付后低于现金安全线';
    const sporting=E.sportingPreview(s,option);return {immediate,later,unavailable,sporting};
  }
  function cadence(s){if(s.ended)return '任期已结束，不再触发新事务。';if(s.phase==='review')return '本季已结算，点击“进入下一赛季”继续任期。';if(s.phase==='league'&&s.round===37)return '下一周完成第38轮后进入赛季交接。';const due=s.ops?.queue.filter(q=>q.due<=(s.ops.turn+1)).length||0;return due?'下一周有经营回访到期，优先送达；其余回访依次排队。':'每推进一周必有1项事务；经营议题优先，比赛同步自动结算。';}
  function sportLink(option){const f=option.fx,e=f.sporting,parts=[],signed=n=>(n>0?'+':'')+n;if(e)parts.push(`${e.label}：攻击${signed(e.attack)} / 防守${signed(e.defense)}，接下来${e.matches}场${e.scope==='home'?'主场':e.scope==='away'?'客场':'正式比赛'}`);if(f.ops?.staff)parts.push('员工士气 → 后勤与训练支持（主客场）');if(f.ops?.stadium)parts.push('设施 → 主场保障');if(f.fans)parts.push('球迷支持 → 主场助威');if(f.trust)parts.push('更衣室信任 → 球队配合');if(!parts.length)parts.push(f.heal?'康复投入 → 伤员更早回归':f.fatigue?'活动安排 → 参加球员的即时体能':'本项主要影响经营账目与可用预算');return parts.join('；');}
  return {info,effects,cadence,sportLink};
});
