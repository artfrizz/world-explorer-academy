import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import vm from 'node:vm'

const source=await readFile('src/engine.ts','utf8')
const code=ts.transpileModule(source.replace("import { countries } from './data'",'const countries=[{code:"GB"},{code:"JP"},{code:"CA"}];'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText
const local=new Map()
const context={module:{exports:{}},exports:{},localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)},console,Date,Set,Object,Math,JSON}
context.exports=context.module.exports
vm.runInNewContext(code,context)
const {validateProgress,mergeProgress,saveProgress,loadProgress}=context.module.exports
const old={xp:240,totalCorrect:17,streakDays:4,lastDate:'2026-11-21',completed:[1,9],unlockedCountries:4,words:{'1:Hello!':{mastery:5,streak:3,due:123,mistakes:0},'9:Future':{mastery:4,streak:2,due:500,mistakes:1}},dark:false,mentor:true}
test('migrates legacy data without dropping future level IDs or words',()=>{const p=validateProgress(old);assert.equal(p.schemaVersion,2);assert.deepEqual(Array.from(p.completed),[1,9]);assert.equal(p.words['9:Future'].mastery,4);assert.equal(p.words['word:future'].mastery,4);assert.equal(p.unlockedCountries,4);assert.ok(p.unlockedCountryCodes.includes('JP'))})
test('merge never loses stars, XP, completed levels or opened countries',()=>{const current=validateProgress({...old,xp:300,words:{'1:Hello!':{mastery:5,streak:4,due:600,mistakes:0}},completed:[1,3],unlockedCountryCodes:['GB','NZ']});const imported=validateProgress({...old,xp:240,words:{'1:Hello!':{mastery:2,streak:0,due:0,mistakes:2},'9:Future':{mastery:4,streak:2,due:500,mistakes:1}}});const merged=mergeProgress(current,imported);assert.equal(merged.xp,300);assert.equal(merged.words['1:Hello!'].mastery,5);assert.equal(merged.words['9:Future'].mastery,4);assert.deepEqual(Array.from(merged.completed).sort(),[1,3,9]);assert.ok(merged.unlockedCountryCodes.includes('NZ'))})
test('recovers from corrupted primary using valid backup and old key',()=>{local.clear();local.set('world-explorer-academy-v1',JSON.stringify(old));const first=loadProgress();saveProgress(first);local.set('world-explorer-academy-progress','{corrupted');const recovered=loadProgress();assert.equal(recovered.xp,240);assert.equal(recovered.words['1:Hello!'].mastery,5)})
test('rejects files from newer incompatible schema',()=>assert.throws(()=>validateProgress({...old,schemaVersion:99}),/более новой/))
test('old completed lessons do not collide with the new course IDs',()=>{const p=validateProgress(old);assert.ok(p.completed.includes(1));assert.ok(!p.completed.includes(1001));assert.equal(p.words['word:hello'].mastery,5)})
test('tracks word mistakes across sessions and merges error counters safely',()=>{const {markWord,markSentenceError}=context.module.exports;let p=validateProgress(old);p=markWord(p,0,'Hello',false);p=markWord(p,0,'Hello',false);p=markSentenceError(p,'s1');assert.equal(p.errorCounts['word:hello'],2);assert.equal(p.errorCounts['sentence:s1'],1);const merged=mergeProgress(p,validateProgress({...old,errorCounts:{'word:hello':1},reviewRuns:4}));assert.equal(merged.errorCounts['word:hello'],2);assert.equal(merged.reviewRuns,4)})
