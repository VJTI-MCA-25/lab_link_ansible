import logging
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from .middleware import CacheMiddleware

logger = logging.getLogger(__name__)


def error_handler(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            result = func(*args, **kwargs)
            return result
        except Exception as e:
            logger.error(f"Error in view {func.__name__}: {str(e)}")
            return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return wrapper


def generate_cache_key(prefix):
    def get_cache_key(*args, **kwargs):
        # Extract the host_id from kwargs
        host_id = kwargs.get('host_id')
        return f'{prefix}_{host_id}'
    return get_cache_key


def cache_response(get_cache_key):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            request = args[0] if args else kwargs.get('request')
            cache_key = get_cache_key(*args, **kwargs)

            if not request.uncache:
                cached_data = cache.get(cache_key)
                if cached_data:
                    response = Response(cached_data, status=status.HTTP_200_OK)
                    response['X-Data-Source'] = 'CACHE'
                    return response

            # Call the original function to get the data
            response = func(*args, **kwargs)

            # Extract the data from the response
            if response.status_code == status.HTTP_200_OK:
                data = response.data
                # Cache the data
                cache.set(cache_key, data, 60 * 15)
                response['X-Data-Source'] = 'RUN'

            # Return the data wrapped in a Response
            return response
        return wrapper
    return decorator


def cache_middleware(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        middleware_instance = CacheMiddleware(
            lambda req: view_func(req, *args, **kwargs))
        return middleware_instance(request)
    return _wrapped_view


def cached_view(get_cache_key):
    def decorator(view_func):
        @wraps(view_func)
        @cache_middleware
        @cache_response(get_cache_key)
        def _wrapped_view(request, *args, **kwargs):
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator
