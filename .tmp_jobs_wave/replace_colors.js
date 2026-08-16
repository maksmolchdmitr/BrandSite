(() => {
  const m = monaco.editor.getModels()[0];
  let v = m.getValue();
  function stripFn(src, name) {
    const start = src.indexOf('function ' + name);
    if (start < 0) return src;
    const rest = src.slice(start + 1);
    const nextRel = rest.search(/\nfunction /);
    const end = nextRel < 0 ? src.length : start + 1 + nextRel;
    return src.slice(0, start) + src.slice(end);
  }
  v = stripFn(v, 'applyStatusColorRules');
  v = stripFn(v, 'styleAndFixSheet');
  v = v.replace(/\s*$/, '') + '\n\n' + window.__COLORS_FULL;
  m.setValue(v);
  return {ok:true, has: v.includes('#B6D7A8') && v.includes('applyStatusColorRules'), len:v.length};
})()
