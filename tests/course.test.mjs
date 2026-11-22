import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import vm from 'node:vm'

const source=await readFile('src/data.ts','utf8')
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText
const context={module:{exports:{}},exports:{}}
context.exports=context.module.exports
vm.runInNewContext(code,context)
const {lessons,allWords,sentences}=context.module.exports
test('50 lessons have unique IDs and picture for every word',()=>{assert.equal(lessons.length,50);assert.equal(new Set(lessons.map(l=>l.id)).size,50);assert.ok(lessons.every(l=>l.words.length>=4&&l.words.every(w=>w.en&&w.ru&&w.picture&&w.id)));assert.ok(allWords.length>=250)})
test('table and hat are explicitly illustrated rather than mistaken for chair and cap',()=>{const table=allWords.find(w=>w.en==='Table'),hat=allWords.find(w=>w.en==='Hat');assert.equal(table.ru,'Стол');assert.equal(hat.ru,'Шапка');assert.notEqual(table.picture,allWords.find(w=>w.en==='Chair').picture);assert.notEqual(hat.picture,'🧢')})
test('sentence exercise contains ten distinct prompts with answers',()=>{assert.equal(sentences.length,10);assert.equal(new Set(sentences.map(s=>s.id)).size,10);assert.ok(sentences.every(s=>s.answer&&s.ru&&s.picture))})
