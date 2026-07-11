import os
import typesense

TYPESENSE_HOST = os.environ.get("TYPESENSE_HOST", "localhost")
TYPESENSE_PORT = os.environ.get("TYPESENSE_PORT", "8108")
TYPESENSE_PROTOCOL = os.environ.get("TYPESENSE_PROTOCOL", "http")
TYPESENSE_API_KEY = os.environ.get("TYPESENSE_API_KEY", "xyz")

ts_client = typesense.Client({
    'nodes': [{
        'host': TYPESENSE_HOST,
        'port': TYPESENSE_PORT,
        'protocol': TYPESENSE_PROTOCOL,
    }],
    'api_key': TYPESENSE_API_KEY,
    'connection_timeout_seconds': 2
})

def search_products(text_query: str, embedding: list[float] = None):
    try:
        search_params = {
            'q': text_query if text_query else "*",
            'query_by': 'style_name,color,category,brand,fabric,print'
        }
        
        # If we have a vector embedding, use true vector search
        if embedding:
            vector_str = ",".join(str(v) for v in embedding)
            search_params['vector_query'] = f"embedding:([{vector_str}], k:12)"
            
        result = ts_client.multi_search.perform({
            "searches": [
                {
                    "collection": "products",
                    **search_params
                }
            ]
        }, {})
        
        return [hit['document'] for hit in result['results'][0].get('hits', [])]
    except Exception as e:
        print(f"Typesense Search Error: {e}")
        return []
