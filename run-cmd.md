## 🚀 How to Run the Complete System
# Terminal 1 - API Bridge
bash
cd sane-ai-tester-api
npm install
npm start

# Terminal 2 - Brain Backend
bash
cd sane-ai-tester-brain
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Edit .env with your values
python src/main.py

# Terminal 3 - React Dashboard
bash
cd sane-ai-tester-brain/dashboard
npm install
npm run dev


## Access the Application
Dashboard: http://localhost:5173
Brain API: http://localhost:8000
API Bridge: http://localhost:3000
Complete project is ready! 🎉