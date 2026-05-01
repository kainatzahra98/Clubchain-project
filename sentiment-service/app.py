from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pickle
import numpy as np

# Try to import tensorflow, but allow fallback if not installed yet
try:
    import tensorflow as tf
    from tensorflow.keras.preprocessing.sequence import pad_sequences
    HAS_TF = True
except ImportError:
    HAS_TF = False

app = Flask(__name__)
CORS(app)

# Configuration
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model", "feedback_sentiment_model")
MODEL_PATH = os.path.join(MODEL_DIR, "sentiment_model.keras")
# Fallback to .h5 if .keras is not there
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(MODEL_DIR, "sentiment_model.h5")
    
TOKENIZER_PATH = os.path.join(MODEL_DIR, "tokenizer.pickle")

# Global variables for model and tokenizer
model = None
tokenizer = None
MODEL_LOADED = False

def load_ai_model():
    global model, tokenizer, MODEL_LOADED
    
    if not HAS_TF:
        print("TensorFlow not installed. Running in heuristic mode.")
        return False

    try:
        # Load the model
        if os.path.exists(MODEL_PATH):
            print(f"Loading model from {MODEL_PATH}...")
            model = tf.keras.models.load_model(MODEL_PATH)
            
            # Load the tokenizer
            if os.path.exists(TOKENIZER_PATH):
                print(f"Loading tokenizer from {TOKENIZER_PATH}...")
                with open(TOKENIZER_PATH, 'rb') as handle:
                    tokenizer = pickle.load(handle)
                
                MODEL_LOADED = True
                print("AI Model and Tokenizer loaded successfully!")
                return True
            else:
                print(f"Tokenizer not found at {TOKENIZER_PATH}")
        else:
            print(f"Model not found at {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading AI model: {e}")
    
    return False

# Attempt initial load
load_ai_model()

def get_sentiment(text):
    if MODEL_LOADED:
        try:
            # Preprocess text
            sequences = tokenizer.texts_to_sequences([text])
            # Defaulting to 100 maxlen, you might need to adjust based on your training
            padded = pad_sequences(sequences, maxlen=100) 
            
            # Predict
            prediction = model.predict(padded)[0][0]
            
            # Interpret result (assuming 0=negative, 1=positive if using sigmoid)
            # Neutral range: 0.4 to 0.6
            if 0.4 <= prediction <= 0.6:
                return "neutral", float(prediction)
            elif prediction > 0.6:
                return "positive", float(prediction)
            else:
                return "negative", float(1 - prediction)
        except Exception as e:
            print(f"AI Prediction error: {e}")
            return "neutral", 0.5
    
    # Fallback heuristic for demonstration
    text = text.lower()
    negative_words = [
        'bad', 'terrible', 'awful', 'worst', 'poor', 'hate', 'disappointed', 'slow', 'broken', 'expensive',
        'confusing', 'hard', 'difficult', 'annoying', 'useless', 'fail', 'bug', 'crash', 'lag', 'unhappy',
        'frustrating', 'horrible', 'waste', 'clunky', 'messy', 'rubbish', 'sucks', 'stupid', 'glitch'
    ]
    positive_words = [
        'good', 'great', 'excellent', 'amazing', 'love', 'fast', 'happy', 'best', 'cheap', 'recommended',
        'easy', 'useful', 'helpful', 'beautiful', 'nice', 'perfect', 'awesome', 'enjoy', 'smooth', 'clean',
        'brilliant', 'fantastic', 'wonderful', 'secure', 'friendly', 'super'
    ]
    
    score = 0
    words = text.split()
    for word in words:
        # Simple word matching, can be improved with stemming or regex
        clean_word = word.strip('.,!?()[]"')
        if clean_word in negative_words: score -= 1
        if clean_word in positive_words: score += 1
            
    if score < 0: return "negative", 0.7
    elif score > 0: return "positive", 0.7
    else: return "neutral", 0.5

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    text = data['text']
    sentiment, confidence = get_sentiment(text)
    
    return jsonify({
        "sentiment": sentiment,
        "confidence": round(float(confidence), 2)
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": MODEL_LOADED,
        "mode": "AI" if MODEL_LOADED else "Heuristic"
    })

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "message": "Clubchain Sentiment Service is running!",
        "status": "online"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
