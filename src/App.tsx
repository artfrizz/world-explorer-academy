import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import confetti from 'canvas-confetti'
import { ArrowLeft, ArrowRight, BookOpen, Check, Download, Import, RotateCcw, Volume2, X } from 'lucide-react'
import { allWords, lessons, type Lesson, type Word } from './data'
import { exportProgress, loadProgress, markWord, mergeProgress, refreshVoices, reward, saveProgress, shuffle, sound, speak, validateProgress, wordKey, type Progress } from './engine'
import './style.css'

type Screen='map'|'words'|'lesson'|'review'
type Phase='card'|'picture'|'word'|'build'
const phases:Phase[]=['card','picture','word','build']
const picture=(word:Word,size:'large'|'small'='large')=><span className={`picture ${size}`} role="img" aria-label={word.ru}><span className="picture-shine"/><span className="picture-art">{word.picture}</span><span className="picture-ground"/></span>
const celebrate=()=>{sound('success');confetti({particleCount:55,spread:65,origin:{y:.7},colors:['#ffbe57','#8adccb','#8fa9ff','#ff9caa']})}

export default function App(){
 const [progress,setProgress]=useState<Progress>(loadProgress)
 const [screen,setScreen]=useState<Screen>('map')
 const [lesson,setLesson]=useState<Lesson>(lessons[0])
 const [message,setMessage]=useState('')
 const input=useRef<HTMLInputElement>(null)
 useEffect(()=>{saveProgress(progress)},[progress])
 useEffect(()=>{refreshVoices();window.speechSynthesis?.addEventListener?.('voiceschanged',refreshVoices);return()=>window.speechSynthesis?.removeEventListener?.('voiceschanged',refreshVoices)},[])
 const learned=allWords.filter(w=>(progress.words[wordKey(0,w.en)]?.mastery||0)>0)
 const completed=lessons.filter(l=>progress.completed.includes(l.id)).length
 const onCorrect=(w:Word)=>{setProgress(p=>reward(markWord(p,0,w.en,true),10));celebrate()}
 const onWrong=(w:Word)=>{setProgress(p=>markWord(p,0,w.en,false));sound('error')}
 const onFinish=()=>{setProgress(p=>p.completed.includes(lesson.id)?p:{...p,completed:[...p.completed,lesson.id],xp:p.xp+30});celebrate();setScreen('map')}
 const importFile=async(file?:File)=>{if(!file)return;try{const data=validateProgress(JSON.parse(await file.text()));setProgress(p=>mergeProgress(p,data));setMessage('Готово! Все достижения на месте 🎉')}catch(e){setMessage(e instanceof Error?e.message:'Не удалось открыть файл')}if(input.current)input.current.value=''}
 const openLesson=(l:Lesson)=>{setLesson(l);setScreen('lesson');window.scrollTo(0,0)}
 return <div className="app"><aside className="sidebar"><div className="logo"><span>🌈</span><div>English<br/><b>Adventure</b></div></div><nav aria-label="Главная навигация"><button className={screen==='map'||screen==='lesson'?'active':''} onClick={()=>setScreen('map')}><BookOpen size={27}/><span>Учить</span></button><button className={screen==='words'||screen==='review'?'active':''} onClick={()=>setScreen('words')}><span className="nav-emoji">📚</span><span>Мои слова</span></button></nav><div className="side-mascot" aria-hidden="true">🐻<span>У тебя<br/>получится!</span></div></aside>
 <div className="main-area"><header className="topbar"><div className="top-stats"><span className="stat"><span className="stat-emoji">🔥</span><b>{progress.streakDays}</b><small>дней</small></span><span className="stat"><span className="stat-emoji">⭐</span><b>{learned.length}</b><small>слов</small></span></div><div className="save-actions"><button onClick={()=>{exportProgress(progress);setMessage('Файл сохранения скачан!')}}><Download size={18}/><span>Сохранить прогресс</span></button><button onClick={()=>input.current?.click()}><Import size={18}/><span>Загрузить прогресс</span></button><input ref={input} type="file" accept=".json,application/json" hidden onChange={e=>void importFile(e.target.files?.[0])}/></div></header>
 {message&&<div className="toast" role="status">{message}<button aria-label="Закрыть" onClick={()=>setMessage('')}><X size={17}/></button></div>}
 <main className="content"><div key={`${screen}-${lesson.id}`} className="page-enter">
 {screen==='map'&&<><section className="welcome"><div><span className="eyebrow">ТВОЁ ПРИКЛЮЧЕНИЕ НАЧИНАЕТСЯ ЗДЕСЬ</span><h1>Привет, исследователь! <span>👋</span></h1><p>Слушай, смотри на картинки и учи английский играючи.</p><div className="welcome-bottom"><span className="progress-pill">🏆 {completed} из 25 уроков пройдено</span><span className="progress-track"><i style={{width:`${completed/25*100}%`}}/></span></div></div><div className="welcome-art" aria-hidden="true">🦊<span>HELLO!</span></div></section><div className="heading"><div><span className="eyebrow">ШАГ ЗА ШАГОМ</span><h2>Выбирай урок <span>✨</span></h2></div><span className="lesson-count">25 весёлых уроков</span></div><div className="lesson-grid">{lessons.map((l,i)=><button key={l.id} className="lesson-tile" onClick={()=>openLesson(l)} style={{'--tile':l.color} as CSSProperties}><span className="tile-image">{l.icon}</span><span className="tile-info"><small>УРОК {i+1}</small><b>{l.title}</b><span>{l.words.length} слов · Играть и учить</span></span><span className="tile-end">{progress.completed.includes(l.id)?<span className="tile-done"><Check size={20}/></span>:<ArrowRight size={21}/>}</span></button>)}</div></>}
 {screen==='words'&&<><section className="words-hero"><span className="words-hero-emoji">📚</span><div><span className="eyebrow">ТВОЯ КОЛЛЕКЦИЯ</span><h1>Мои слова</h1><p>Ты уже знаешь {learned.length} {learned.length===1?'слово':'слов'}! Нажми на картинку, чтобы услышать слово снова.</p></div><button className="big-button" disabled={!learned.length} onClick={()=>setScreen('review')}><RotateCcw size={21}/> Повторить слова</button></section>{learned.length?<div className="dictionary-grid">{learned.map(w=><button className="dictionary-card" key={w.id} onClick={()=>{speak(w.en);sound('tap')}}>{picture(w,'small')}<b>{w.en}</b><span>{w.ru}</span><small>{'★'.repeat(progress.words[wordKey(0,w.en)]?.mastery||0)}</small></button>)}</div>:<div className="empty"><span>🐣</span><h2>Пока здесь пусто</h2><p>Начни первый урок — и твои слова появятся тут!</p><button className="big-button" onClick={()=>setScreen('map')}>Выбрать урок <ArrowRight size={20}/></button></div>}</>}
 {screen==='lesson'&&<LessonPlay key={lesson.id} lesson={lesson} onBack={()=>setScreen('map')} onCorrect={onCorrect} onWrong={onWrong} onLearn={w=>setProgress(p=>markWord(p,0,w.en,true))} onFinish={onFinish}/>}
 {screen==='review'&&<ReviewPlay words={learned} onBack={()=>setScreen('words')} onCorrect={onCorrect} onWrong={onWrong}/>}
 </div></main></div></div>
}

