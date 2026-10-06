import json,urllib.request,time,html,re,sqlite3
from pathlib import Path
from find_trek_photos import ROOT,HEADERS
choices={'kedarkantha':0,'hampta-pass':0,'valley-of-flowers':0,'kumara-parvatha':1,'tadiandamol':0,'kudremukh':1,'sandakphu':0,'dayara-bugyal':3,'brahmatal':1,'triund':2,'nag-tibba':0,'chopta-chandrashila':0,'har-ki-dun':0,'roopkund':2,'beas-kund':0,'kareri-lake':3,'prashar-lake':0,'indrahar-pass':0,'bhrigu-lake':0,'chandratal':1,'churdhar':3,'rajmachi':1,'harishchandragad':3,'kalsubai':0,'ratangad':3,'rajgad':2,'sandhan-valley':0,'pindari-glacier':0,'kafni-glacier':0,'gaumukh-tapovan':0}
candidates=json.loads((ROOT/'photo_candidates.json').read_text(encoding='utf-8'))
selected={key:candidates[key][index] for key,index in choices.items()}
out=ROOT/'frontend/public/images/treks';out.mkdir(exist_ok=True)
for key,p in selected.items():
 dest=out/(key+'.jpg')
 if not dest.exists():
  for attempt in range(4):
   try:
    with urllib.request.urlopen(urllib.request.Request(p['url'],headers=HEADERS),timeout=60) as response: raw=response.read()
    assert raw[:2]==b'\xff\xd8',key
    dest.write_bytes(raw);break
   except Exception:
    if attempt==3:raise
    time.sleep(10)
  time.sleep(1)
 print(key,dest.stat().st_size,flush=True)
manifest=[]
for name in ['frontend/src/data/treks.json','backend/data.json']:
 path=ROOT/name;treks=json.loads(path.read_text(encoding='utf-8'))
 for t in treks:
  p=selected[t['id']];t['image']=t['photo']='/images/treks/'+t['id']+'.jpg'
  t['photo_credit']={'title':p['title'].removeprefix('File:'),'author':html.unescape(re.sub('<[^>]+>','',p['artist'])).strip(),'source':p['source'],'license':p['license'],'license_url':p['license_url']}
 path.write_text(json.dumps(treks,indent=2,ensure_ascii=False),encoding='utf-8')
 if name.startswith('backend'):
  with sqlite3.connect(ROOT/'backend/wildroot.db') as db:
   for t in treks:
    row=db.execute('SELECT data FROM treks WHERE id=?',(t['id'],)).fetchone()
    if row:
     current=json.loads(row[0]);current.update({k:t[k] for k in ['image','photo','photo_credit']});db.execute('UPDATE treks SET data=? WHERE id=?',(json.dumps(current),t['id']))
  manifest=[{'trek':t['name'],'image':t['image'],**t['photo_credit']} for t in treks]
(ROOT/'frontend/public/images/treks/credits.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding='utf-8')
print('Updated all 30 catalog photographs.')
