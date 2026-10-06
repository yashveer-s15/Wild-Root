import os,sys,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
if (ROOT/'.deps').exists():sys.path.insert(0,str(ROOT/'.deps'))
tmp=tempfile.TemporaryDirectory()
os.environ['WILDROOT_DB']=str(Path(tmp.name)/'test.db')
os.environ['WILDROOT_ADMIN_EMAIL']='admin@example.test'
os.environ['WILDROOT_ADMIN_PASSWORD']='test-only-admin-password'
from fastapi.testclient import TestClient
from main import app
from database.repository import connection
class APIFlow(unittest.TestCase):
    def test_production_frontend_routes(self):
        from main import FRONTEND_DIST
        if not (FRONTEND_DIST/'index.html').exists():
            self.skipTest('Build the frontend to check production routing')
        for route in ['/', '/signin', '/faq', '/treks/kedarkantha']:
            response=self.client.get(route)
            self.assertEqual(response.status_code,200)
            self.assertIn('text/html',response.headers['content-type'])
        self.assertEqual(self.client.get('/api/missing-route').status_code,404)
        self.assertEqual(self.client.get('/missing-image.jpg').status_code,404)
        self.assertEqual(self.client.get('/images/treks/kedarkantha.jpg').status_code,200)
    @classmethod
    def setUpClass(cls):
        cls.context=TestClient(app)
        cls.client=cls.context.__enter__()
        cls.a=cls.client.post('/api/auth/register',json={'name':'Explorer','email':'one@example.test','password':'test-only-password'}).json()
        cls.b=cls.client.post('/api/auth/register',json={'name':'Second','email':'two@example.test','password':'test-only-password'}).json()
        cls.headers={'Authorization':'Bearer '+cls.a['token']}
        cls.other={'Authorization':'Bearer '+cls.b['token']}
        admin=cls.client.post('/api/auth/login',json={'email':'admin@example.test','password':'test-only-admin-password'}).json()
        cls.admin={'Authorization':'Bearer '+admin['token']}
    @classmethod
    def tearDownClass(cls):cls.context.__exit__(None,None,None);tmp.cleanup()
    def test_auth_boundaries(self):
        self.assertEqual(self.client.get('/api/bookings').status_code,401)
        self.assertEqual(self.client.get('/api/admin/overview',headers=self.headers).status_code,403)
        self.assertEqual(self.client.post('/api/auth/login',json={'email':'one@example.test','password':'wrong-password'}).status_code,401)
        self.assertEqual(self.client.post('/api/auth/register',json={'email':'one@example.test','password':'test-only-password'}).status_code,409)
    def test_booking_validation_and_isolation(self):
        b={'trek_id':'kedarkantha','date':'2099-01-01','travellers':2,'package':'Standard','contact':'test@example.test','emergency':'Test 1234567890'}
        self.assertEqual(self.client.post('/api/bookings',json={**b,'travellers':0},headers=self.headers).status_code,422)
        self.assertEqual(self.client.post('/api/bookings',json={**b,'date':'2020-01-01'},headers=self.headers).status_code,422)
        r=self.client.post('/api/bookings',json=b,headers=self.headers)
        self.assertEqual(r.status_code,200)
        self.assertTrue(r.json()['id'].startswith('WR-'))
        self.assertEqual(self.client.get('/api/bookings',headers=self.other).json(),[])
        id=r.json()['id']
        self.assertEqual(self.client.patch('/api/admin/bookings/'+id,json={'status':'Completed'},headers=self.admin).status_code,200)
        self.assertEqual(self.client.delete('/api/admin/treks/kedarkantha',headers=self.admin).status_code,409)
    def test_saved_and_packing_isolation(self):
        self.assertTrue(self.client.post('/api/saved/tadiandamol',headers=self.headers).json()['saved'])
        self.assertIn('tadiandamol',self.client.get('/api/saved',headers=self.headers).json())
        self.assertEqual(self.client.get('/api/saved',headers=self.other).json(),[])
        self.assertFalse(self.client.post('/api/saved/tadiandamol',headers=self.headers).json()['saved'])
        self.client.put('/api/packing/tadiandamol',json={'items':['Headlamp']},headers=self.headers)
        self.assertEqual(self.client.get('/api/packing/tadiandamol',headers=self.headers).json()['items'],['Headlamp'])
        self.assertEqual(self.client.get('/api/packing/tadiandamol',headers=self.other).json()['items'],[])
    def test_admin_crud(self):
        t=self.client.get('/api/treks').json()[0]
        t={**t,'id':'test-trail','name':'Test trail'}
        self.assertEqual(self.client.post('/api/admin/treks',json=t,headers=self.headers).status_code,403)
        self.assertEqual(self.client.post('/api/admin/treks',json=t,headers=self.admin).status_code,200)
        t['difficulty']='Easy'
        self.assertEqual(self.client.put('/api/admin/treks/test-trail',json=t,headers=self.admin).status_code,200)
        self.assertEqual(self.client.delete('/api/admin/treks/test-trail',headers=self.admin).status_code,200)
    def test_neural_prediction(self):
        p={'fitness':80,'experience':50,'age':1,'difficulty':2,'altitude':3810,'elevation_gain':1000,'duration':6,'weather_risk':.2}
        response=self.client.post('/api/predict-suitability',json=p)
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.json()['training_data'],'synthetic')
        score=response.json()['score']
        self.assertGreaterEqual(score,0);self.assertLessEqual(score,100)
        stronger=self.client.post('/api/predict-suitability',json={**p,'fitness':100,'experience':100}).json()['score']
        self.assertGreater(stronger,score)
        self.assertEqual(self.client.post('/api/predict-suitability',json={**p,'altitude':10000}).status_code,422)
    def test_profile_and_alerts(self):
        self.assertEqual(self.client.put('/api/profile',json={'fitness':88},headers=self.headers).status_code,200)
        self.assertEqual(self.client.get('/api/profile',headers=self.headers).json()['fitness'],88)
        self.assertEqual(self.client.get('/api/profile',headers=self.other).json(),{})
        self.assertEqual(self.client.post('/api/admin/alerts',json={'title':'Test alert','description':'Local condition advisory'},headers=self.admin).status_code,200)
        self.assertTrue(self.client.get('/api/alerts').json())
        with connection() as db:
            password=db.execute('SELECT password FROM users WHERE email=?',('one@example.test',)).fetchone()[0]
        self.assertNotIn('test-only-password',password)
if __name__=='__main__':unittest.main(verbosity=2)