function Quiz({target,pool,kind,onCorrect,onWrong,onContinue}:{target:Word;pool:Word[];kind:'picture'|'word';onCorrect:()=>void;onWrong:()=>void;onContinue:()=>void}){
 const [selected,setSelected]=useState<string|null>(null)
 const [wrongChoice,setWrongChoice]=useState<string|null>(null)
 const options=useMemo(()=>shuffle([target,...shuffle(pool.filter(w=>w.id!==target.id)).slice(0,Math.min(3,pool.length-1))]),[target,pool])
 useEffect(()=>{setSelected(null);setWrongChoice(null)},[target,kind])
 useEffect(()=>{if(kind==='picture')speak(target.en)},[target,kind])
 const choose=(w:Word)=>{if(selected)return;speak(w.en);if(w.id===target.id){setSelected(w.id);setWrongChoice(null);onCorrect()}else{setWrongChoice(w.id);onWrong()}}
 return <><div className="question-area"><span className="eyebrow">{kind==='picture'?'СЛУШАЙ И ВЫБИРАЙ':'СМОТРИ И ВЫБИРАЙ'}</span><h2>{kind==='picture'?'Найди картинку':'Какое это слово?'}</h2>{kind==='picture'?<button className="sound-prompt" onClick={()=>speak(target.en)}><Volume2 size={27}/> Слушать ещё раз</button>:<div className="question-picture">{picture(target)}</div>}</div><div className={`choice-grid ${kind}`}>{options.map(w=><button key={w.id} aria-label={kind==='picture'?w.ru:w.en} className={`choice ${selected===w.id?'correct':''} ${wrongChoice===w.id?'incorrect':''}`} onClick={()=>choose(w)}>{kind==='picture'?<>{picture(w,'small')}<span>{w.ru}</span></>:<span>{w.en}</span>}</button>)}</div>{selected?<div className="answer-footer positive">🎉 Правильно! Молодец! <button className="big-button" onClick={onContinue}>Дальше <ArrowRight size={20}/></button></div>:wrongChoice?<div className="answer-footer try-again">Попробуй ещё раз! Нажми на другую карточку 💛</div>:null}</>
}

