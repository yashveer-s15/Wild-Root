"""Retrieve Commons candidates; selected images are reviewed before download."""
import json,time,urllib.request,urllib.parse,concurrent.futures
from pathlib import Path
ROOT=Path(__file__).parent
HEADERS={'User-Agent':'WildRootEducationalProject/1.0 (trek photography attribution research)'}
def request(params):
    url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)
    with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=45) as r:return json.load(r)
def candidates(t):
    query={'roopkund':'Roopkund','chopta-chandrashila':'Chandrashila','chandratal':'Chandra Taal','gaumukh-tapovan':'Gaumukh','pindari-glacier':'Pindari Glacier','kafni-glacier':'Kafni Glacier'}.get(t['id'],t['name'])
    try:
        data=request({'action':'query','format':'json','generator':'search','gsrsearch':query,'gsrnamespace':6,'gsrlimit':5,'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':1000})
        result=[]
        for page in sorted(data.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',99)):
            info=page.get('imageinfo',[{}])[0];meta=info.get('extmetadata',{})
            result.append({'title':page['title'],'source':info.get('descriptionurl'),'url':info.get('thumburl',info.get('url')),'width':info.get('width'),'height':info.get('height'),'description':meta.get('ImageDescription',{}).get('value','')[:900],'artist':meta.get('Artist',{}).get('value',''),'license':meta.get('LicenseShortName',{}).get('value',''),'license_url':meta.get('LicenseUrl',{}).get('value','')})
        return t['id'],result
    except Exception as e:return t['id'],{'error':str(e)}
if __name__=='__main__':
    treks=json.loads((ROOT/'backend/data.json').read_text(encoding='utf-8'))
    cache=ROOT/'photo_candidates.json'
    results=json.loads(cache.read_text(encoding='utf-8')) if cache.exists() else {}
    for t in treks:
        if isinstance(results.get(t['id']),list) and results[t['id']]:continue
        time.sleep(5)
        id,items=candidates(t)
        results[id]=items
        cache.write_text(json.dumps(results,indent=2,ensure_ascii=False),encoding='utf-8')
        print(json.dumps({'id':id,'results':[{'n':i,'title':x['title'],'description':x['description'][:220],'license':x['license'],'size':[x['width'],x['height']]} for i,x in enumerate(items)] if isinstance(items,list) else items},ensure_ascii=True),flush=True)
