// RepMax Tracker — Live Preview (sample data seeded)
// For the full deployable app, use index.html

import { useState, useMemo, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Flame, Star, Home, Plus, Minus, Zap, Award, TrendingUp, Settings, BarChart2, RotateCcw, ArrowUp, Activity, Dumbbell, Lock, Trophy, CheckCircle } from "lucide-react";

const C = {
  bg:"#0A0F1E",surf:"#0F1929",surf2:"#162035",surf3:"#1A2640",
  border:"#1E3050",green:"#22C55E",orange:"#F97316",purple:"#A855F7",
  blue:"#3B82F6",text:"#F1F5F9",muted:"#64748B",gold:"#EAB308",danger:"#EF4444",
};

const EXES = [
  { id:"pushups",label:"Push Ups",short:"PU",color:C.green, g:["#16A34A","#22C55E"],Icon:Dumbbell },
  { id:"pullups",label:"Pull Ups",short:"PL",color:C.purple,g:["#7C3AED","#A855F7"],Icon:ArrowUp  },
  { id:"situps", label:"Sit Ups", short:"SU",color:C.blue,  g:["#1D4ED8","#3B82F6"],Icon:RotateCcw},
  { id:"squats", label:"Squats",  short:"SQ",color:C.orange,g:["#C2410C","#F97316"],Icon:Activity },
];

const ACHS = [
  {id:"a1",label:"First Step",  desc:"Log your first session",       Icon:Star,     xp:100, check:(l,s)=>l.length>=1},
  {id:"a2",label:"On Fire",     desc:"Achieve a 3-day streak",       Icon:Flame,    xp:150, check:(l,s)=>s>=3},
  {id:"a3",label:"Week Warrior",desc:"Achieve a 7-day streak",       Icon:Flame,    xp:300, check:(l,s)=>s>=7},
  {id:"a4",label:"Consistent",  desc:"Log 10 total sessions",        Icon:TrendingUp,xp:200,check:(l,s)=>l.length>=10},
  {id:"a5",label:"Half Century",desc:"50 push-ups in one session",   Icon:Dumbbell, xp:200, check:(l,s)=>l.some(x=>x.pushups>=50)},
  {id:"a6",label:"Iron Arms",   desc:"20 pull-ups in one session",   Icon:Award,    xp:250, check:(l,s)=>l.some(x=>x.pullups>=20)},
  {id:"a7",label:"Core King",   desc:"100 sit-ups in one session",   Icon:Zap,      xp:300, check:(l,s)=>l.some(x=>x.situps>=100)},
  {id:"a8",label:"Leg Legend",  desc:"100 squats in one session",    Icon:Activity, xp:300, check:(l,s)=>l.some(x=>x.squats>=100)},
  {id:"a9",label:"Century Club",desc:"100 push-ups in one session",  Icon:Trophy,   xp:500, check:(l,s)=>l.some(x=>x.pushups>=100)},
  {id:"a10",label:"Monthly Hero",desc:"30-day streak",               Icon:Trophy,   xp:1000,check:(l,s)=>s>=30},
  {id:"a11",label:"Dedicated",  desc:"Log 30 total sessions",        Icon:Award,    xp:500, check:(l,s)=>l.length>=30},
  {id:"a12",label:"Legend",     desc:"Log 100 sessions",             Icon:Star,     xp:1000,check:(l,s)=>l.length>=100},
];

function genLogs() {
  const logs=[], skip=new Set([7,14,18]);
  for(let i=22;i>=1;i--){
    if(skip.has(i)) continue;
    const d=new Date(); d.setDate(d.getDate()-i);
    const p=(22-i)/22;
    logs.push({
      date:d.toISOString().split("T")[0],
      pushups:Math.max(12,Math.round(18+p*25+(Math.random()-.5)*5)),
      pullups:Math.max(3, Math.round(5 +p*10+(Math.random()-.5)*2)),
      situps: Math.max(18,Math.round(22+p*32+(Math.random()-.5)*7)),
      squats: Math.max(22,Math.round(28+p*42+(Math.random()-.5)*9)),
      xp:100+Math.floor(Math.random()*75),
    });
  }
  return logs;
}

const todayStr=()=>new Date().toISOString().split("T")[0];
const fmtDate=ds=>new Date(ds+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});

