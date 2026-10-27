/** Validate without repairing, deleting, normalizing, or replacing stored bytes. */
type Obj = Record<string, unknown>;
type Check = (value: unknown, path: string) => void;
function invalid(path: string): never { throw new Error(`Invalid progress payload: ${path}`); }
function object(value: unknown, path: string): Obj {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(path);
  return value as Obj;
}
const string: Check = (value, path) => { if (typeof value !== 'string') invalid(path); };
const nonempty: Check = (value, path) => { string(value, path); if (!(value as string).length) invalid(path); };
const boolean: Check = (value, path) => { if (typeof value !== 'boolean') invalid(path); };
function number(min = 0, integer = false): Check {
  return (value, path) => { if (typeof value !== 'number' || !Number.isFinite(value) || value < min || (integer && !Number.isSafeInteger(value))) invalid(path); };
}
function choice(values: string[]): Check { return (value, path) => { if (typeof value !== 'string' || !values.includes(value)) invalid(path); }; }
function optional(o: Obj, key: string, check: Check, path: string) { if (o[key] !== undefined) check(o[key], `${path}.${key}`); }
function required(o: Obj, keys: string[], check: Check, path: string) { keys.forEach(key => check(o[key], `${path}.${key}`)); }
function array(value: unknown, path: string, check: Check) {
  if (!Array.isArray(value)) invalid(path);
  value.forEach((item, index) => check(item, `${path}[${index}]`));
}
function strings(value: unknown, path: string, unique = false) {
  array(value, path, string);
  if (unique && new Set(value as string[]).size !== (value as string[]).length) invalid(path);
}
const date: Check = (value, path) => {
  nonempty(value, path);
  const text=value as string;
  if (!/^(?:\d{4}-\d{2}-\d{2}(?:T.+)?|(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat) [A-Z][a-z]{2} \d{2} \d{4})$/.test(text) || !Number.isFinite(Date.parse(text))) invalid(path);
  const iso=/^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) {
    const checked=new Date(Date.UTC(+iso[1],+iso[2]-1,+iso[3]));
    if (checked.getUTCFullYear()!==+iso[1] || checked.getUTCMonth()+1!==+iso[2] || checked.getUTCDate()!==+iso[3]) invalid(path);
  }
};
function objects(value: unknown, path: string, check: (o: Obj, path: string) => void) {
  array(value, path, (item, at) => check(object(item, at), at));
}
function chores(value: unknown, path: string) {
  objects(value, path, (o, at) => {
    required(o, ['id', 'title'], nonempty, at); boolean(o.completed, `${at}.completed`);
    for (const key of ['description', 'category', 'emoji', 'seriesId']) optional(o, key, string, at);
    for (const key of ['dueDate', 'date', 'occurrenceDate']) optional(o, key, date, at);
    optional(o, 'priority', choice(['low','medium','high']), at);
    optional(o, 'difficulty', choice(['easy','medium','hard']), at);
    optional(o, 'recurring', choice(['none','daily','weekly','biweekly','monthly','custom']), at);
    optional(o, 'recurringDays', (days, p) => array(days, p, (day, q) => { number(0, true)(day, q); if ((day as number) > 6) invalid(q); }), at);
    optional(o, 'reward', number(), at);
  });
}
function stats(value: unknown, path: string) {
  const o = object(value, path);
  for (const key of ['xp','totalXp','choreStreak','learningStreak','totalChoresCompleted','totalLessonsCompleted']) optional(o,key,number(0,true),path);
  for (const key of ['level','xpToNextLevel']) optional(o,key,number(1,true),path);
  optional(o,'totalMoneyEarned',number(),path);
  optional(o,'lastActiveDate',date,path);
  for (const key of ['completedChoreDays','completedLearningDays']) optional(o,key,(v,p) => array(v,p,date),path);
  optional(o,'rewardedChoreOccurrences',(v,p) => {
    strings(v,p,true);
    for (const id of v as string[]) if (!id || id.length > 256) invalid(p);
  },path);
  if (Array.isArray(o.rewardedChoreOccurrences) && o.rewardedChoreOccurrences.length > (typeof o.totalChoresCompleted === 'number' ? o.totalChoresCompleted : 0)) invalid(`${path}.rewardedChoreOccurrences`);
}
function achievements(value: unknown, path: string) {
  objects(value,path,(o,at) => {
    required(o,['id','title','description','icon'],string,at); boolean(o.unlocked,`${at}.unlocked`);
    required(o,['requirement','currentProgress'],number(),at);
    choice(['chores','learning','investing','saving','special','bitcoin','games'])(o.category,`${at}.category`);
    choice(['bronze','silver','gold','platinum','legendary'])(o.rarity,`${at}.rarity`);
    const reward=object(o.reward,`${at}.reward`); required(reward,['xp','coins'],number(),`${at}.reward`); optional(reward,'special',string,`${at}.reward`);
    optional(o,'unlockedAt',date,at);
    optional(o,'celebration',(v,p) => { const c=object(v,p); required(c,['animation','message'],string,p); optional(c,'sound',string,p); },at);
  });
}
function profile(value: unknown, path: string) {
  const o=object(value,path);
  if (Object.keys(o).some(key => !['name','bio','avatar','favoriteColor','goals'].includes(key))) invalid(path);
  for (const key of ['name','bio','favoriteColor']) optional(o,key,string,path);
  optional(o,'avatar',(v,p) => { if (v !== null) string(v,p); },path);
  optional(o,'goals',(v,p) => strings(v,p),path);
}
function templates(value: unknown, path: string) {
  for (const [category,list] of Object.entries(object(value,path))) {
    objects(list,`${path}.${category}`,(o,at) => {
      required(o,['title','description','emoji'],string,at);
      choice(['easy','medium','hard'])(o.difficulty,`${at}.difficulty`);
    });
  }
}
function portfolio(value: unknown, path: string) {
  objects(value,path,(o,at) => {
    required(o,['id','name','color'],string,at); required(o,['value','allocation'],number(),at); number(-Infinity)(o.change,`${at}.change`);
    for (const key of ['shares','avgPrice']) optional(o,key,number(),at);
  });
}
function market(value: unknown, path: string) {
  objects(value,path,(o,at) => { required(o,['symbol','name'],string,at); required(o,['price','owned','avgPrice'],number(),at); number(-Infinity)(o.change,`${at}.change`); });
}
function savings(value: unknown, path: string) {
  objects(value,path,(o,at) => {
    required(o,['id','name','emoji','category'],string,at); required(o,['targetAmount','savedAmount'],number(),at);
    choice(['low','medium','high'])(o.priority,`${at}.priority`); optional(o,'deadline',date,at);
  });
}
function spending(value: unknown, path: string) {
  objects(value,path,(o,at) => { required(o,['id','description','category','emoji'],string,at); number()(o.amount,`${at}.amount`); date(o.date,`${at}.date`); });
}
function lessons(value: unknown, path: string) {
  objects(value,path,(o,at) => {
    required(o,['id','title','content'],string,at); number()(o.earnings,`${at}.earnings`);
    choice(['locked','available','in-progress','completed'])(o.status,`${at}.status`);
    optional(o,'quiz',(v,p) => {
      const q=object(v,p); string(q.question,`${p}.question`); strings(q.options,`${p}.options`); number(0,true)(q.correctAnswer,`${p}.correctAnswer`);
      if ((q.correctAnswer as number) >= (q.options as string[]).length) invalid(`${p}.correctAnswer`);
    },at);
  });
}
function colors(value: unknown, path: string) {
  const o=object(value,path);
  for (const key of ['moneyGreen','moneyGold','cryptoOrange','successGreen']) {
    string(o[key],`${path}.${key}`);
    const match=/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/.exec(o[key] as string);
    if (!match || +match[1]>360 || +match[2]>100 || +match[3]>100) invalid(`${path}.${key}`);
  }
}
const jsonChecks: Record<string,Check> = { chores, userStats:stats, achievements, profileData:profile, customChoreTemplates:templates, portfolio, marketStocks:market, savingsGoals:savings, spendingTransactions:spending, learnEarnLessons:lessons, customColors:colors };
const metadataKeys = new Set([...Object.keys(jsonChecks), 'weeklyAllowance','cash','marketCash','learnEarnTotal','theme','welcomeModalDismissed','marketSimulatorTutorialDismissed']);
function importMetadata(value: unknown, path: string) {
  const o=object(value,path);
  if (Object.keys(o).length !== 4 || o.version !== 1) invalid(path);
  choice(['legacy-shared','legacy-account'])(o.source,`${path}.source`);
  date(o.consentedAt,`${path}.consentedAt`);
  if (!/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(o.consentedAt as string)) invalid(`${path}.consentedAt`);
  strings(o.fields,`${path}.fields`,true);
  if (!(o.fields as string[]).length || (o.fields as string[]).some(key=>!metadataKeys.has(key))) invalid(`${path}.fields`);
}
jsonChecks.importMetadata=importMetadata;
const numeric = new Set(['weeklyAllowance','cash','marketCash','learnEarnTotal']);
const flags = new Set(['welcomeModalDismissed','marketSimulatorTutorialDismissed']);
export function validateProgressPayloads(data: Record<string,string>): Record<string,string> {
  object(data,'snapshot');
  for (const [key,raw] of Object.entries(data)) {
    string(raw,key);
    if (numeric.has(key)) {
      if (!/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw.trim()) || !Number.isFinite(Number(raw)) || Number(raw)<0) invalid(key);
    } else if (flags.has(key)) {
      if (raw !== 'true' && raw !== 'false') invalid(key);
    } else if (key === 'theme') {
      if (raw !== 'light' && raw !== 'dark') invalid(key);
    } else if (Object.prototype.hasOwnProperty.call(jsonChecks,key)) {
      let value:unknown; try { value=JSON.parse(raw); } catch { invalid(key); }
      jsonChecks[key](value,key);
    } else invalid(key);
  }
  return data;
}
