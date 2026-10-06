import json
from find_trek_photos import request,ROOT
names={'nag-tibba':'File:Nag Tibba 01.jpg','chopta-chandrashila':'File:Chandrashila trek.jpg','har-ki-dun':'File:Har Ki Dun.jpg','beas-kund':'File:Beas kund.jpg','gaumukh-tapovan':'File:Gomukh the source of Ganga.jpg'}
data=request({'action':'query','format':'json','titles':'|'.join(names.values()),'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':1000})
d=json.loads((ROOT/'photo_candidates.json').read_text(encoding='utf-8'))
for p in data['query']['pages'].values():
 i=p['imageinfo'][0];m=i['extmetadata']; key=next(k for k,v in names.items() if v==p['title'])
 d[key]=[dict(title=p['title'],source=i['descriptionurl'],url=i.get('thumburl',i['url']),width=i['width'],height=i['height'],description=m.get('ImageDescription',{}).get('value',''),artist=m.get('Artist',{}).get('value',''),license=m.get('LicenseShortName',{}).get('value',''),license_url=m.get('LicenseUrl',{}).get('value',''))]
 print(key,d[key][0]['license'])
(ROOT/'photo_candidates.json').write_text(json.dumps(d,indent=2,ensure_ascii=False),encoding='utf-8')
