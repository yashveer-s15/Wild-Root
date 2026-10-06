import hashlib,hmac,secrets,json,time,os
from datetime import date
from contextlib import asynccontextmanager
from typing import Literal
from fastapi import FastAPI,HTTPException,Depends,Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,Field,field_validator
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database.repository import connection,initialize,all_treks
from ml.predict import predict,MODEL_DIR

def password_hash(password,salt=None):
    salt=salt or secrets.token_hex(16)
    return salt+':'+hashlib.pbkdf2_hmac('sha256',password.encode(),salt.encode(),240000).hex()
@asynccontextmanager
async def lifespan(app):
    initialize()
    admin_email=os.getenv('WILDROOT_ADMIN_EMAIL')
    admin_password=os.getenv('WILDROOT_ADMIN_PASSWORD')
    if admin_email and admin_password and len(admin_password)>=8:
        with connection() as db:db.execute('INSERT OR IGNORE INTO users(email,name,password,role) VALUES(?,?,?,?)',(admin_email.lower(),'Trail manager',password_hash(admin_password),'admin'))
    yield
app=FastAPI(title='WildRoot API',version='1.0.0',lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=['http://127.0.0.1:5173','http://localhost:5173'],allow_methods=['*'],allow_headers=['*'])
class Credentials(BaseModel):
    email:str=Field(min_length=5,max_length=254)
    password:str=Field(min_length=8,max_length=128)
    name:str=Field(default='Explorer',min_length=2,max_length=60)
    @field_validator('email')
    @classmethod
    def email_check(cls,v):
        v=v.strip().lower()
        if '@' not in v or '.' not in v.split('@')[-1]:raise ValueError('Enter a valid email')
        return v
class Profile(BaseModel):
    fitness:int=Field(75,ge=0,le=100)
    experience:int=Field(35,ge=0,le=100)
    age:int=Field(1,ge=0,le=3)
    adventure:int=Field(70,ge=0,le=100)
    altitude:int=Field(60,ge=0,le=100)
    terrain:str='Forest'
    budget:int=Field(15000,ge=1000,le=1000000)
    days:int=Field(6,ge=1,le=30)
    group:Literal['Solo','Friends','Family','Group']='Friends'
    risk:int=Field(50,ge=0,le=100)
class Prediction(BaseModel):
    fitness:float=Field(ge=0,le=100)
    experience:float=Field(ge=0,le=100)
    age:int=Field(ge=0,le=3)
    difficulty:int=Field(ge=1,le=3)
    altitude:float=Field(ge=0,le=6000)
    elevation_gain:float=Field(ge=0,le=3000)
    duration:int=Field(ge=1,le=20)
    weather_risk:float=Field(ge=0,le=1)
class Booking(BaseModel):
    trek_id:str
    date:date
    travellers:int=Field(ge=1,le=20)
    package:Literal['Standard','Private group']='Standard'
    contact:str=Field(min_length=5,max_length=150)
    emergency:str=Field(min_length=5,max_length=150)
class Trek(BaseModel):
    id:str=Field(pattern=r'^[a-z0-9-]+$',max_length=60)
    name:str=Field(min_length=2,max_length=80)
    location:str=Field(min_length=2,max_length=80)
    difficulty:Literal['Easy','Moderate','Challenging']
    days:int=Field(ge=1,le=20)
    altitude:int=Field(ge=100,le=6000)
    distance:float=Field(ge=1,le=300)
    season:str
    terrain:str
    price:int=Field(ge=0)
    description:str=Field(min_length=10,max_length=1000)
    rating:float=Field(4.7,ge=0,le=5)
    elevation_gain:int=Field(1000,ge=0,le=3000)
    weather_risk:float=Field(.2,ge=0,le=1)
    image:str=Field(default='/images/mountains.jpg',pattern=r'^/images/(?:[a-z0-9-]+|treks/[a-z0-9-]+)\.jpg$')
    protected:bool=False
    highlights:list[str]=[]
    itinerary:list[dict]=[]
    months:list[int]=[]
    photo:str|None=None
    photo_credit:dict[str,str]|None=None
    permit:str='Confirm current local access and permit requirements.'
    source:str|None=None
def user(authorization:str|None=Header(default=None)):
    token=(authorization or '').removeprefix('Bearer ')
    with connection() as db:r=db.execute('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?',(token,time.time())).fetchone()
    if not r:raise HTTPException(401,'Sign in to continue.')
    return dict(r)
