// ناقل أحداث صغير: يفصل منطق اللعبة عن الصوت والواجهة والتحليلات.
const handlers = new Map();

export function on(event, fn){
  if(!handlers.has(event)) handlers.set(event, []);
  handlers.get(event).push(fn);
}

export function emit(event, data){
  const list = handlers.get(event);
  if(!list) return;
  for(const fn of list){
    try{ fn(data); }catch(err){ console.error("[bus]", event, err); }
  }
}