function BuildPhrase({target,pool,onCorrect,onWrong,onContinue}:{target:Word;pool:Word[];onCorrect:()=>void;onWrong:()=>void;onContinue:()=>void}){
 const parts=target.en.replace(/\.\.\./g,'').trim().split(/\s+/)
 const [selected,setSelected]=useState<number[]>([])
 const [done,setDone]=useState(false)
 const [error,setError]=useState(false)
 const tiles=useMemo(()=>shuffle(parts.map((text,index)=>({text,index}))),[target])
 useEffect(()=>{setSelected([]);setDone(false);setError(false)},[target])
 const choose=(index:number)=>{if(done)return;const next=[...selected,index];setSelected(next);setError(false);sound('tap');if(next.length===parts.length){if(next.every((n,i)=>n===i)){setDone(true);speak(target.en);onCorrect()}else{setError(true);onWrong()}}}
 return <><div className="question-area"><span className="eyebrow">СОБЕРИ ФРАЗУ</span><h2>«{target.ru}»</h2><div className="question-picture">{picture(target)}</div><button className="speak-small" onClick={()=>speak(target.en)}><Volume2 size={17}/> Послушать фразу</button></div><div className="phrase-slots">{parts.map((_,i)=><button key={i} className={error?'slot-error':''} onClick={()=>{if(!done&&selected[i]!==undefined){setSelected(s=>s.slice(0,i));setError(false)}}}>{selected[i]===undefined?'＋':parts[selected[i]]}</button>)}</div><div className="phrase-tiles">{tiles.filter(t=>!selected.includes(t.index)).map(t=><button key={t.index} onClick={()=>choose(t.index)}>{t.text}</button>)}</div>{error&&<div className="answer-footer try-again">Не страшно! Начни со слова «{parts[0]}». <button onClick={()=>{setSelected([]);setError(false)}}><RotateCcw size={17}/> Заново</button></div>}{done&&<div className="answer-footer positive">🌟 Получилось! <button className="big-button" onClick={onContinue}>Дальше <ArrowRight size={20}/></button></div>}<span className="phrase-pool-note">{pool.length} фразы в этом уроке</span></>
}

