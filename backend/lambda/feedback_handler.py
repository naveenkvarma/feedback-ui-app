import json
import uuid
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
FEEDBACK_TABLE = os.environ.get('FEEDBACK_TABLE', 'EduFeedback')
table = dynamodb.Table(FEEDBACK_TABLE)

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
    }
    
    http_method = event.get('httpMethod')
    
    if http_method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    try:
        if http_method == 'GET':
            response = table.scan()
            items = response.get('Items', [])
            items.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'feedback': items})}
            
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            # Basic validation
            required_fields = ['student_name', 'student_email', 'teacher_id', 'teacher_name', 'ratings', 'mcq', 'text_responses']
            for field in required_fields:
                if field not in body:
                    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': f'Missing field: {field}'})}
            
            feedback_id = str(uuid.uuid4())
            timestamp = body.get('timestamp', datetime.utcnow().isoformat() + 'Z')
            
            item = {
                'feedback_id': feedback_id,
                'student_name': body['student_name'],
                'student_email': body['student_email'],
                'teacher_id': body['teacher_id'],
                'teacher_name': body['teacher_name'],
                'subject': body.get('subject', 'General'),
                'ratings': body['ratings'],
                'mcq': body['mcq'],
                'text_responses': body['text_responses'],
                'timestamp': timestamp
            }
            
            table.put_item(Item=item)
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True, 'feedback_id': feedback_id})}
            
        else:
            return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}

    except Exception as e:
        print(f"Error: {str(e)}")
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': 'Internal server error'})}