def admin(u=Depends(user)):
    if u['role']!='admin':raise HTTPException(403,'Administrator access required.')
    return u
def safe_user(u):return {k:u[k] for k in ['id','email','name','role']}
def session(u):
    token=secrets.token_urlsafe(32)
    with connection() as db:db.execute('INSERT INTO sessions VALUES(?,?,?)',(token,u['id'],time.time()+86400))
    return {'token':token,'user':safe_user(u)}
@app.get('/api/health')
def health():return {'status':'ok','model_available':(MODEL_DIR/'suitability.keras').exists()}
@app.post('/api/auth/register')
def register(c:Credentials):
    with connection() as db:
        if db.execute('SELECT 1 FROM users WHERE email=?',(c.email,)).fetchone():raise HTTPException(409,'This email is already registered.')
        db.execute('INSERT INTO users(email,name,password) VALUES(?,?,?)',(c.email,c.name,password_hash(c.password)))
        u=dict(db.execute('SELECT * FROM users WHERE email=?',(c.email,)).fetchone())
    return session(u)
@app.post('/api/auth/login')
def login(c:Credentials):
    with connection() as db:r=db.execute('SELECT * FROM users WHERE email=?',(c.email,)).fetchone()
    if not r or not hmac.compare_digest(r['password'],password_hash(c.password,r['password'].split(':')[0])):raise HTTPException(401,'Email or password is incorrect.')
    return session(dict(r))
@app.get('/api/auth/me')
def me(u=Depends(user)):return safe_user(u)
@app.post('/api/auth/logout')
def logout(authorization:str|None=Header(default=None)):
    with connection() as db:db.execute('DELETE FROM sessions WHERE token=?',((authorization or '').removeprefix('Bearer '),))
    return {'ok':True}
@app.get('/api/treks')
def treks():return all_treks()
@app.get('/api/profile')
def get_profile(u=Depends(user)):return json.loads(u['profile'])
@app.put('/api/profile')
def profile(p:Profile,u=Depends(user)):
    with connection() as db:db.execute('UPDATE users SET profile=? WHERE id=?',(p.model_dump_json(),u['id']))
    return p
@app.post('/api/predict-suitability')
def suitability(p:Prediction):
    try:return predict(p.model_dump())
    except FileNotFoundError as e:raise HTTPException(503,str(e))
@app.get('/api/saved')
def saved(u=Depends(user)):
    with connection() as db:return [r[0] for r in db.execute('SELECT trek_id FROM saved WHERE user_id=?',(u['id'],))]
@app.post('/api/saved/{trek_id}')
def save(trek_id:str,u=Depends(user)):
    if not any(t['id']==trek_id for t in all_treks()):raise HTTPException(404,'Trek not found.')
    with connection() as db:
        exists=db.execute('SELECT 1 FROM saved WHERE user_id=? AND trek_id=?',(u['id'],trek_id)).fetchone()
        if exists:db.execute('DELETE FROM saved WHERE user_id=? AND trek_id=?',(u['id'],trek_id))
        else:db.execute('INSERT INTO saved VALUES(?,?)',(u['id'],trek_id))
    return {'saved':not bool(exists)}
@app.get('/api/bookings')
def bookings(u=Depends(user)):
    with connection() as db:return [dict(r) for r in db.execute('SELECT * FROM bookings WHERE user_id=?',(u['id'],))]
@app.post('/api/bookings')
def book(b:Booking,u=Depends(user)):
    if b.date<date.today():raise HTTPException(422,'Choose a future travel date.')
    if not any(t['id']==b.trek_id for t in all_treks()):raise HTTPException(404,'Trek not found.')
    id='WR-'+secrets.token_hex(4).upper()
    with connection() as db:db.execute('INSERT INTO bookings(id,user_id,trek_id,date,travellers,package,contact,emergency) VALUES(?,?,?,?,?,?,?,?)',(id,u['id'],b.trek_id,str(b.date),b.travellers,b.package,b.contact,b.emergency))
    return {'id':id,'status':'Confirmed','message':'Demo Project — No Real Payment Required.'}
class Pack(BaseModel):
    items:list[str]=Field(max_length=100)
