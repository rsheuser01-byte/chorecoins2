export const missions = ['change', 'budget', 'saving', 'shop'] as const;
export type Mission = typeof missions[number];
export type Profile = 'demo-builder' | 'demo-explorer';
export type Difficulty = 'easy' | 'harder';
export type Progress = { version: 1; step: number; difficulty: Difficulty; supplies: number[]; done: boolean };
export const blank = (): Progress => ({version: 1, step: 0, difficulty: 'easy', supplies: [], done: false});
export const enabled = (search: string) => new URLSearchParams(search).get('learningPrototype') === 'on';
export const key = (owner: Profile, mission: Mission) => `chorecoins:learning-prototype:v1:${owner}:${mission}`;
export function read(store: Pick<Storage, 'getItem'>, owner: Profile, mission: Mission): Progress {
  const raw = store.getItem(key(owner, mission));
  const receipt = store.getItem(key(owner, mission) + ":complete");
  if (receipt !== null && receipt !== "1") throw new Error("Unreadable completion record");
  if (raw === null) return {...blank(), done: receipt === "1"};
  const p = JSON.parse(raw);
  if (!p || p.version !== 1 || !Number.isInteger(p.step) || p.step < 0 || p.step > 3 || !['easy','harder'].includes(p.difficulty) || typeof p.done !== 'boolean' || !Array.isArray(p.supplies) || p.supplies.some((n: number) => ![0,1,2].includes(n)) || new Set(p.supplies).size !== p.supplies.length) throw new Error('Saved practice could not be read. Existing data has been left untouched.');
  return {...p, done: receipt === "1"};
}
export const prices = [6, 6, 12];
export const cost = (items: number[]) => items.reduce((sum, i) => sum + prices[i], 0);
export const validAnswer = (input: string, answer: number) => /^\d+$/.test(input.trim()) && Number.isSafeInteger(Number(input)) && Number(input) === answer;
export type Question = {text: string; answer: number; explanation: string; choices?: number[]};
export function questions(mission: Mission, difficulty: Difficulty, supplies: number[] = []): Question[] {
 const n = difficulty === 'harder' ? 2 : 1;
 if(mission === 'change') return [
 {text:`A notebook costs ${4*n} coins and a pencil costs ${2*n}. What is the total?`,answer:6*n, explanation:`Add the prices: ${4*n} + ${2*n} = ${6*n}.`},
 {text:`Pay ${10*n} coins for those supplies. How much change comes back?`,answer:4*n,explanation:`Subtract the cost from the payment: ${10*n} − ${6*n} = ${4*n}.`},
 {text:`Nova thinks two ${3*n}-coin stickers cost ${5*n}. What is the correct total?`,answer:6*n,explanation:`Two equal prices means ${3*n} + ${3*n} = ${6*n}.`}];
 if(mission === 'budget') return [
 {text:`You have ${20*n} coins. A kit costs ${12*n}. How many coins remain?`,answer:8*n,explanation:`Your budget minus your purchase: ${20*n} − ${12*n} = ${8*n}.`},
 {text:`With ${8*n} coins left, choose the most expensive decoration you can afford.`,answer:7*n,choices:[5*n,7*n,9*n],explanation:`${7*n} fits inside ${8*n}; ${9*n} is over budget.`},
 {text:`After buying the ${7*n}-coin decoration, how much can you save?`,answer:n,explanation:`${8*n} − ${7*n} = ${n}. Saving a little still counts!`}];
 if(mission === 'saving') return [
 {text:`Your goal costs ${20*n} coins. You saved ${8*n}. How many more do you need?`,answer:12*n,explanation:`Goal minus savings: ${20*n} − ${8*n} = ${12*n}.`},
 {text:`Your stand earns ${10*n} coins but supplies cost ${4*n}. What are your earnings after costs?`,answer:6*n,explanation:`Money received is not all profit: ${10*n} − ${4*n} = ${6*n}.`},
 {text:`Add those ${6*n} coins to your ${8*n} saved coins. What is your new savings total?`,answer:14*n,explanation:`${8*n} + ${6*n} = ${14*n}. Your goal is getting closer!`}];
 const c = cost(supplies);
 return [
 {text:`Your supplies cost ${c} of your 20 practice coins. How much remains?`,answer:20-c,explanation:`20 − ${c} = ${20-c}. Your choices determine your budget.`},
 {text:`Customer 1 buys two postcards at ${3*n} coins each. What is their total?`,answer:6*n,explanation:`${3*n} + ${3*n} = ${6*n}.`},
 {text:`Customer 2 buys a ${4*n}-coin badge and pays ${10*n}. How much change do you give?`,answer:6*n,explanation:`${10*n} − ${4*n} = ${6*n}.`}];
}

export function persist(store: Pick<Storage, 'getItem' | 'setItem'>, owner: Profile, mission: Mission, next: Progress, complete = false): Progress {
 const current = read(store, owner, mission);
 if (complete) {
   store.setItem(key(owner, mission) + ':complete', '1');
   return {...next, done: true};
 }
 store.setItem(key(owner, mission), JSON.stringify({...next, done: false}));
 return {...next, done: current.done};
}
