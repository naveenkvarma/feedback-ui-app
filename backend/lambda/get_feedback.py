import json
import boto3
import os

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
# Expecting table name to be passed via Environment Variable
TABLE_NAME = os.environ.get('FEEDBACK_TABLE', 'TeacherFeedback')
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    try:
        # Scan DynamoDB to get all feedback
        # Note: For production with large datasets, Query with pagination is preferred over Scan
        response = table.scan()
        items = response.get('Items', [])
        
        # Sort items by timestamp (newest first)
        items.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
            },
            'body': json.dumps({'feedback': items})
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
