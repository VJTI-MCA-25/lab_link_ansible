class CacheMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.uncache = request.GET.get('uncached') == 'true'
        response = self.get_response(request)

        if 'X-Data-Source' not in response:
            response['X-Data-Source'] = 'RUN'

        return response
