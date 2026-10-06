"""Supports workspace-local dependencies as well as a normal virtual environment."""
import sys
from pathlib import Path
deps=Path(__file__).parent/'.deps'
if deps.exists():sys.path.insert(0,str(deps))
import uvicorn
if __name__=='__main__':uvicorn.run('main:app',host='127.0.0.1',port=8000)
