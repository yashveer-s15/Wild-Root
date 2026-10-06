import os
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL','2')
import json
from pathlib import Path
from functools import lru_cache
import numpy as np
MODEL_DIR=Path(__file__).parent/'models'
@lru_cache
def load():
    import tensorflow as tf
    if not (MODEL_DIR/'suitability.keras').exists():
        raise FileNotFoundError('Train the model with python -m ml.train_model first.')
    return tf.keras.models.load_model(MODEL_DIR/'suitability.keras'),json.loads((MODEL_DIR/'metadata.json').read_text())
def predict(values):
    model,meta=load()
    inputs=np.array([[values[name] for name in meta['features']]],dtype=np.float32)/np.array(meta['scales'],dtype=np.float32)
    score=round(float(model(inputs,training=False).numpy()[0,0])*100,1)
    return {'score':score,'classification':'Highly Suitable' if score>=80 else 'Suitable' if score>=60 else 'Challenging' if score>=40 else 'Not Recommended','model':'TensorFlow dense neural network','training_data':'synthetic'}