@app.get('/api/packing/{trek_id}')
def get_pack(trek_id:str,u=Depends(user)):
    with connection() as db:r=db.execute('SELECT items FROM packing WHERE user_id=? AND trek_id=?',(u['id'],trek_id)).fetchone()
    return {'items':json.loads(r[0]) if r else []}
@app.put('/api/packing/{trek_id}')
def put_pack(trek_id:str,p:Pack,u=Depends(user)):
    with connection() as db:db.execute('INSERT INTO packing VALUES(?,?,?) ON CONFLICT(user_id,trek_id) DO UPDATE SET items=excluded.items',(u['id'],trek_id,json.dumps(p.items)))
    return p
@app.get('/api/alerts')
def alerts():
    with connection() as db:return [dict(r) for r in db.execute('SELECT * FROM alerts')]
@app.get('/api/admin/overview')
def overview(u=Depends(admin)):
    with connection() as db:
        users=[dict(r) for r in db.execute('SELECT id,email,name,role,profile FROM users')]
        bookings=[dict(r) for r in db.execute('SELECT * FROM bookings')]
    return {'users':users,'bookings':bookings,'treks':all_treks()}
@app.post('/api/admin/treks')
def add_trek(t:Trek,u=Depends(admin)):
    with connection() as db:
        if db.execute('SELECT 1 FROM treks WHERE id=?',(t.id,)).fetchone():raise HTTPException(409,'Trek ID already exists.')
        db.execute('INSERT INTO treks VALUES(?,?)',(t.id,t.model_dump_json()))
    return t
@app.put('/api/admin/treks/{id}')
def edit_trek(id:str,t:Trek,u=Depends(admin)):
    if id!=t.id:raise HTTPException(422,'Trek IDs cannot be changed.')
    with connection() as db:
        if not db.execute('UPDATE treks SET data=? WHERE id=?',(t.model_dump_json(),id)).rowcount:raise HTTPException(404,'Trek not found.')
    return t
@app.delete('/api/admin/treks/{id}')
def delete_trek(id:str,u=Depends(admin)):
    with connection() as db:
        if db.execute('SELECT 1 FROM bookings WHERE trek_id=?',(id,)).fetchone():raise HTTPException(409,'A booked trek cannot be deleted. Edit its description instead.')
        db.execute('DELETE FROM treks WHERE id=?',(id,))
    return {'ok':True}
class Status(BaseModel):
    status:Literal['Confirmed','Cancelled','Completed']
@app.patch('/api/admin/bookings/{id}')
def booking_status(id:str,s:Status,u=Depends(admin)):
    with connection() as db:
        if not db.execute('UPDATE bookings SET status=? WHERE id=?',(s.status,id)).rowcount:raise HTTPException(404,'Booking not found.')
    return s
class Alert(BaseModel):
    title:str=Field(min_length=3,max_length=100)
    description:str=Field(min_length=5,max_length=500)
@app.post('/api/admin/alerts')
def add_alert(a:Alert,u=Depends(admin)):
    with connection() as db:db.execute('INSERT INTO alerts(title,description) VALUES(?,?)',(a.title,a.description))
    return a
@app.delete('/api/admin/alerts/{id}')
def remove_alert(id:int,u=Depends(admin)):
    with connection() as db:db.execute('DELETE FROM alerts WHERE id=?',(id,))
    return {'ok':True}

# Production container serves the built React app and API from the same origin.
FRONTEND_DIST=Path(os.getenv('WILDROOT_FRONTEND_DIST') or str(Path(__file__).resolve().parents[1]/'frontend'/'dist')).resolve()
if (FRONTEND_DIST/'index.html').exists():
    app.mount('/assets',StaticFiles(directory=FRONTEND_DIST/'assets'),name='assets')
    app.mount('/images',StaticFiles(directory=FRONTEND_DIST/'images'),name='images')
    @app.get('/{path:path}',include_in_schema=False)
    def frontend_page(path:str):
        if path=='api' or path.startswith('api/'):
            raise HTTPException(404,'API route not found.')
        candidate=(FRONTEND_DIST/path).resolve()
        if candidate.is_relative_to(FRONTEND_DIST) and candidate.is_file():
            return FileResponse(candidate)
        if Path(path).suffix:
            raise HTTPException(404,'File not found.')
        return FileResponse(FRONTEND_DIST/'index.html')