function LessonPlay({lesson,onBack,onCorrect,onWrong,onLearn,onFinish}:{lesson:Lesson;onBack:()=>void;onCorrect:(w:Word)=>void;onWrong:(w:Word)=>void;onLearn:(w:Word)=>void;onFinish:()=>void}){
 const [wordIndex,setWordIndex]=useState(0)
 const [phaseIndex,setPhaseIndex]=useState(0)
 const [finished,setFinished]=useState(false)
 const word=lesson.words[wordIndex]
 const phase=phases[phaseIndex]
 const isPhrase=lesson.id>=1022
 const stepsPerWord=isPhrase?4:3
 const step=wordIndex*stepsPerWord+phaseIndex+1
 const total=lesson.words.length*stepsPerWord
 useEffect(()=>{if(!finished&&phase==='card')speak(word.en)},[wordIndex,phase,word,finished])
 const next=()=>{if(phaseIndex+1<stepsPerWord)setPhaseIndex(i=>i+1);else if(wordIndex+1<lesson.words.length){setWordIndex(i=>i+1);setPhaseIndex(0)}else setFinished(true)}
 if(finished)return <div className="game-shell finish-screen"><div className="finish-confetti">🎉</div><h1>Урок пройден!</h1><p>Ты выучил {lesson.words.length} новых слов и фраз. Вот это да!</p><div className="finish-stars">⭐⭐⭐</div><button className="big-button" onClick={onFinish}>К урокам <ArrowRight size={20}/></button></div>
 return <div className="game-shell"><div className="game-head"><button className="back-button" onClick={onBack} aria-label="К урокам"><X size={24}/></button><div className="lesson-progress"><span>Урок {lesson.id-1000} · {lesson.title}</span><div className="progress-track"><i style={{width:`${(step-1)/total*100}%`}}/></div></div><span className="step-count">{step}/{total}</span></div><div className="game-panel" key={`${wordIndex}-${phaseIndex}`}>{phase==='card'?<><div className="question-area"><span className="eyebrow">НОВОЕ СЛОВО</span><h2>Смотри и слушай 👀</h2></div><div className="big-flashcard"><button className="hero-picture" onClick={()=>speak(word.en)} title="Послушать слово">{picture(word)}</button><strong>{word.en}</strong><span>{word.ru}</span><button className="sound-prompt" onClick={()=>speak(word.en)}><Volume2 size={25}/> Послушать</button></div><div className="game-bottom"><button className="big-button" onClick={()=>{onLearn(word);next()}}>Понятно! <ArrowRight size={20}/></button></div></>:phase==='build'?<BuildPhrase target={word} pool={lesson.words} onCorrect={()=>onCorrect(word)} onWrong={()=>onWrong(word)} onContinue={next}/>:<Quiz key={`${word.id}-${phase}`} target={word} pool={lesson.words} kind={phase} onCorrect={()=>onCorrect(word)} onWrong={()=>onWrong(word)} onContinue={next}/>}</div></div>
}

function ReviewPlay({words,onBack,onCorrect,onWrong}:{words:Word[];onBack:()=>void;onCorrect:(w:Word)=>void;onWrong:(w:Word)=>void}){
 const [round,setRound]=useState(0),[done,setDone]=useState(false)
 const pool=useMemo(()=>shuffle(words),[words])
 const target=pool[round%pool.length]
 if(!target)return <div className="empty">Сначала изучи первый урок! <button onClick={onBack}>Назад</button></div>
 if(done)return <div className="game-shell finish-screen"><span className="finish-confetti">🏆</span><h1>Отличное повторение!</h1><p>Ты повторил 10 слов. Продолжай в том же духе!</p><button className="big-button" onClick={onBack}>Мои слова <ArrowRight size={20}/></button></div>
 return <div className="game-shell"><div className="game-head"><button className="back-button" onClick={onBack}><ArrowLeft size={23}/></button><div className="lesson-progress"><span>Повторяем слова</span><div className="progress-track"><i style={{width:`${round*10}%`}}/></div></div><span className="step-count">{round+1}/10</span></div><div className="game-panel"><Quiz key={round} target={target} pool={pool} kind={round%2?'word':'picture'} onCorrect={()=>onCorrect(target)} onWrong={()=>onWrong(target)} onContinue={()=>round===9?setDone(true):setRound(r=>r+1)}/></div></div>
}
