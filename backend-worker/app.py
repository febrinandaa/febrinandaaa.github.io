"""Flask entry point for Cloud Run."""
from flask import Flask, jsonify, request
from worker import claim_job, execute_job, report_result, get_current_time_wib

app = Flask(__name__)


@app.route('/', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "fb-auto-poster-worker",
        "time": get_current_time_wib().isoformat()
    })


@app.route('/trigger', methods=['POST'])
def trigger():
    """
    Main trigger endpoint called by Cloud Scheduler.
    
    Flow:
    1. Claim job from Vercel API
    2. If job available, execute it
    3. Report result back
    """
    print(f"Trigger received at {get_current_time_wib().isoformat()}")
    
    # Step 1: Claim job
    job = claim_job()
    
    if job.get("status") != "ready":
        print(f"No job to execute: {job.get('message')}")
        return jsonify({
            "executed": False,
            "reason": job.get("status"),
            "message": job.get("message")
        }), 200
    
    # Step 2: Execute job
    print(f"Executing job for page {job.get('page_id')}")
    result = execute_job(job)
    
    # Step 3: Report result
    job_id = job.get("job_id", "unknown")
    report_result(job_id, result.get("success", False), result)
    
    status_code = 200 if result.get("success") else 500
    
    return jsonify({
        "executed": True,
        "success": result.get("success"),
        "page_id": result.get("page_id"),
        "post_id": result.get("post_id"),
        "error_type": result.get("error_type"),
        "error_message": result.get("error_message")
    }), status_code


@app.route('/test', methods=['GET'])
def test():
    """Test endpoint to verify worker is running."""
    return jsonify({
        "message": "Worker is running",
        "time": get_current_time_wib().isoformat(),
        "endpoints": ["/", "/trigger", "/test"]
    })


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
