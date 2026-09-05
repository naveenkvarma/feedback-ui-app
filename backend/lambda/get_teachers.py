import json

# For demonstration, returning a static list.
# In a real application, this could fetch from a DynamoDB 'Teachers' table.
MOCK_TEACHERS = [
  { 'id': 't1', 'name': 'Dr. Alan Turing', 'subject': 'Computer Science', 'department': 'CS Dept' },
  { 'id': 't2', 'name': 'Prof. Marie Curie', 'subject': 'Physics', 'department': 'Science Dept' },
  { 'id': 't3', 'name': 'Dr. John von Neumann', 'subject': 'Mathematics', 'department': 'Math Dept' },
  { 'id': 't4', 'name': 'Prof. Grace Hopper', 'subject': 'Software Engineering', 'department': 'CS Dept' }
]

def lambda_handler(event, context):
    try:
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
            },
            'body': json.dumps({'teachers': MOCK_TEACHERS})
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
