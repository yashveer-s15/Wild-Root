"""Train an educational neural surrogate from synthetic suitability labels.
No clinical, expedition, or real-world outcome data is used.
"""
import os
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'
import json
from pathlib import Path
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

FEATURES=['fitness','experience','age','difficulty','altitude','elevation_gain','duration','weather_risk']
SCALES=np.array([100,100,3,3,6000,3000,20,1],dtype=np.float32)
OUT=Path(__file__).parent/'models'
def train():
    tf.keras.utils.set_random_seed(42)
    rng=np.random.default_rng(42)
    x=np.column_stack([rng.uniform(10,100,6000),rng.uniform(0,100,6000),rng.integers(0,4,6000),rng.integers(1,4,6000),rng.uniform(500,6000,6000),rng.uniform(100,3000,6000),rng.integers(1,21,6000),rng.uniform(0,1,6000)]).astype(np.float32)
    # Explicit synthetic labeling policy: a learning demonstration, not validated safety advice.
    y=np.clip(35+.43*x[:,0]+.24*x[:,1]-4*x[:,2]-9*(x[:,3]-1)-np.maximum(x[:,4]-2500,0)/190-x[:,5]/400-x[:,6]*.7-x[:,7]*16+rng.normal(0,2,6000),0,100)/100
    train_x,test_x,train_y,test_y=train_test_split(x/SCALES,y,test_size=.2,random_state=42)
    model=tf.keras.Sequential([tf.keras.layers.Input(shape=(8,)),tf.keras.layers.Dense(32,activation='relu'),tf.keras.layers.Dense(16,activation='relu'),tf.keras.layers.Dense(1,activation='sigmoid')])
    model.compile(optimizer='adam',loss='mse',metrics=['mae'])
    model.fit(train_x,train_y,epochs=45,batch_size=64,validation_split=.15,verbose=0)
    predictions=model(test_x,training=False).numpy().flatten()*100
    OUT.mkdir(exist_ok=True)
    model.save(OUT/'suitability.keras')
    metadata={'features':FEATURES,'scales':SCALES.tolist(),'seed':42,'samples':6000,'test_samples':len(test_y),'test_mae_points':float(mean_absolute_error(test_y*100,predictions)),'source':'Synthetic heuristic labels; no real trekking outcomes','architecture':'8 → Dense(32 ReLU) → Dense(16 ReLU) → Dense(1 sigmoid)','tensorflow_version':tf.__version__}
    (OUT/'metadata.json').write_text(json.dumps(metadata,indent=2))
    print(json.dumps(metadata,indent=2))
if __name__=='__main__':train()
