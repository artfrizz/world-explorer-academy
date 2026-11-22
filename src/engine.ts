const countries = ['GB','JP','CA','AU','BR','EG','FR','CN','IS','NO','PE','IN','IT','DE','KR','MX','KE','AR','GR','NZ'].map(code => ({code}))
export type WordState = { mastery:number; streak:number; due:number; mistakes:number; [futureField:string]:unknown }
export type Progress = { schemaVersion:number; xp:number; totalCorrect:number; streakDays:number; lastDate:string; words:Record<string,WordState>; completed:number[]; unlockedCountries:number; unlockedCountryCodes:string[]; dark:boolean; mentor:boolean; [futureField:string]:unknown }
export const SCHEMA_VERSION=2
export const initial:Progress = {schemaVersion:SCHEMA_VERSION,xp:0,totalCorrect:0,streakDays:0,lastDate:'',words:{},completed:[],unlockedCountries:1,unlockedCountryCodes:[countries[0].code],dark:true,mentor:true}
const key='world-explorer-academy-progress', backupKey=`${key}-backup`, legacyKey='world-explorer-academy-v1'
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
const positive=(v:unknown,fallback=0)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.floor(v)):fallback
const unique=<T,>(v:T[])=>[...new Set(v)]
const normalWord=(v:unknown):WordState=>{const p=record(v)?v:{};return {...p,mastery:Math.min(5,positive(p.mastery)),streak:positive(p.streak),due:positive(p.due),mistakes:positive(p.mistakes)}}
const combineWord=(a:WordState,b:WordState):WordState=>({...a,...b,mastery:Math.max(a.mastery,b.mastery),streak:Math.max(a.streak,b.streak),mistakes:Math.min(a.mistakes,b.mistakes),due:Math.max(a.due,b.due)})
// When a word is renamed in a future course, add old -> new here before shipping.
const wordAliases:Record<string,string>={}
const stableWord=(en:string)=>{const normalized=en.normalize('NFKC').toLowerCase().replace(/[.!?…]+$/g,'').replace(/\s+/g,' ').trim();return `word:${wordAliases[normalized]||normalized}`}
// Migrations never filter unknown level/word IDs: future course revisions can restore them.
// Add future schema upgrades here, one version at a time; retain unrecognized fields.
export function validateProgress(data:unknown):Progress {
 if(!record(data))throw Error('Неверный файл прогресса')
 if('format'in data&&data.format!=='world-explorer-academy-progress')throw Error('Неверный формат файла')
 const source=record(data.progress)?data.progress:data
 if(!record(source.words)||!Array.isArray(source.completed)||typeof source.xp!=='number'||!Number.isFinite(source.xp))throw Error('Файл не содержит корректный прогресс')
 const version=source.schemaVersion===undefined?1:positive(source.schemaVersion)
 if(version>SCHEMA_VERSION)throw Error('Этот файл создан более новой версией Академии')
 const words:Record<string,WordState>={};for(const [id,value] of Object.entries(source.words))if(record(value))words[id]=normalWord(value)
 for(const [id,state] of Object.entries(words)){const old=/^\d+:(.+)$/.exec(id);if(old){const stable=stableWord(old[1]);words[stable]=words[stable]?combineWord(words[stable],state):state}}
 for(const [id,state] of Object.entries(words)){if(id.startsWith('word:')){const stable=stableWord(id.slice(5));if(stable!==id)words[stable]=words[stable]?combineWord(words[stable],state):state}}
 const completed=unique(source.completed.filter((v):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0))
 const unlockedCountries=Math.max(1,positive(source.unlockedCountries,1))
 const unlockedCountryCodes=unique([...(Array.isArray(source.unlockedCountryCodes)?source.unlockedCountryCodes.filter((v):v is string=>typeof v==='string'):countries.slice(0,unlockedCountries).map(c=>c.code)),...countries.slice(0,Math.min(unlockedCountries,countries.length)).map(c=>c.code)])
 return {...initial,...source,schemaVersion:SCHEMA_VERSION,xp:positive(source.xp),totalCorrect:positive(source.totalCorrect),streakDays:positive(source.streakDays),lastDate:typeof source.lastDate==='string'?source.lastDate:'',words,completed,unlockedCountries,unlockedCountryCodes,dark:typeof source.dark==='boolean'?source.dark:true,mentor:typeof source.mentor==='boolean'?source.mentor:true}
}
export function mergeProgress(current:Progress,incoming:Progress):Progress {
 const a=validateProgress(current),b=validateProgress(incoming),words={...a.words}
 for(const [id,item] of Object.entries(b.words)){const old=words[id];words[id]=old?combineWord(old,item):item}
 const completed=unique([...a.completed,...b.completed]),unlockedCountryCodes=unique([...a.unlockedCountryCodes,...b.unlockedCountryCodes])
 return {...a,...b,schemaVersion:SCHEMA_VERSION,words,completed,unlockedCountryCodes,xp:Math.max(a.xp,b.xp),totalCorrect:Math.max(a.totalCorrect,b.totalCorrect),streakDays:Math.max(a.streakDays,b.streakDays),lastDate:a.lastDate>b.lastDate?a.lastDate:b.lastDate,unlockedCountries:Math.max(a.unlockedCountries,b.unlockedCountries,unlockedCountryCodes.length,1+Math.floor(Math.max(a.totalCorrect,b.totalCorrect)/10)+completed.length)}
}
export function loadProgress():Progress {let result=initial;try {const current=localStorage.getItem(key);if(current){try{return validateProgress(JSON.parse(current))}catch{/* fall back to other copies */}}for(const storageKey of [legacyKey,backupKey]){const raw=localStorage.getItem(storageKey);if(!raw)continue;try{result=mergeProgress(result,validateProgress(JSON.parse(raw)))}catch{/* keep other copies */}}}catch{/* localStorage blocked */}return result}
export function saveProgress(p:Progress){try{const old=localStorage.getItem(key);if(old)try{validateProgress(JSON.parse(old));localStorage.setItem(backupKey,old)}catch{/* don't overwrite a valid backup */}localStorage.setItem(key,JSON.stringify(validateProgress(p)))}catch{/* Private mode may block storage; file export remains available */}}
export function exportProgress(p:Progress){const payload={format:'world-explorer-academy-progress',exportedAt:new Date().toISOString(),progress:validateProgress(p)};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='world-explorer-progress.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
export const wordKey=(_level:number,en:string)=>stableWord(en)
export function markWord(p:Progress,level:number,en:string,correct:boolean):Progress { const key=wordKey(level,en); const old=p.words[key]||{mastery:0,streak:0,due:0,mistakes:0}; const streak=correct?old.streak+1:0; const mastery=correct?Math.min(5,old.mastery+1):Math.max(0,old.mastery-1); const delays=[0,0,3600000,86400000,3*86400000,7*86400000]; return {...p,words:{...p.words,[key]:{mastery,streak,due:correct && (old.mistakes===0||streak>=3)?Date.now()+delays[mastery]:0,mistakes:correct&&streak>=3?0:old.mistakes+(correct?0:1)}}} }
export function reward(p:Progress,xp:number):Progress { const today=new Date().toLocaleDateString('en-CA'); const yesterday=new Date(Date.now()-86400000).toLocaleDateString('en-CA'); const streakDays=p.lastDate===today?p.streakDays:p.lastDate===yesterday?p.streakDays+1:1; const totalCorrect=p.totalCorrect+1; const unlockedCountries=Math.max(p.unlockedCountries,1+Math.floor(totalCorrect/10)+p.completed.length);return {...p,xp:p.xp+xp,totalCorrect,lastDate:today,streakDays,unlockedCountries,unlockedCountryCodes:unique([...p.unlockedCountryCodes,...countries.slice(0,unlockedCountries).map(c=>c.code)])} }



let context:AudioContext|undefined
export function sound(type:'tap'|'success'|'error') {try {context ||= new AudioContext(); if(context.state==='suspended')void context.resume(); const now=context.currentTime; const notes=type==='success'?[523,659,784]:type==='error'?[260,220]:[480]; notes.forEach((freq,i)=>{const osc=context!.createOscillator(),gain=context!.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,now+i*.085);gain.gain.setValueAtTime(.0001,now+i*.085);gain.gain.exponentialRampToValueAtTime(type==='tap'?.035:.065,now+i*.085+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+i*.085+.18);osc.connect(gain).connect(context!.destination);osc.start(now+i*.085);osc.stop(now+i*.085+.19)})}catch{/* Audio may be unavailable */} }

let voiceCache:SpeechSynthesisVoice[]=[]
export function refreshVoices(){try{voiceCache=window.speechSynthesis.getVoices()}catch{voiceCache=[]}}
export function speak(text:string,lang:'en'|'ru'='en',rate=1){try{const synth=window.speechSynthesis;synth.cancel();refreshVoices();const utterance=new SpeechSynthesisUtterance(text);utterance.lang=lang==='ru'?'ru-RU':'en-US';utterance.rate=rate;utterance.pitch=lang==='ru'?1.05:1;const candidates=voiceCache.filter(v=>v.lang.toLowerCase().startsWith(lang));candidates.sort((a,b)=>{const score=(v:SpeechSynthesisVoice)=>(v.localService?3:0)+(v.name.match(/natural|online|google|microsoft|aria|jenny|zira|svetlana/i)?2:0)+(v.lang.toLowerCase()===(lang==='ru'?'ru-ru':'en-us')?1:0);return score(b)-score(a)});if(candidates[0])utterance.voice=candidates[0];synth.speak(utterance)}catch{/* browser unsupported */}}
export function shuffle<T>(items:T[]):T[]{return [...items].sort(()=>Math.random()-.5)}
