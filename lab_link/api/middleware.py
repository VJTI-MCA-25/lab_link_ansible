class CommonMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.uncache = request.GET.get('uncached') == 'true'
        response = self.get_response(request)

        if 'X-Cache-Status' not in response:
            response['X-Cache-Status'] = 'MISS'
        if 'X-Db-Status' not in response:
            response['X-Db-Status'] = 'MISS'
        # Optionally, add this for debugging purposes
        # response['X-Uncache'] = str(request.uncache).lower()

        return response