function calcStreak(logs){
  const dates=new Set(logs.map(l=>l.date));
  const today=todayStr();
  let streak=0;
  const d=new Date();
  if(!dates.has(today)) d.setDate(d.getDate()-1);
  for(let i=0;i<400;i++){
    const ds=d.toISOString().split("T")[0];
    if(dates.has(ds)){streak++;d.setDate(d.getDate()-1);}
    else break;
  }
  return streak;
}
const XP_T=[0,500,1200,2000,3000,4500,6500,9000,12000,16000,21000];
function calcLevel(totalXP){
  let xp=totalXP,level=1;
  while(level<XP_T.length-1&&xp>=XP_T[level]){xp-=XP_T[level];level++;}
  return{level,xpInLevel:xp,xpNeeded:XP_T[Math.min(level,XP_T.length-1)]||25000};
}
function calcTotalXP(logs){return 500+logs.reduce((s,l)=>s+(l.xp||100),0);}
function calcPRs(logs){
  return EXES.reduce((a,ex)=>{a[ex.id]=logs.length?Math.max(0,...logs.map(l=>l[ex.id]||0)):0;return a;},{});
}

function Toast({msg,type}){
  if(!msg) return null;
  const bg=type==="success"?C.green:C.danger;
  return <div style={{position:"absolute",top:62,left:12,right:12,zIndex:200,background:bg,borderRadius:14,padding:"13px 16px",color:"#fff",fontWeight:700,fontSize:14,textAlign:"center",boxShadow:`0 6px 28px ${bg}55`,animation:"slideDown 0.3s ease"}}>{msg}</div>;
}

