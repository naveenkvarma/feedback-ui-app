import json
import uuid
import boto3
import os
from datetime import datetime

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
# Expecting table name to be passed via Environment Variable
TABLE_NAME = os.environ.get('FEEDBACK_TABLE', 'TeacherFeedback')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    try:
        # Parse the incoming JSON body
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        required_fields = ['student_name', 'student_email', 'teacher_id', 'teacher_name', 'ratings', 'mcq', 'text_responses']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Credentials': True,
                    },
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # Prepare item for DynamoDB
        feedback_id = str(uuid.uuid4())
        timestamp = body.get('timestamp', datetime.utcnow().isoformat() + 'Z')
        
        item = {
            'feedback_id': feedback_id,
            'student_name': body['student_name'],
            'student_email': body['student_email'],
            'teacher_id': body['teacher_id'],
            'teacher_name': body['teacher_name'],
            'subject': body.get('subject', 'General'),
            'ratings': body['ratings'],  # Map of q1-q10 to 1-5
            'mcq': body['mcq'],          # Map of mcq fields
            'text_responses': body['text_responses'],
            'timestamp': timestamp
        }
        
        # Save to DynamoDB
        table.put_item(Item=item)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
            },
            'body': json.dumps({
                'message': 'Feedback submitted successfully',
                'feedback_id': feedback_id
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
