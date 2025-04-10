from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/analytics', methods=['GET'])
def get_analytics():
    return jsonify({"message": "Analytics service active"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004)