function HomePage({logs,streak,level,xpInLevel,xpNeeded,totalXP,prs,todayLogged,setPage,unlockedIds}){
  const xpPct=Math.min(100,(xpInLevel/xpNeeded)*100);
  const last7=useMemo(()=>{
    const today=new Date();
    return Array.from({length:7},(_,i)=>{
      const d=new Date(today);d.setDate(d.getDate()-(6-i));
      const ds=d.toISOString().split("T")[0];
      return{day:d.toLocaleDateString("en-US",{weekday:"short"}).slice(0,1),done:!!logs.find(l=>l.date===ds)};
    });
  },[logs]);
  const recentAch=ACHS.filter(a=>unlockedIds.has(a.id)).slice(-3).reverse();
  return(
    <div style={{padding:"0 14px 110px",display:"flex",flexDirection:"column",gap:13}}>
      <div style={{display:"flex",gap:10}}>
        <div style={{flex:1,background:C.surf,borderRadius:16,padding:"14px 16px",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:44,height:44,borderRadius:12,background:`${C.orange}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Flame size={22} color={streak>0?C.orange:C.muted}/>
          </div>
          <div>
            <div style={{fontSize:28,fontWeight:900,color:streak>0?C.orange:C.muted,lineHeight:1}}>{streak}</div>
            <div style={{fontSize:11,color:C.muted,fontWeight:600}}>day streak</div>
          </div>
        </div>
        <div style={{flex:1,background:C.surf,borderRadius:16,padding:"14px 16px",border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",justifyContent:"center",gap:7}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",gap:5,alignItems:"center"}}><Zap size={13} color={C.gold}/><span style={{fontSize:11,color:C.muted,fontWeight:700}}>Level {level}</span></div>
            <span style={{fontSize:11,color:C.gold,fontWeight:700}}>{xpInLevel}/{xpNeeded}</span>
          </div>
          <div style={{height:6,borderRadius:99,background:C.border}}>
            <div style={{height:6,borderRadius:99,width:`${xpPct}%`,background:`linear-gradient(90deg,${C.gold},${C.orange})`,transition:"width 0.6s"}}/>
          </div>
        </div>
      </div>

      <div style={{background:C.surf,borderRadius:16,padding:"14px 16px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:.8,marginBottom:12}}>THIS WEEK</div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {last7.map((d,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <div style={{width:34,height:34,borderRadius:10,background:d.done?`${C.green}22`:C.surf2,border:`2px solid ${d.done?C.green:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                {d.done&&<CheckCircle size={15} color={C.green}/>}
              </div>
              <span style={{fontSize:10,color:d.done?C.green:C.muted,fontWeight:700}}>{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {!todayLogged?(
        <button onClick={()=>setPage("log")} style={{border:"none",cursor:"pointer",background:`linear-gradient(135deg,#16A34A,#22C55E)`,borderRadius:18,padding:"20px 22px",textAlign:"left",boxShadow:`0 10px 36px ${C.green}44`}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",fontWeight:700,letterSpacing:.8,marginBottom:4}}>TODAY'S CHALLENGE</div>
          <div style={{fontSize:20,color:"#fff",fontWeight:900}}>Log your max reps</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",marginTop:4}}>Beat your PRs to earn bonus XP</div>
          <div style={{marginTop:14,background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"10px 14px",display:"flex",justifyContent:"space-between"}}>
            {EXES.map(ex=>(
              <div key={ex.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <ex.Icon size={15} color="#fff"/>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.75)",fontWeight:600}}>{ex.short}</span>
                <span style={{fontSize:12,color:"#fff",fontWeight:900}}>{prs[ex.id]}</span>
              </div>
            ))}
          </div>
        </button>
      ):(
        <div style={{background:C.surf,borderRadius:16,padding:"16px 18px",border:`2px solid ${C.green}44`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:`${C.green}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <CheckCircle size={22} color={C.green}/>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:C.text}}>Workout logged!</div>
            <div style={{fontSize:12,color:C.muted}}>Come back tomorrow to extend your streak</div>
          </div>
        </div>
      )}

      <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:.8}}>PERSONAL RECORDS</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {EXES.map(ex=>(
          <div key={ex.id} style={{background:C.surf,borderRadius:16,padding:"14px 16px",border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:30,height:30,borderRadius:9,background:`${ex.color}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <ex.Icon size={15} color={ex.color}/>
              </div>
              <span style={{fontSize:11,color:C.muted,fontWeight:600}}>{ex.label}</span>
            </div>
            <div style={{fontSize:30,fontWeight:900,color:ex.color,lineHeight:1}}>{prs[ex.id]}</div>
            <div style={{fontSize:10,color:C.muted}}>max reps</div>
          </div>
        ))}
      </div>
      {recentAch.length>0&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:.8}}>RECENT ACHIEVEMENTS</span>
          <button onClick={()=>setPage("ach")} style={{border:"none",background:"none",color:C.blue,fontSize:12,fontWeight:700,cursor:"pointer"}}>See all</button>
        </div>
        {recentAch.map(a=>(
          <div key={a.id} style={{background:C.surf,borderRadius:14,padding:"13px 15px",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:`${C.gold}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><a.Icon size={20} color={C.gold}/></div>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.text}}>{a.label}</div><div style={{fontSize:11,color:C.muted}}>{a.desc}</div></div>
            <div style={{fontSize:12,fontWeight:800,color:C.gold}}>+{a.xp}</div>
          </div>
        ))}
      </>}
    </div>
  );
}

function LogPage({reps,setReps,onSubmit,todayLogged,prs}){
  const canSubmit=Object.values(reps).some(v=>v>0);
  return(
    <div style={{padding:"0 14px 110px",display:"flex",flexDirection:"column",gap:13}}>
      <div style={{fontSize:13,color:C.muted,textAlign:"center",fontWeight:500}}>
        {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
      </div>
      {todayLogged&&<div style={{background:`${C.orange}18`,borderRadius:12,padding:"11px 15px",border:`1px solid ${C.orange}44`}}><span style={{color:C.orange,fontSize:13,fontWeight:600}}>Already logged today — updating your session</span></div>}
      {EXES.map(ex=>{
        const val=reps[ex.id];
        const isPR=val>0&&val>prs[ex.id];
        return(
          <div key={ex.id} style={{background:C.surf,borderRadius:18,padding:"16px 18px",border:`1.5px solid ${isPR?ex.color:C.border}`,boxShadow:isPR?`0 0 24px ${ex.color}30`:"none",transition:"all 0.2s"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:42,height:42,borderRadius:11,background:`linear-gradient(135deg,${ex.g[0]},${ex.g[1]})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <ex.Icon size={20} color="#fff"/>
                </div>
                <div><div style={{fontSize:15,fontWeight:800,color:C.text}}>{ex.label}</div><div style={{fontSize:11,color:C.muted}}>PR: {prs[ex.id]} reps</div></div>
              </div>
              {isPR&&<div style={{background:`${ex.color}22`,borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:800,color:ex.color}}>NEW PR!</div>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button onClick={()=>setReps(r=>({...r,[ex.id]:Math.max(0,r[ex.id]-1)}))} aria-label={`Decrease ${ex.label}`}
                style={{width:48,height:48,borderRadius:14,border:`1px solid ${C.border}`,background:C.surf2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Minus size={20} color={C.muted}/>
              </button>
              <div style={{flex:1,textAlign:"center",fontSize:50,fontWeight:900,color:val>0?ex.color:C.muted,lineHeight:1,transition:"color 0.2s"}}>{val}</div>
              <button onClick={()=>setReps(r=>({...r,[ex.id]:r[ex.id]+1}))} aria-label={`Increase ${ex.label}`}
                style={{width:48,height:48,borderRadius:14,border:"none",background:`linear-gradient(135deg,${ex.g[0]},${ex.g[1]})`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Plus size={20} color="#fff"/>
              </button>
            </div>
          </div>
        );
      })}
      <button onClick={onSubmit} disabled={!canSubmit} style={{border:"none",borderRadius:16,padding:"17px 24px",fontSize:16,fontWeight:800,cursor:canSubmit?"pointer":"not-allowed",background:canSubmit?`linear-gradient(135deg,#16A34A,#22C55E)`:C.surf2,color:canSubmit?"#fff":C.muted,boxShadow:canSubmit?`0 10px 30px ${C.green}44`:"none",transition:"all 0.2s"}}>
        {canSubmit?"Log Workout ✦":"Enter at least one exercise"}
      </button>
    </div>
  );
}

function ProgressPage({logs,prs}){
  const [activeEx,setActiveEx]=useState(0);
  const [range,setRange]=useState("30");
  const ex=EXES[activeEx];
  const chartData=useMemo(()=>{
    const sorted=[...logs].sort((a,b)=>a.date.localeCompare(b.date));
    const cutoff=range==="all"?null:(()=>{const d=new Date();d.setDate(d.getDate()-parseInt(range));return d.toISOString().split("T")[0];})();
    return sorted.filter(l=>!cutoff||l.date>=cutoff).map(l=>({date:fmtDate(l.date),val:l[ex.id]||0}));
  },[logs,activeEx,range]);
  const sortedLogs=useMemo(()=>[...logs].sort((a,b)=>a.date.localeCompare(b.date)),[logs]);
  const firstVal=sortedLogs.length?(sortedLogs[0][ex.id]||0):0;
  const lastVal=sortedLogs.length?(sortedLogs[sortedLogs.length-1][ex.id]||0):0;
  const improvePct=firstVal>0?Math.round(((lastVal-firstVal)/firstVal)*100):0;
  return(
    <div style={{padding:"0 14px 110px",display:"flex",flexDirection:"column",gap:13}}>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
        {EXES.map((e,i)=>(
          <button key={e.id} onClick={()=>setActiveEx(i)} style={{border:activeEx===i?"none":`1px solid ${C.border}`,borderRadius:10,padding:"8px 14px",cursor:"pointer",flexShrink:0,background:activeEx===i?`linear-gradient(135deg,${e.g[0]},${e.g[1]})`:C.surf,color:activeEx===i?"#fff":C.muted,fontSize:13,fontWeight:700,transition:"all 0.2s"}}>{e.label}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        {[["7","7 Days"],["30","30 Days"],["all","All Time"]].map(([v,l])=>(
          <button key={v} onClick={()=>setRange(v)} style={{border:`1px solid ${range===v?ex.color:C.border}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",background:range===v?`${ex.color}18`:C.surf,color:range===v?ex.color:C.muted,fontSize:12,fontWeight:700,transition:"all 0.2s"}}>{l}</button>
        ))}
      </div>
      <div style={{background:C.surf,borderRadius:18,padding:"16px 16px",border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <div style={{fontSize:12,color:C.muted,fontWeight:600}}>{ex.label} · Personal Best</div>
            <div style={{fontSize:32,fontWeight:900,color:ex.color,lineHeight:1.1}}>{prs[ex.id]} <span style={{fontSize:14,color:C.muted,fontWeight:500}}>reps</span></div>
            {improvePct!==0&&<div style={{fontSize:12,color:improvePct>0?C.green:C.danger,fontWeight:700,marginTop:3}}>{improvePct>0?"+":""}{improvePct}% since start</div>}
          </div>
          <div style={{width:40,height:40,borderRadius:11,background:`${ex.color}22`,display:"flex",alignItems:"center",justifyContent:"center"}}><ex.Icon size={20} color={ex.color}/></div>
        </div>
        {chartData.length>1?(
          <ResponsiveContainer width="100%" height={165}>
            <LineChart data={chartData} margin={{top:5,right:5,bottom:0,left:-30}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:9}} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{background:C.surf2,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:12}} labelStyle={{color:C.muted,marginBottom:4}}/>
              <Line type="monotone" dataKey="val" stroke={ex.color} strokeWidth={3} dot={{fill:ex.color,r:4,strokeWidth:0}} name="Reps" activeDot={{r:6,strokeWidth:0}}/>
            </LineChart>
          </ResponsiveContainer>
        ):(
          <div style={{height:165,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:13}}>Log more sessions to see your chart</div>
        )}
      </div>
      <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:.8}}>ALL-TIME RECORDS</div>
      {EXES.map(e=>(
        <div key={e.id} style={{background:C.surf,borderRadius:16,padding:"14px 16px",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${e.g[0]},${e.g[1]})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><e.Icon size={20} color="#fff"/></div>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.text}}>{e.label}</div><div style={{fontSize:11,color:C.muted}}>personal best</div></div>
          <div style={{fontSize:28,fontWeight:900,color:e.color}}>{prs[e.id]}</div>
        </div>
      ))}
    </div>
  );
}

function AchievPage({logs,streak,unlockedIds,totalXP,level,xpInLevel,xpNeeded}){
  const unlocked=ACHS.filter(a=>unlockedIds.has(a.id));
  const locked=ACHS.filter(a=>!unlockedIds.has(a.id));
  const xpPct=Math.min(100,(xpInLevel/xpNeeded)*100);
  return(
    <div style={{padding:"0 14px 110px",display:"flex",flexDirection:"column",gap:13}}>
      <div style={{background:`linear-gradient(135deg,#1A1040,#2D1B69)`,borderRadius:20,padding:"22px 20px",border:`1px solid #4C1D95`,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <div style={{fontSize:11,color:"#C4B5FD",fontWeight:700,letterSpacing:1}}>CURRENT LEVEL</div>
        <div style={{fontSize:60,fontWeight:900,color:"#fff",lineHeight:1}}>{level}</div>
        <div style={{fontSize:13,color:"#C4B5FD"}}>{totalXP.toLocaleString()} total XP earned</div>
        <div style={{width:"100%",height:8,borderRadius:99,background:"rgba(255,255,255,0.1)"}}>
          <div style={{height:8,borderRadius:99,width:`${xpPct}%`,background:`linear-gradient(90deg,#7C3AED,#A855F7)`,transition:"width 0.6s"}}/>
        </div>
        <div style={{fontSize:11,color:"#C4B5FD"}}>{xpInLevel} / {xpNeeded} XP to level {level+1}</div>
      </div>
      <div style={{display:"flex",gap:10}}>
        {[{label:"Sessions",val:logs.length,c:C.blue},{label:"Streak",val:`${streak}d`,c:C.orange},{label:"Badges",val:unlocked.length,c:C.gold}].map(st=>(
          <div key={st.label} style={{flex:1,background:C.surf,borderRadius:14,padding:"14px 10px",border:`1px solid ${C.border}`,textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:900,color:st.c}}>{st.val}</div>
            <div style={{fontSize:10,color:C.muted,fontWeight:600}}>{st.label}</div>
          </div>
        ))}
      </div>
      {unlocked.length>0&&<>
        <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:.8}}>UNLOCKED · {unlocked.length}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {unlocked.map(a=>(
            <div key={a.id} style={{background:`linear-gradient(135deg,${C.surf},${C.surf2})`,borderRadius:18,padding:16,border:`1px solid ${C.gold}44`,display:"flex",flexDirection:"column",alignItems:"center",gap:9,boxShadow:`0 4px 20px ${C.gold}15`}}>
              <div style={{width:52,height:52,borderRadius:16,background:`${C.gold}22`,display:"flex",alignItems:"center",justifyContent:"center"}}><a.Icon size={26} color={C.gold}/></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:800,color:C.text}}>{a.label}</div><div style={{fontSize:10,color:C.muted,marginTop:3,lineHeight:1.3}}>{a.desc}</div></div>
              <div style={{fontSize:12,fontWeight:800,color:C.gold}}>+{a.xp} XP</div>
            </div>
          ))}
        </div>
      </>}
      {locked.length>0&&<>
        <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:.8}}>LOCKED · {locked.length}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {locked.map(a=>(
            <div key={a.id} style={{background:C.surf,borderRadius:18,padding:16,border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",alignItems:"center",gap:9,opacity:.45}}>
              <div style={{width:52,height:52,borderRadius:16,background:C.surf2,display:"flex",alignItems:"center",justifyContent:"center"}}><Lock size={22} color={C.muted}/></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:800,color:C.muted}}>{a.label}</div><div style={{fontSize:10,color:C.border,marginTop:3,lineHeight:1.3}}>{a.desc}</div></div>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}

function SettingsPage({notifEnabled,setNotifEnabled,notifTime,setNotifTime}){
  return(
    <div style={{padding:"0 14px 110px",display:"flex",flexDirection:"column",gap:13}}>
      <div style={{background:C.surf,borderRadius:18,padding:"18px 18px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:.8,marginBottom:16}}>NOTIFICATIONS</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:notifEnabled?16:0}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:C.text}}>Daily Reminder</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Push notification each day</div>
          </div>
          <button onClick={()=>setNotifEnabled(!notifEnabled)} aria-label="Toggle notifications" style={{width:52,height:30,borderRadius:99,border:"none",cursor:"pointer",background:notifEnabled?C.green:C.border,transition:"all 0.2s",position:"relative",flexShrink:0}}>
            <div style={{position:"absolute",top:4,width:22,height:22,borderRadius:99,background:"#fff",transition:"left 0.2s",left:notifEnabled?26:4}}/>
          </button>
        </div>
        {notifEnabled&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:`1px solid ${C.border}`}}>
            <div><div style={{fontSize:15,fontWeight:700,color:C.text}}>Reminder Time</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Daily push time</div></div>
            <input type="time" value={notifTime} onChange={e=>setNotifTime(e.target.value)} style={{background:C.surf2,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,padding:"8px 12px",fontSize:14,fontWeight:700,outline:"none"}}/>
          </div>
        )}
      </div>
      <div style={{background:C.surf,borderRadius:18,padding:"18px 18px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:11,color:C.muted,fontWeight:700,letterSpacing:.8,marginBottom:16}}>ABOUT</div>
        {[["App","RepMax Tracker"],["Version","1.0.0"],["Stack","React · Recharts · PWA"],["Deploy","GitHub Pages"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",paddingBottom:12}}>
            <span style={{fontSize:14,color:C.muted}}>{k}</span>
            <span style={{fontSize:14,color:C.text,fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{background:C.surf,borderRadius:16,padding:"16px 18px",border:`1px solid ${C.green}40`,display:"flex",alignItems:"center",justifyContent:"center",gap:10,color:C.green,fontWeight:700,fontSize:14}}>
        ⭐ Star on GitHub
      </div>
    </div>
  );
}

function BottomNav({page,setPage}){
  const tabs=[
    {id:"home",Icon:Home,label:"Home"},
    {id:"log",Icon:Plus,label:"Log"},
    {id:"prog",Icon:BarChart2,label:"Progress"},
    {id:"ach",Icon:Trophy,label:"Rewards"},
    {id:"set",Icon:Settings,label:"Settings"},
  ];
  return(
    <div style={{position:"absolute",bottom:0,left:0,right:0,background:C.surf,borderTop:`1px solid ${C.border}`,display:"grid",gridTemplateColumns:"repeat(5,1fr)",zIndex:50}}>
      {tabs.map(t=>{
        const active=page===t.id;
        return(
          <button key={t.id} onClick={()=>setPage(t.id)} aria-label={t.label} style={{border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 4px 8px",gap:4,color:active?C.green:C.muted,transition:"color 0.2s"}}>
            <t.Icon size={22}/>
            <span style={{fontSize:9,fontWeight:active?700:500,letterSpacing:.5}}>{t.label.toUpperCase()}</span>
            {active&&<div style={{width:4,height:4,borderRadius:99,background:C.green}}/>}
          </button>
        );
      })}
    </div>
  );
}

export default function App(){
  const [logs,setLogs]=useState(genLogs);
  const [page,setPage]=useState("home");
  const [reps,setReps]=useState({pushups:0,pullups:0,situps:0,squats:0});
  const [notifEnabled,setNotifEnabled]=useState(false);
  const [notifTime,setNotifTime]=useState("08:00");
  const [toast,setToast]=useState(null);

  const streak=useMemo(()=>calcStreak(logs),[logs]);
  const totalXP=useMemo(()=>calcTotalXP(logs),[logs]);
  const lvl=useMemo(()=>calcLevel(totalXP),[totalXP]);
  const prs=useMemo(()=>calcPRs(logs),[logs]);
  const todayLogged=useMemo(()=>logs.some(l=>l.date===todayStr()),[logs]);
  const unlockedIds=useMemo(()=>new Set(ACHS.filter(a=>a.check(logs,streak)).map(a=>a.id)),[logs,streak]);

  const showToast=useCallback((msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);},[]);

  const handleLog=useCallback(()=>{
    if(!Object.values(reps).some(v=>v>0)) return;
    let xp=100; const newPRs=[];
    EXES.forEach(ex=>{if(reps[ex.id]>prs[ex.id]){xp+=30;newPRs.push(ex.short);}});
    if(streak>0) xp+=25;
    const entry={date:todayStr(),...reps,xp};
    setLogs(prev=>[...prev.filter(l=>l.date!==todayStr()),entry].sort((a,b)=>a.date.localeCompare(b.date)));
    showToast(newPRs.length?`+${xp} XP! New PRs: ${newPRs.join(",")}`:`+${xp} XP earned! Keep going!`);
    setReps({pushups:0,pullups:0,situps:0,squats:0});
    setPage("home");
  },[reps,prs,streak,showToast]);

  const TITLES={home:"RepMax",log:"Log Workout",prog:"Progress",ach:"Achievements",set:"Settings"};

  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#060C1A",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{width:390,height:844,background:C.bg,borderRadius:44,overflow:"hidden",position:"relative",boxShadow:"0 36px 90px rgba(0,0,0,0.9)",border:`2px solid ${C.border}`}}>
        <div style={{height:52,background:C.bg,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 22px 0",zIndex:10,position:"relative"}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text}}>9:41</div>
          <div style={{fontSize:16,fontWeight:900,color:C.text,letterSpacing:.5}}>{TITLES[page]}</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <Flame size={14} color={streak>0?C.orange:C.muted}/>
            <span style={{fontSize:12,fontWeight:800,color:streak>0?C.orange:C.muted}}>{streak}</span>
          </div>
        </div>
        {toast&&<Toast msg={toast.msg} type={toast.type}/>}
        <div style={{position:"absolute",top:52,bottom:72,left:0,right:0,overflowY:"auto",paddingTop:14}}>
          {page==="home"&&<HomePage logs={logs} streak={streak} level={lvl.level} xpInLevel={lvl.xpInLevel} xpNeeded={lvl.xpNeeded} totalXP={totalXP} prs={prs} todayLogged={todayLogged} setPage={setPage} unlockedIds={unlockedIds}/>}
          {page==="log"&&<LogPage reps={reps} setReps={setReps} onSubmit={handleLog} todayLogged={todayLogged} prs={prs}/>}
          {page==="prog"&&<ProgressPage logs={logs} prs={prs}/>}
          {page==="ach"&&<AchievPage logs={logs} streak={streak} unlockedIds={unlockedIds} totalXP={totalXP} level={lvl.level} xpInLevel={lvl.xpInLevel} xpNeeded={lvl.xpNeeded}/>}
          {page==="set"&&<SettingsPage notifEnabled={notifEnabled} setNotifEnabled={setNotifEnabled} notifTime={notifTime} setNotifTime={setNotifTime}/>}
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0}}><BottomNav page={page} setPage={setPage}/></div>
      </div>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{display:none;}button:active{transform:scale(0.96);}@keyframes slideDown{from{transform:translateY(-24px);opacity:0;}to{transform:translateY(0);opacity:1;}}`}</style>
    </div>
  );
}
